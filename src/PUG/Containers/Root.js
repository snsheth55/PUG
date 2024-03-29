import React, { Component } from 'react'
import { Provider } from 'react-redux'
import configureStore from '../Store/ConfigureStore'
import AsyncApp from './AsyncApp'

const store = configureStore()

export default class Root extends Component {
  render() {
    return (
      <Provider store={store}>
        <AsyncApp />
      </Provider>
    )
  }
}
