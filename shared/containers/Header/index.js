import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Link} from 'react-router';
import activeComponent from 'react-router-active-component';
import {openSigninModal, closeSigninModal, logout} from 'redux/actions/UserActions';
import SigninModal from '../Signin';
import {bindActionCreators} from 'redux';
import AccountMenu from './AccountMenu';
import ChatButton from './ChatButton';
import {Navbar, Nav, NavItem, NavDropdown, MenuItem} from 'react-bootstrap';

@connect(
  state => ({
    loggedIn: state.UserReducer.loggedIn,
    username: state.UserReducer.username,
    userType: state.UserReducer.userType,
    isAdmin: state.UserReducer.isAdmin,
    userId: state.UserReducer.userId,
    signinModalShown: state.UserReducer.signinModalShown
  }),
  {openSigninModal, closeSigninModal, logout}
)
export default class Header extends Component {
  constructor(props) {
    super()
    this.state = {
      tabClicked: false
    }
    const {socket} = props;
    socket.on('incoming notification', data => {
      console.log(data)
    })
    this.handleClick = this.handleClick.bind(this)
  }

  componentDidUpdate(prevProps) {
    const {socket, userId} = this.props;
    if (userId !== prevProps.userId) {
      if (prevProps.userId !== null) socket.emit('leave my notification channel', prevProps.userId);
      socket.emit('enter my notification channel', userId);
    }
  }

  render() {
    const {
      signinModalShown,
      loggedIn,
      logout,
      username,
      userType,
      isAdmin,
      userId,
      chatMode,
      openSigninModal,
      closeSigninModal,
      onChatButtonClick } = this.props;

    return (
      <Navbar staticTop fluid>
        <Navbar.Toggle />
        <Link
          className="navbar-brand"
          style={{cursor: 'pointer'}}
          to="/"
          onClick={this.handleClick}
        >
          Twinkle
        </Link>
        <Navbar.Collapse>
          {this.renderTabs()}
          <Nav pullRight className="flexbox-container">
            {loggedIn && <ChatButton onClick={() => onChatButtonClick()} chatMode={chatMode} />}
            {loggedIn ?
              <AccountMenu
                title={username}
                logout={logout}
              /> :
              <NavItem onClick={() => openSigninModal()}>Log In | Sign Up</NavItem>
            }
          </Nav>
        </Navbar.Collapse>
        {signinModalShown &&
          <SigninModal show onHide={() => closeSigninModal()} />
        }
      </Navbar>
    )
  }

  renderTabs() {
    const NavLink = activeComponent('li');
    const {chatMode} = this.props;
    return chatMode ? null : (
      <Nav onClick={this.handleClick}>
        <NavLink
          to="/"
          onlyActiveOnIndex
        >
          Home
        </NavLink>
        <NavLink to="/contents">
          Contents
        </NavLink>
        { /*
          <NavLink to="/profile">
            Profile
          </NavLink>
          <NavLink to="/posts">
            Posts
          </NavLink>
          <NavLink to="/discussion">
            Discussion
          </NavLink>
          { this.props.isAdmin &&
            <NavLink to="/management">
              Management
            </NavLink>
          }
          */
        }
      </Nav>
    )
  }

  handleClick() {
    this.setState({tabClicked: true})
    if (this.props.chatMode) {
      this.props.turnChatOff();
    }
  }
}