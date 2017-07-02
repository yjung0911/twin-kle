const pool = require('../pool')
const {poolQuery} = require('../helpers')
const {requireAuth} = require('../auth')
const {processedString, processedTitleString} = require('../helpers/stringHelpers')
const {fetchPlaylists} = require('../helpers/playlistHelpers')
const async = require('async')
const express = require('express')
const router = express.Router()
const {stringIsEmpty} = require('../helpers/stringHelpers')

router.get('/', (req, res) => {
  const {shownPlaylists} = req.query
  const where = shownPlaylists ? 'WHERE ' + shownPlaylists.map(id => `id != ${id}`).join(' AND ') : ''
  const query = `
    SELECT id AS playlistId FROM vq_playlists ${where}
    ORDER BY timeStamp DESC, id DESC LIMIT 4
  `
  return fetchPlaylists(query).then(
    playlists => res.send({playlists})
  ).catch(
    err => {
      console.error(err)
      res.status(500).send(err)
    }
  )
})

router.get('/playlist', (req, res) => {
  const {playlistId, shownVideos, noLimit} = req.query
  const where = shownVideos ? 'AND ' + shownVideos.map(id => `a.videoId != ${id}`).join(' AND ') : ''
  const query = `
    SELECT a.videoId AS id, b.title, b.content, b.uploader AS uploaderId, c.username AS uploaderName
    FROM vq_playlistvideos a JOIN vq_videos b ON a.videoId = b.id JOIN users c ON b.uploader = c.id
    WHERE a.playlistId = ? ${where}${noLimit ? '' : ' LIMIT 11'}
  `
  return poolQuery(query, playlistId).then(
    videos => res.send(videos)
  ).catch(
    err => {
      console.error(err)
      res.status(500).send(err)
    }
  )
})

router.post('/', requireAuth, (req, res) => {
  const user = req.user
  const title = processedTitleString(req.body.title)
  const description = processedString(req.body.description)
  const videos = req.body.selectedVideos
  const taskArray = []
  async.waterfall([
    (callback) => {
      const uploaderId = user.id
      const uploaderName = user.username
      const post = {title, description, creator: uploaderId, timeStamp: Math.floor(Date.now()/1000)}
      pool.query('INSERT INTO vq_playlists SET ?', post, (err, res) => {
        const playlistId = res.insertId
        callback(err, playlistId, uploaderName, uploaderId)
      })
    },
    (playlistId, uploaderName, uploaderId, callback) => {
      for (let i = 0; i < videos.length; i++) {
        taskArray.push(callback => {
          let playlistVideo = {playlistId: playlistId, videoId: videos[i]}
          pool.query('INSERT INTO vq_playlistvideos SET ?', playlistVideo, function(err) {
            callback(err)
          })
        })
      }
      async.series(taskArray, function(err) {
        if (err) return callback(err)
        const query = `
          SELECT a.id, a.videoId, b.title AS video_title, b.content, c.username AS video_uploader,
          COUNT(d.id) AS numLikes
          FROM vq_playlistvideos a JOIN vq_videos b ON a.videoId = b.id LEFT JOIN users c ON b.uploader = c.id
          LEFT JOIN content_likes d ON b.id = d.rootId AND d.rootType = 'video'
          WHERE a.playlistId = ? GROUP BY a.id ORDER BY a.id
        `
        pool.query(query, playlistId, (err, rows) => {
          callback(err, {
            playlist: rows,
            title: title,
            id: playlistId,
            uploader: uploaderName,
            uploaderId: uploaderId
          })
        })
      })
    }
  ], (err, result) => {
    if (err) {
      console.error(err)
      return res.status(500).send({error: err})
    }
    res.send({result})
  })
})

router.post('/edit/title', requireAuth, (req, res) => {
  const title = req.body.title
  const playlistId = req.body.playlistId
  const newTitle = processedTitleString(title)
  const post = {
    title: newTitle
  }
  pool.query('UPDATE vq_playlists SET ? WHERE id = ?', [post, playlistId], err => {
    if (err) {
      console.error(err)
      return res.status(500).send({error: err})
    }
    res.json({result: newTitle})
  })
})

router.post('/edit/videos', requireAuth, (req, res) => {
  const playlistId = req.body.playlistId
  const selectedVideos = req.body.selectedVideos

  return poolQuery('DELETE FROM vq_playlistvideos WHERE playlistId = ?', playlistId).then(
    () => {
      let tasks = []
      for (let i = 0; i < selectedVideos.length; i++) {
        tasks.push(() => poolQuery('INSERT INTO vq_playlistvideos SET ?', {playlistId, videoId: selectedVideos[i]}))
      }
      return Promise.all([
        tasks.reduce((promise, task) => promise.then(task), Promise.resolve()),
        poolQuery(
          'UPDATE vq_playlists SET ? WHERE id = ?',
          [{timeStamp: Math.floor(Date.now()/1000)}, playlistId]
        )
      ])
    }
  ).then(
    () => {
      let query = `
        SELECT a.id, a.videoId, b.title AS video_title, b.content, c.username AS video_uploader,
        COUNT(d.id) AS numLikes
        FROM vq_playlistvideos a
          JOIN vq_videos b ON a.videoId = b.id
          LEFT JOIN users c ON b.uploader = c.id
          LEFT JOIN content_likes d ON b.id = d.rootId AND d.rootType = 'video'
        WHERE a.playlistId = ? GROUP BY a.id ORDER BY a.id
      `
      return poolQuery(query, playlistId)
    }
  ).then(
    result => res.send({result})
  ).catch(
    err => {
      console.error(err)
      res.status(500).send({error: err})
    }
  )
})

