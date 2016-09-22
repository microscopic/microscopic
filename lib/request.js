'use strict'

const Response = require('./response')

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
}

module.exports = Request

/**
 * @typedef {object} RequestDefinition
 * @property {string} method - The name of method.
 * @property {string} [version] - The version of method.
 * @property {*} params - Method params.
 * @property {object} info - Information about request.
 */
