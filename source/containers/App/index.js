import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {Switch, Route} from 'react-router-dom'
import Chat from '../Chat'
import Header from './Header'
import io from 'socket.io-client'
import {connect} from 'react-redux'
import {initChatAsync, resetChat, turnChatOff, changePageVisibility} from 'redux/actions/ChatActions'
import {unlockScroll} from 'redux/actions/FeedActions'
import {initSessionAsync} from 'redux/actions/UserActions'
import {URL} from 'constants/URL'
import {addEvent, removeEvent} from 'helpers/listenerHelpers'
import Home from 'containers/Home'
import Videos from 'containers/Videos'
import Links from 'containers/Links'
import Button from 'components/Button'

const socket = io.connect(URL)
let visibilityChange
let hidden

@connect(
  state => ({
    loggedIn: state.UserReducer.loggedIn,
    chatMode: state.ChatReducer.chatMode,
    chatNumUnreads: state.ChatReducer.numUnreads,
    scrollLocked: state.FeedReducer.scrollLocked
  }),
  {
    initSession: initSessionAsync,
    turnChatOff,
    initChat: initChatAsync,
    resetChat,
    changePageVisibility,
    unlockPageScroll: unlockScroll
  }
)
export default class App extends Component {
  static propTypes = {
    chatMode: PropTypes.bool,
    initSession: PropTypes.func,
    turnChatOff: PropTypes.func,
    chatNumUnreads: PropTypes.number,
    resetChat: PropTypes.func,
    loggedIn: PropTypes.bool,
    initChat: PropTypes.func,
    changePageVisibility: PropTypes.func,
    scrollLocked: PropTypes.bool,
    unlockPageScroll: PropTypes.func
  }

  constructor() {
    super()
    this.state = {
      scrollPosition: 0,
      updateNoticeShown: false
    }
    this.onChatButtonClick = this.onChatButtonClick.bind(this)
    this.onMouseMove = this.onMouseMove.bind(this)
    this.onScroll = this.onScroll.bind(this)
    this.onResize = this.onResize.bind(this)
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this)
  }

  componentWillReceiveProps(nextProps) {
    if (!this.props.chatMode && !!nextProps.chatMode) window.scrollTo(0, 0)
  }

  componentDidMount() {
    const {initSession} = this.props
    if (typeof document.hidden !== 'undefined') {
      hidden = 'hidden'
      visibilityChange = 'visibilitychange'
    } else if (typeof document.msHidden !== 'undefined') {
      hidden = 'msHidden'
      visibilityChange = 'msvisibilitychange'
    } else if (typeof document.webkitHidden !== 'undefined') {
      hidden = 'webkitHidden'
      visibilityChange = 'webkitvisibilitychange'
    }
    initSession()
    addEvent(window, 'mousemove', this.onMouseMove)
    addEvent(window, 'scroll', this.onScroll)
    addEvent(window, 'resize', this.onResize)
    addEvent(document, visibilityChange, this.handleVisibilityChange)
  }

  componentDidUpdate(prevProps) {
    let elements = document.documentElement.childNodes
    const {chatMode, chatNumUnreads} = this.props

    if (this.props.chatNumUnreads !== prevProps.chatNumUnreads) {
      let title = `${chatNumUnreads > 0 ? '('+chatNumUnreads+') ' : ''}Twinkle`
      let display = chatMode ? 'none' : 'inline'
      document.title = title
      for (let i = 0; i < elements.length; i++) {
        if (elements[i].tagName === 'GRAMMARLY-CARD') elements[i].style.display = display
      }
    }

    if (this.props.chatMode !== prevProps.chatMode) {
      let title = `${chatNumUnreads > 0 ? '('+chatNumUnreads+') ' : ''}Twinkle`
      let display = chatMode ? 'none' : 'inline'
      document.title = title
      for (let i = 0; i < elements.length; i++) {
        if (elements[i].tagName === 'GRAMMARLY-CARD') elements[i].style.display = display
      }
    }
  }

  componentWillUnmount() {
    removeEvent(window, 'mousemove', this.onMouseMove)
    removeEvent(window, 'scroll', this.onScroll)
    removeEvent(window, 'resize', this.onResize)
  }

  render() {
    const {chatMode, turnChatOff, resetChat} = this.props
    const {scrollPosition, updateNoticeShown} = this.state
    const style = chatMode && this.props.loggedIn ? {
      display: 'none'
    } : {paddingTop: '65px'}

    return (
      <div
        id="main-view"
        style={{backgroundColor: chatMode && '#fff'}}
      >
        <Header
          staticTop={chatMode}
          socket={socket}
          chatMode={chatMode}
          onChatButtonClick={this.onChatButtonClick}
          turnChatOff={() => turnChatOff()}
          showUpdateNotice={match => this.setState({updateNoticeShown: !match})}
        />
        <div
          style={{...style, paddingBottom: '1em'}}
        >
          {updateNoticeShown &&
            <div
              className="alert alert-info"
              style={{
                position: 'fixed',
                textAlign: 'center',
                width: '80%',
                zIndex: '2000',
                left: '10%'
              }}
            >
              <p style={{fontSize: '1.4em'}}>The website has been updated. Click the button below to apply the update.</p>
              <p style={{fontSize: '1.2em'}}>{"Warning: Update is mandatory. Some features will not work properly if you don't!"}</p>
              <Button
                className="btn btn-lg btn-success"
                style={{
                  marginTop: '1em',
                  fontSize: '1.5em'
                }}
                onClick={() => window.location.reload()}
              >
                Update!
              </Button>
            </div>
          }
          <Switch>
            <Route exact path="/" component={Home} />
            <Route path="/videos" component={Videos} />
            <Route path="/links" component={Links} />
            <Route path="/users" component={Home} />
            <Route path="/users/:username" component={Home} />
          </Switch>
        </div>
        {chatMode && this.props.loggedIn &&
          <Chat
            socket={socket}
            onUnmount={
              () => {
                window.scrollTo(0, scrollPosition)
                resetChat()
                turnChatOff()
              }
            }
          />
        }
      </div>
    )
  }

  handleVisibilityChange() {
    const {changePageVisibility} = this.props
    if (document[hidden]) {
      changePageVisibility(false)
    } else {
      changePageVisibility(true)
    }
  }

  onChatButtonClick() {
    const {initChat, chatMode, turnChatOff} = this.props
    if (chatMode) return turnChatOff()
    initChat()
  }

  onMouseMove() {
    const {unlockPageScroll, scrollLocked} = this.props
    if (scrollLocked) unlockPageScroll()
  }

  onResize() {
    const {unlockPageScroll, scrollLocked} = this.props
    if (scrollLocked) unlockPageScroll()
  }

  onScroll(event) {
    const {chatMode} = this.props
    if (this.props.scrollLocked) window.scrollTo(0, this.state.scrollPosition)
    if (!chatMode) {
      this.setState({scrollPosition: window.scrollY})
    }
  }
}
