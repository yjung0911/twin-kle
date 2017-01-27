import request from 'axios';
import {auth, handleError} from '../constants';
import * as actions from './actions';
import {GENERAL_CHAT_ID} from 'constants/database';
import {URL} from 'constants/URL';

const API_URL = `${URL}/chat`;

export const selectChannel = channelId => dispatch => {
  dispatch({
    type: 'SELECT_CHANNEL',
    channelId
  })
  return Promise.resolve()
}

export const enterChannelWithId = (channelId, showOnTop) => dispatch => {
  const {fetchChannelWithId, enterChannel} = actions;
  dispatch(selectChannel(channelId)).then(
    () => fetchChannelWithId(channelId)
  ).then(
    response => dispatch(enterChannel(response.data, showOnTop))
  ).catch(
    error => {
      console.error(error.response || error)
      handleError(error, dispatch)
    }
  )
}

export const checkChatExistsThenOpenNewChatTabOrEnterExistingChat = (user, partner, callback) => dispatch => {
  const {checkChatExists, openNewChatTab} = actions;
  dispatch(checkChatExists(user, partner, {then: followUp}));
  function followUp(data) {
    if (data.channelExists) {
      dispatch(enterChannelWithId(data.channelId, true))
    }
    else {
      dispatch(openNewChatTab(user, partner))
    }
    if (callback) callback()
  }
}

export const clearChatSearchResults = () => ({
  type: 'CLEAR_CHAT_SEARCH_RESULTS'
})

export const clearUserSearchResults = () => ({
  type: 'CLEAR_USER_SEARCH_RESULTS'
})

export const sendFirstDirectMessage = (params, callback) => dispatch => {
  let body = {
    ...params,
    timeStamp: Math.floor(Date.now()/1000)
  }
  request.post(`${API_URL}/channel/twoPeople`, body, auth()).then(
    response => {
      dispatch(actions.createNewChat(response.data));
      callback(response.data);
    }
  ).catch(
    error => {
      console.error(error.response || error)
      handleError(error, dispatch)
    }
  )
}

export const createNewChannelAsync = (params, callback) => dispatch =>
request.post(`${API_URL}/channel`, {params}, auth())
.then(
  response => {
    dispatch(actions.createNewChannel(response.data))
    callback(response.data)
  }
).catch(
  error => {
    console.error(error.response || error)
    handleError(error, dispatch)
  }
)

export const editChannelTitle = (params, callback) => dispatch =>
request.post(`${API_URL}/title`, params, auth())
.then(
  response => {
    dispatch(actions.applyChangedChannelTitle(params));
    if (callback) callback();
  }
).catch(
  error => {
    console.error(error.response || error)
    handleError(error, dispatch)
  }
)

export const enterEmptyChat = () => ({
  type: 'ENTER_EMPTY_CHAT'
})

export const getNumberOfUnreadMessagesAsync = () => dispatch => {
  if (auth() === null) return;
  request.get(`${API_URL}/numUnreads`, auth()).then(
    response => {
      dispatch(actions.getNumberOfUnreadMessages(response.data.numUnreads))
    }
  ).catch(
    error => {
      console.error(error.response || error)
      handleError(error, dispatch)
    }
  )
}

export const hideChatAsync = channelId => dispatch =>
request.post(`${API_URL}/hideChat`, {channelId}, auth())
.then(
  response => {
    dispatch(actions.hideChat(channelId))
    dispatch(enterChannelWithId(GENERAL_CHAT_ID, true))
  }
).catch(
  error => {
    console.error(error.response || error)
    handleError(error, dispatch)
  }
)

export const increaseNumberOfUnreadMessages = () => ({
  type: 'INCREASE_NUM_UNREAD_MSGS'
})

export const initChatAsync = callback => dispatch =>
request.get(API_URL, auth()).then(
  response => dispatch({
    type: 'INIT_CHAT',
    data: response.data
  })
).catch(
  error => {
    console.error(error.response || error)
    handleError(error, dispatch)
  }
)

