'use strict'

const utils = require('microscopic-utils')
const Random = utils.random

class Response {
  /**
   * @param {Request} request - Request object
   */
  constructor (request) {
    this.id = Random.uuid()
    this.request = request
  }

  /**
   * Information that response has been sent.
   *
   * @return {boolean}
   */
  get isResponded () {
    return this.request.info.responded !== null && this.request.info.responded > 0
  }

  /**
   * Prepares and sends response to client.
   * Sets the status on the basis of the result, if result is Error then response is with error status.
   *
   * @param {*\Error} result
   */
  response (result) {
    if (result instanceof Error) {
      this.error = result
      this.status = Response.STATUS.FAIL
    } else {
      this.result = result
      this.status = Response.STATUS.SUCCESS
    }
  }

  /**
   * Sets timeout status and sends to Client.
   */
  timeout () {
    this.status = Response.STATUS.TIMEOUT
    this.error = new Error('Timeout')
  }

  /**
   * Creates copy of Response without excluded fields.
   *
   * @return {object}
   */
  toJSON () {
    const copy = Object.assign({}, this)
    delete copy.request.response

    return copy
  }
}

Response.STATUS = {
  SUCCESS: 1,
  FAIL: 2,
  TIMEOUT: 3
}

module.exports = Response
