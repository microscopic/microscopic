'use strict'

const utils = require('microscopic-utils')
const Asserts = utils.asserts
const Random = utils.random

class Response {
  /**
   * @param {Request} request - Request object
   * @param {function} sendResponse - Callback function to send response to sender (client)
   */
  constructor (request, sendResponse) {
    this.id = Random.uuid()
    this.request = request

    this._sendResponse = sendResponse
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
    Asserts.assert(!this.isResponded, new Error('Response called twice'))

    if (result instanceof Error) {
      this.error = _prepareErrorResponse(result)
      this.status = Response.STATUS.FAIL
    } else {
      this.result = result
      this.status = Response.STATUS.SUCCESS
    }

    this._send()
  }

  /**
   * Sets timeout status and sends to Client.
   */
  timeout () {
    this.status = Response.STATUS.TIMEOUT

    this._send()
  }

  /**
   * Returns reference to Response method.
   *
   * @return {function(this:Response)}
   */
  createReply () {
    return this.response.bind(this)
  }

  /**
   * Sends response to Client.
   *
   * @protected
   */
  _send () {
    this.request.info.responded = Date.now()

    this._sendResponse(null, this)
  }
}

Response.STATUS = {
  SUCCESS: 1,
  FAIL: 2,
  TIMEOUT: 3
}

/**
 * Helpers nethod to maps error to result.
 *
 * @param {*|Error} result
 * @return {message: string, details: *}
 * @private
 */
function _prepareErrorResponse (result) {
  /* istanbul ignore next */
  if (!(result instanceof Error)) {
    return null
  }

  return {
    message: result.message,
    details: result.data
  }
}

module.exports = Response
