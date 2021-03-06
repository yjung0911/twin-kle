import request from 'axios'
import {auth, handleError} from './constants'
import {URL} from 'constants/URL'

const API_URL = `${URL}/playlist`

export const getPlaylistsAsync = () => dispatch => request.get(API_URL)
  .then(
    response => dispatch({
      type: 'GET_PLAYLISTS',
      data: response.data
    })
  ).catch(
    error => {
      console.error(error.response || error)
      handleError(error, dispatch)
    }
  )

export const getMorePlaylistsAsync = shownPlaylistsIds => dispatch =>
  request.get(`${API_URL}?${shownPlaylistsIds}`).then(
    response => {
      dispatch({
        type: 'GET_MORE_PLAYLISTS',
        data: response.data
      })
      return Promise.resolve()
    }
  ).catch(
    error => {
      console.error(error.response || error)
      handleError(error, dispatch)
    }
  )

export const uploadPlaylistAsync = params => dispatch =>
  request.post(API_URL, params, auth())
    .then(
      ({data: {result}}) => {
        if (result) {
          dispatch({
            type: 'UPLOAD_PLAYLIST',
            data: result
          })
        }
        return Promise.resolve()
      }
    ).catch(
      error => {
        console.error(error.response || error)
        handleError(error, dispatch)
      }
    )

export const editPlaylistTitle = (arrayNumber, playlistId, data) => ({
  type: 'EDIT_PLAYLIST_TITLE',
  arrayNumber,
  playlistId,
  data
})

export const editPlaylistTitleAsync = (params, arrayNumber, sender) => dispatch =>
  request.post(`${API_URL}/edit/title`, params, auth())
    .then(
      response => {
        const { data } = response
        if (data.result) {
          dispatch(editPlaylistTitle(arrayNumber, params.playlistId, data.result))
          sender.setState({onEdit: false})
        }
        return
      }
    ).catch(
      error => {
        console.error(error.response || error)
        handleError(error, dispatch)
      }
    )

export const changePlaylistVideos = (playlistId, data) => ({
  type: 'CHANGE_PLAYLIST_VIDEOS',
  playlistId,
  data
})

export const changePlaylistVideosAsync = (playlistId, selectedVideos, sender) => dispatch =>
  request.post(`${API_URL}/edit/videos`, {playlistId, selectedVideos}, auth())
    .then(
      response => {
        const {data} = response
        if (data.result) {
          dispatch(changePlaylistVideos(playlistId, data.result))
          sender.props.onHide()
        }
        return
      }
    ).catch(
      error => {
        console.error(error.response || error)
        handleError(error, dispatch)
      }
    )

export const deletePlaylist = data => ({
  type: 'DELETE_PLAYLIST',
  data
})

export const deletePlaylistAsync = (playlistId, sender) => dispatch =>
  request.delete(`${API_URL}?playlistId=${playlistId}`, auth())
    .then(
      response => {
        const {data} = response
        if (data.success) {
          dispatch(deletePlaylist(playlistId))
          sender.setState({deleteConfirmModalShown: false})
        }
        return
      }
    ).catch(
      error => {
        console.error(error.response || error)
        handleError(error, dispatch)
      }
    )

export const getPinnedPlaylistsAsync = () => dispatch =>
  request.get(`${API_URL}/pinned`).then(
    response => dispatch({
      type: 'GET_PINNED_PLAYLISTS',
      data: response.data
    })
  ).catch(
    error => {
      console.error(error.response || error)
      handleError(error, dispatch)
    }
  )

export const changePinnedPlaylists = selectedPlaylists => dispatch =>
  request.post(`${API_URL}/pinned`, {selectedPlaylists}, auth())
    .then(
      ({data: {playlists}}) => {
        if (playlists) {
          dispatch({
            type: 'CHANGE_PINNED_PLAYLISTS',
            data: playlists
          })
        }
        return Promise.resolve()
      }
    ).catch(
      error => {
        console.error(error.response || error)
        handleError(error, dispatch)
      }
    )

export const openSelectPlaylistsToPinModal = data => ({
  type: 'SELECT_PL_TO_PIN_OPEN',
  data
})

export const openSelectPlaylistsToPinModalAsync = () => dispatch => request.get(`${API_URL}/list`)
  .then(
    response => dispatch(openSelectPlaylistsToPinModal(response.data))
  ).catch(
    error => {
      console.error(error.response || error)
      handleError(error, dispatch)
    }
  )

export const loadMorePlaylistList = data => ({
  type: 'LOAD_MORE_PLAYLIST_LIST',
  data
})

export const loadMorePlaylistListAsync = playlistId => dispatch =>
  request.get(`${API_URL}/list?playlistId=${playlistId}`)
    .then(
      response => dispatch(loadMorePlaylistList(response.data))
    ).catch(
      error => {
        console.error(error.response || error)
        handleError(error, dispatch)
      }
    )

export const openChangePlaylistVideosModalAsync = () => dispatch =>
  request.get(`${URL}/video?numberToLoad=18`).then(
    response => {
      dispatch({
        type: 'CHANGE_PL_VIDS_MODAL_OPEN',
        modalType: 'change',
        data: response.data
      })
      return Promise.resolve()
    }
  ).catch(
    error => {
      console.error(error.response || error)
      handleError(error, dispatch)
    }
  )

export const openReorderPlaylistVideosModal = playlistVideos => ({
  type: 'REORDER_PL_VIDS_MODAL_OPEN',
  modalType: 'reorder',
  playlistVideos
})

export const likePlaylistVideo = (data, videoId) => ({
  type: 'PLAYLIST_VIDEO_LIKE',
  data,
  videoId
})

export const closeSelectPlaylistsToPinModal = () => ({
  type: 'SELECT_PL_TO_PIN_CLOSE'
})

export const openReorderPinnedPlaylistsModal = () => ({
  type: 'REORDER_PINNED_PL_OPEN'
})

export const closeReorderPinnedPlaylistsModal = () => ({
  type: 'REORDER_PINNED_PL_CLOSE'
})

export const resetPlaylistModalState = () => ({
  type: 'RESET_PL_MODAL_STATE'
})

export const clickSafeOn = () => ({
  type: 'CLICK_SAFE_ON'
})

export const clickSafeOff = () => ({
  type: 'CLICK_SAFE_OFF'
})
