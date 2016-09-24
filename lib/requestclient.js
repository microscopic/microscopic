'use strict'

const Response = require('./response')

const utils = require('microscopic-utils')
const Random = utils.random
const IP = utils.ip

const _callback = Symbol('callback')
const _callbackCalled = Symbol('callbackCalled')
const _timeout = Symbol('timeout')

class RequestClient {
  /**
   * Creates instance of RequestClient.
   *
   * @param {Client} client
   * @param {string} method
   * @param {object} options
   * @param {function} callback
   */
  constructor (client, method, options, callback) {
    this.id = Random.uuid()
    this.method = method
    this.params = options.params
    this.timeout = options.timeout || 10000
    this.headers = options.headers || {}
    this.info = {
      client: {
        id: client.id,
        ip: IP.getIP()
      },
      sent: Date.now()
    }

    this[ _callback ] = callback

    /* istanbul ignore else */
    if (this.timeout) {
      this[ _timeout ] = setTimeout(() => {
        this.callback(new Error('Request timeout!'))
      }, this.timeout)
    }
  }

  /**
   * Call request callback.
   *
   * @param {Error} [error]
   * @param {*} response
   * @return {*}
   */
  callback (error, response) {
    if (this[ _callbackCalled ]) {
      return
    }

    this[ _callbackCalled ] = true

    clearTimeout(this[ _timeout ])

    if (error) {
      return this[ _callback ](error)
    }

    if (response.status === Response.STATUS.SUCCESS) {
      return this[ _callback ](null, response)
    }

    if (response.status === Response.STATUS.TIMEOUT) {
      return this[ _callback ](new Error('Request timeout!'), response)
    }

    if (response.error) {
      return this[ _callback ](response.error)
    }

    return this[ _callback ](new Error('Unknown error'))
  }
}

module.exports = RequestClient