router.delete('/', requireAuth, (req, res) => {
  const playlistId = typeof req.query.playlistId !== 'undefined' ? Number(req.query.playlistId) : 0
  async.waterfall([
    (callback) => {
      pool.query('SELECT * FROM vq_playlists WHERE id = ?', playlistId, (err, rows) => {
        if (!rows || rows.length === 0) return callback('User is not the owner of the playlist')
        callback(err)
      })
    },
    (callback) => {
      async.parallel([
        (callback) => {
          pool.query('DELETE FROM vq_playlists WHERE id = ?', playlistId, (err, result) => {
            callback(err, result)
          })
        },
        (callback) => {
          pool.query('DELETE FROM vq_pinned_playlists WHERE playlistId = ?', playlistId, (err, result) => {
            callback(err, result)
          })
        },
        (callback) => {
          pool.query('DELETE FROM vq_playlistvideos WHERE playlistId = ?', playlistId, (err, result) => {
            callback(err, result)
          })
        }
      ], (err, results) => {
        callback(err, results)
      })
    }
  ], (err, result) => {
    if (err) {
      console.error(err)
      return res.status(500).send({error: err})
    }
    res.send({success: true})
  })
})

router.get('/pinned', (req, res) => {
  const query = `SELECT playlistId FROM vq_pinned_playlists ORDER BY id DESC`
  return fetchPlaylists(query).then(
    playlists => res.send({playlists})
  ).catch(
    err => {
      console.error(err)
      res.status(500).send(err)
    }
  )
})

router.post('/pinned', requireAuth, (req, res) => {
  const user = req.user
  const selectedPlaylists = req.body.selectedPlaylists

  if (selectedPlaylists.length > 5) {
    return res.status(500).send({error: 'Maximum playlist number exceeded'})
  }
  async.waterfall([
    (callback) => {
      const userType = user.userType
      if (userType !== 'master') {
        return callback('User is not authorized to perform this action')
      }
      pool.query('SELECT * FROM vq_pinned_playlists', (err, rows) => {
        if (rows) {
          pool.query('TRUNCATE vq_pinned_playlists', err => {
            if (err) {
              return callback(err)
            }
            callback(err)
          })
        } else {
          callback(err)
        }
      })
    },
    callback => {
      if (selectedPlaylists.length === 0) {
        callback(null)
      } else {
        let taskArray = []
        for (let i = selectedPlaylists.length - 1; i >= 0; i--) {
          taskArray.push(callback => {
            pool.query('INSERT INTO vq_pinned_playlists SET ?', {playlistId: selectedPlaylists[i]}, err => {
              callback(err)
            })
          })
        }
        async.series(taskArray, (err) => {
          callback(err)
        })
      }
    },
    callback => {
      const query = [
        'SELECT a.id, a.title, a.creator AS uploaderId, b.username AS uploader ',
        'FROM vq_playlists a JOIN vq_pinned_playlists c ON c.playlistId = a.id ',
        'LEFT JOIN users b ON a.creator = b.id ORDER BY c.id DESC'
      ].join('')
      fetchPlaylists(query, (err, playlists) => {
        callback(err, playlists)
      })
    }
  ], (err, playlists) => {
    if (err) {
      console.error(err)
      return res.status(500).send({error: err})
    }
    res.json({playlists})
  })
})

router.get('/search/video', (req, res) => {
  const searchQuery = req.query.query
  if (stringIsEmpty(searchQuery) || searchQuery.length < 2) return res.send([])
  const query = `
    SELECT a.id, a.title, a.content, a.uploader AS uploaderId, b.username AS uploaderName
    FROM vq_videos a JOIN users b ON a.uploader = b.id WHERE a.title LIKE ?
    ORDER by a.id DESC LIMIT 20
  `
  return poolQuery(query, '%' + searchQuery + '%').then(
    result => res.send(result)
  ).catch(
    err => {
      console.error(err)
      return res.status(500).send({error: err})
    }
  )
})

router.get('/list', (req, res) => {
  const playlistId = req.query.playlistId ? Number(req.query.playlistId) : 0
  const where = playlistId !== 0 ? 'WHERE id < ' + playlistId + ' ' : ''
  const query = [
    'SELECT id, title FROM vq_playlists ',
    where,
    'ORDER BY id DESC LIMIT 11'
  ].join('')
  pool.query(query, (err, rows) => {
    if (err) {
      console.error(err)
      return res.status(500).send({error: err})
    }
    res.send({result: rows})
  })
})

module.exports = router
