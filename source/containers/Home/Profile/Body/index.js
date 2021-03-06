import React, {Component} from 'react'
import {Route} from 'react-router'
import {fetchUserFeeds, fetchMoreUserFeeds, clearFeeds} from 'redux/actions/FeedActions'
import {connect} from 'react-redux'
import PropTypes from 'prop-types'
import Loading from 'components/Loading'
import FeedPanel from '../../FeedPanel'
import LoadMoreButton from 'components/LoadMoreButton'
import {addEvent, removeEvent} from 'helpers/listenerHelpers'

class Body extends Component {
  static propTypes = {
    chatMode: PropTypes.bool,
    clearFeeds: PropTypes.func.isRequired,
    feeds: PropTypes.array,
    fetchMoreUserFeeds: PropTypes.func.isRequired,
    fetchUserFeeds: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
    loaded: PropTypes.bool.isRequired,
    loadMoreButton: PropTypes.bool.isRequired,
    location: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired,
    myId: PropTypes.number
  }

  constructor() {
    super()
    this.state = {
      currentTab: '',
      loading: false
    }
    this.changeTab = this.changeTab.bind(this)
    this.onNoFeed = this.onNoFeed.bind(this)
    this.onScroll = this.onScroll.bind(this)
    this.loadMoreFeeds = this.loadMoreFeeds.bind(this)
  }

  componentDidMount() {
    const {
      match,
      location,
      clearFeeds
    } = this.props
    this.mounted = true
    addEvent(window, 'scroll', this.onScroll)
    return clearFeeds().then(
      () => {
        switch (location.pathname) {
          case match.url:
            return this.changeTab('comment')
          case `${match.url}/videos`:
            return this.changeTab('video')
          case `${match.url}/links`:
            return this.changeTab('url')
          case `${match.url}/discussions`:
            return this.changeTab('discussion')
          default: break
        }
      }
    )
  }

  componentDidUpdate(prevProps) {
    const {
      match,
      location,
      clearFeeds
    } = this.props

    if (prevProps.location !== this.props.location) {
      return clearFeeds().then(
        () => {
          switch (location.pathname) {
            case match.url:
              return this.changeTab('comment')
            case `${match.url}/videos`:
              return this.changeTab('video')
            case `${match.url}/links`:
              return this.changeTab('url')
            case `${match.url}/discussions`:
              return this.changeTab('discussion')
            default: break
          }
        }
      )
    }
  }

  componentWillUnmount() {
    this.mounted = false
    removeEvent(window, 'scroll', this.onScroll)
  }

  render() {
    const {
      match: route, match: {params: {username}},
      history, feeds, myId, loaded, loadMoreButton,
      clearFeeds
    } = this.props
    const {loading} = this.state

    return (
      <div>
        <nav className="navbar navbar-inverse">
          <ul
            className="nav nav-pills"
            style={{
              margin: '0.5em',
              fontSize: '1.2em',
              fontWeight: 'bold'
            }}
          >
            <Route exact path={`${route.url}/`} children={({match}) => (
              <li
                className={match && 'active'}
                style={{cursor: 'pointer'}}
                onClick={() => clearFeeds().then(
                  () => history.push(`${route.url}`)
                )}
              >
                <a>Comments</a>
              </li>
            )}/>
            <Route exact path={`${route.url}/videos`} children={({match}) => (
              <li
                className={match && 'active'}
                style={{cursor: 'pointer'}}
                onClick={() => clearFeeds().then(
                  () => history.push(`${route.url}/videos`)
                )}
              >
                <a>Videos</a>
              </li>
            )}/>
            <Route exact path={`${route.url}/links`} children={({match}) => (
              <li
                className={match && 'active'}
                style={{cursor: 'pointer'}}
                onClick={() => clearFeeds().then(
                  () => history.push(`${route.url}/links`)
                )}
              >
                <a>Links</a>
              </li>
            )}/>
            <Route exact path={`${route.url}/discussions`} children={({match}) => (
              <li
                className={match && 'active'}
                style={{cursor: 'pointer'}}
                onClick={() => clearFeeds().then(
                  () => history.push(`${route.url}/discussions`)
                )}
              >
                <a>Discussions</a>
              </li>
            )}/>
          </ul>
        </nav>
        <div>
          {!loaded && <Loading />}
          {loaded && feeds.length > 0 && (
            <div>
              {feeds.map(feed => {
                return <FeedPanel key={`${feed.id}`} feed={feed} userId={myId} />
              })}
            </div>
          )}
          {loaded && feeds.length === 0 && <div style={{textAlign: 'center'}}>{this.onNoFeed(username)}</div>}
        </div>
        {loadMoreButton && <LoadMoreButton onClick={this.loadMoreFeeds} loading={loading} />}
      </div>
    )
  }

  changeTab(tabName) {
    const {match: {params: {username}}, fetchUserFeeds} = this.props
    if (this.mounted) {
      this.setState({currentTab: tabName})
    }
    fetchUserFeeds(username, tabName)
  }

  loadMoreFeeds() {
    const {match: {params: {username}}, fetchMoreUserFeeds, feeds} = this.props
    const {currentTab, loading} = this.state

    if (!loading) {
      this.setState({loading: true})
      return fetchMoreUserFeeds(username, currentTab, feeds[feeds.length - 1].id).then(
        () => this.setState({loading: false})
      )
    }
  }

  onNoFeed(username) {
    const {currentTab} = this.state
    switch (currentTab) {
      case 'comment':
        return `${username} has not posted a comment yet`
      case 'url':
        return `${username} has not posted a link yet`
      case 'video':
        return `${username} has not posted a video yet`
      case 'discussion':
        return `${username} has not posted a discussion yet`
    }
  }

  onScroll() {
    let {chatMode, feeds} = this.props
    if (!chatMode && feeds.length > 0) {
      this.setState({scrollPosition: document.body.scrollTop})
      if (this.state.scrollPosition >= (document.body.scrollHeight - window.innerHeight) * 0.7) {
        this.loadMoreFeeds()
      }
    }
  }
}

export default connect(
  state => ({
    chatMode: state.ChatReducer.chatMode,
    feeds: state.FeedReducer.feeds,
    loaded: state.FeedReducer.loaded,
    myId: state.UserReducer.userId,
    loadMoreButton: state.FeedReducer.loadMoreButton,
    homeComponentConnected: state.FeedReducer.homeComponentConnected
  }),
  {
    fetchUserFeeds,
    fetchMoreUserFeeds,
    clearFeeds
  }
)(Body)
