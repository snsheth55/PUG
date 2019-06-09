import fetch from 'cross-fetch'

export const REQUEST_POSTS = 'REQUEST_POSTS'
export const RECEIVE_POSTS = 'RECEIVE_POSTS'
export const RECEIVE_SERVICE_CONTRACTS = 'RECEIVE_SERVICE_CONTRACTS'
export const SELECT_SUBREDDIT = 'SELECT_SUBREDDIT'
export const INVALIDATE_SUBREDDIT = 'INVALIDATE_SUBREDDIT'

export function selectSubreddit(subreddit) {
  return {
    type: SELECT_SUBREDDIT,
    subreddit
  }
}

export function invalidateSubreddit(subreddit) {
  return {
    type: INVALIDATE_SUBREDDIT,
    subreddit
  }
}

function requestPosts(subreddit) {
  return {
    type: REQUEST_POSTS,
    subreddit
  }
}

function receivePosts(subreddit, json) {
  return {
    type: RECEIVE_POSTS,
    subreddit,
    posts: json.data.children.map(child => child.data),
    receivedAt: Date.now()
  }
}

function receiveServiceContracts(json) {
  console.log("JSONN=========================================================" , json)
  return {
    type: RECEIVE_SERVICE_CONTRACTS,
    posts: json.data,
    receivedAt: Date.now()
  }
}

function fetchPosts(subreddit) {
  return dispatch => {
    console.log("DISPATCH>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>.", dispatch(requestPosts(subreddit)))
    dispatch(requestPosts(subreddit))
    return fetch(`https://www.reddit.com/r/${subreddit}.json`)
      .then(response => response.json())
      .then(json => dispatch(receivePosts(subreddit, json)))
  }
}

export function fetchServiceContracts() {
  return dispatch => {
    console.log("------------------------------------------------------------------------------")
    return fetch('/api/getALLServiceContracts')
      .then(response => response.json())
      .then(json => dispatch(receiveServiceContracts(json)))
  }
}

function shouldFetchPosts(state, subreddit) {
  console.log("STATE", state, "POSTS", state.postsBySubreddit[subreddit])
  const posts = state.postsBySubreddit[subreddit]
  if (!posts) {
    return true
  } else if (posts.isFetching) {
    return false
  } else {
    return posts.didInvalidate
  }
}

export function fetchPostsIfNeeded(subreddit) {
  return (dispatch, getState) => {
    console.log("DISPATCH", dispatch, 'GETSTATE', getState(), 'SHOULD FETCH POSTS', shouldFetchPosts(getState(), subreddit))
    if (shouldFetchPosts(getState(), subreddit)) {
      return dispatch(fetchPosts(subreddit))
    }
  }
}