export const inviteUsersToChannelAsync = (params, callback) => dispatch =>
request.post(`${API_URL}/invite`, params, auth())
.then(
  response => {
    const {message} = response.data;
    let data = {
      ...params,
      message
    }
    dispatch(actions.inviteUsersToChannel(data));
    callback(message);
  }
).catch(
  error => {
    console.error(error.response || error)
    handleError(error, dispatch)
  }
)

export const loadMoreMessagesAsync = (userId, messageId, channelId, callback) => dispatch =>
request.get(`${API_URL}/more?userId=${userId}&messageId=${messageId}&channelId=${channelId}`, auth())
.then(
  response => {
    dispatch(actions.loadMoreMessages(response.data))
    callback()
  }
).catch(
  error => {
    console.error(error.response || error)
    handleError(error, dispatch)
  }
)

export const leaveChannelAsync = channelId => dispatch => {
  const timeStamp = Math.floor(Date.now()/1000);
  request.delete(`${API_URL}/channel?channelId=${channelId}&timeStamp=${timeStamp}`, auth())
  .then(
    response => {
      dispatch(actions.leaveChannel(channelId))
      dispatch(enterChannelWithId(GENERAL_CHAT_ID, true))
    }
  ).catch(
    error => {
      console.error(error.response || error)
      handleError(error, dispatch)
    }
  )
}

export const notifyThatMemberLeftChannel = data => ({
  type: 'NOTIFY_MEMBER_LEFT',
  data
})

export const openChatForDirectMessage = (user, partner) => dispatch => {
  request.get(`${API_URL}/channels`, auth()).then(
    response => {
      dispatch({
        type: 'LOAD_CHANNEL_LIST',
        data: response.data
      })
      dispatch(checkChatExistsThenOpenNewChatTabOrEnterExistingChat(user, partner))
    }
  ).catch(
    error => {
      console.error(error.response || error)
      handleError(error, dispatch)
    }
  )
}

export const receiveMessage = data => dispatch => {
  const {channelId, timeStamp} = data;
  request.post(`${API_URL}/lastRead`, {channelId, timeStamp}, auth()).then(
    response => dispatch({
      type: 'RECEIVE_MSG',
      data
    })
  ).catch(
    error => {
      console.error(error.response || error)
      handleError(error, dispatch)
    }
  )
}

export const receiveMessageOnDifferentChannel = (data, senderIsNotTheUser) => ({
  type: 'RECEIVE_MSG_ON_DIFFERENT_CHANNEL',
  data,
  senderIsNotTheUser
})

export const receiveFirstMsg = (data, duplicate) => ({
  type: 'RECEIVE_FIRST_MSG',
  data,
  duplicate
})

export const resetChat = () => ({
  type: 'RESET_CHAT'
})

export const searchChatAsync = text => dispatch =>
request.get(`${API_URL}/search/chat?text=${text}`, auth())
.then(
  response => dispatch(actions.searchChat(response.data))
).catch(
  error => {
    console.error(error.response || error)
    handleError(error, dispatch)
  }
)

export const searchUserToInviteAsync = text => dispatch =>
request.get(`${API_URL}/search/users?text=${text}`)
.then(
  response => dispatch(actions.searchUserToInvite(response.data))
).catch(
  error => {
    console.error(error.response || error)
    handleError(error, dispatch)
  }
)

export const submitMessageAsync = (params, callback) => dispatch => {
  let message = {
    ...params,
    timeStamp: Math.floor(Date.now()/1000)
  }
  dispatch(actions.submitMessage(message))
  request.post(API_URL, {message}, auth()).then(
    response => callback(params)
  ).catch(
    error => {
      console.error(error.response || error)
      handleError(error, dispatch)
    }
  )
}

export const turnChatOff = () => ({
  type: 'TURN_CHAT_OFF'
})