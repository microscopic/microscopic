'use strict'

const Response = require('./response')

const _timeout = Symbol('timeout')

class Request {
  /**
   * @param {Service} service
   * @param {RequestDefinition} requestDefinition - Object represented Request.
   */
  constructor (service, requestDefinition) {
    Object.assign(this, requestDefinition)

    this.info = this.info || {}

    Object.assign(this.info, {
      received: Date.now(),
      service: {
        name: service.name,
        id: service.id
      }
    })

    this._initTimeout()
  }

  get isExpired () {
    return this.info.sent + this.timeout <= Date.now()
  }

  /**
   * Creates Response with assigned Request.
   *
   * @param {function} sendResponse - Callback function to send response to sender (client)
   * @return {Response}
   */
  createResponse (sendResponse) {
    this.response = new Response(this, sendResponse)

    return this.response
  }

  /**
   * Creates copy of Request without excluded fields.
   *
   * @return {object}
   */
  toJSON () {
    const copy = Object.assign({}, this)
    delete copy.response

    return copy
  }

  /**
   * Init request timeout.
   *
   * @protected
   */
  _initTimeout () {
    if (!this.timeout) {
      return
    }

    this[ _timeout ] = setTimeout(() => {
      if (this.response) {
        return this.response.timeout()
      }
    }, this.timeout)
  }
}

module.exports = Request

/**
 * @typedef {object} RequestDefinition
 * @property {string} method - The name of method.
 * @property {string} [version] - The version of method.
 * @property {*} params - Method params.
 * @property {number} [timeout] - Timeout time.
 * @property {object} info - Information about request.
 */
