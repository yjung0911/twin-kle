import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {Modal, Button} from 'react-bootstrap'
import {searchUserToInviteAsync, clearUserSearchResults} from 'redux/actions/ChatActions'
import {connect} from 'react-redux'
import TagPeopleForm from 'components/TagPeopleForm'
import Input from 'components/Texts/Input'

class CreateNewChannelModal extends Component {
  static propTypes = {
    clearSearchResults: PropTypes.func.isRequired,
    onDone: PropTypes.func.isRequired,
    onHide: PropTypes.func.isRequired,
    userId: PropTypes.number.isRequired,
    searchResults: PropTypes.array.isRequired,
    searchUserToInvite: PropTypes.func.isRequired
  }

  constructor() {
    super()
    this.state = {
      channelName: '',
      selectedUsers: []
    }
    this.onAddUser = this.onAddUser.bind(this)
    this.onRemoveUser = this.onRemoveUser.bind(this)
    this.onChannelNameInput = this.onChannelNameInput.bind(this)
    this.onDone = this.onDone.bind(this)
  }

  render() {
    const {userId, onHide, clearSearchResults, searchUserToInvite, searchResults} = this.props
    const {channelName, selectedUsers} = this.state
    return (
      <Modal
        show
        onHide={this.props.onHide}
        animation={false}
      >
        <Modal.Header closeButton>
          <h4>New Chat</h4>
        </Modal.Header>
        <Modal.Body>
          <TagPeopleForm
            searchResults={searchResults}
            filter={result => result.id !== userId}
            onSearch={searchUserToInvite}
            onClear={clearSearchResults}
            channelName={channelName}
            selectedUsers={selectedUsers}
            onAddUser={this.onAddUser}
            onRemoveUser={this.onRemoveUser}
          >
            {selectedUsers.length > 1 &&
              <div className="form-group">
                <label>Channel name</label>
                <Input
                  className="form-control"
                  placeholder="Enter channel name"
                  value={channelName}
                  onChange={text => this.onChannelNameInput(text)}
                />
              </div>
            }
          </TagPeopleForm>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={onHide}>Cancel</Button>
          <Button
            bsStyle="primary"
            onClick={this.onDone}
            disabled={(selectedUsers.length > 1 && !channelName) || (selectedUsers.length === 0)}
          >Create</Button>
        </Modal.Footer>
      </Modal>
    )
  }

  onAddUser(user) {
    const {selectedUsers} = this.state
    this.setState({
      selectedUsers: selectedUsers.concat([{
        userId: user.id,
        username: user.username
      }])
    })
  }

  onRemoveUser(user) {
    const {selectedUsers} = this.state
    this.setState({
      selectedUsers: selectedUsers.filter(selectedUser => selectedUser.userId !== user.userId)
    })
  }

  onChannelNameInput(value) {
    this.setState({channelName: value})
  }

  onDone() {
    const {userId} = this.props
    const {channelName, selectedUsers} = this.state
    this.props.onDone({userId, channelName, selectedUsers})
  }
}

export default connect(
  state => ({
    searchResults: state.ChatReducer.userSearchResults
  }),
  {
    clearSearchResults: clearUserSearchResults,
    searchUserToInvite: searchUserToInviteAsync
  }
)(CreateNewChannelModal)
