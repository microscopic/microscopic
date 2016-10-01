'use strict'

const Cycle = require('./cycle')
const Response = require('./response')

const utils = require('microscopic-utils')
const IP = utils.ip

const _service = Symbol('service')
const _timeout = Symbol('timeout')
const _sendResponse = Symbol('sendResponse')
const _defaultRequestExtensions = Symbol('defaultRequestExtensions')

class Request {
  /**
   * @param {Service} service
   * @param {RequestDefinition} requestDefinition - Object represented Request.
   * @param {function} sendResponse
   */
  constructor (service, requestDefinition, sendResponse) {
    Object.assign(this, requestDefinition)

    this.info = this.info || {}
    this.response = new Response(this)

    this[ _service ] = service
    this[ _sendResponse ] = sendResponse

    this[ _defaultRequestExtensions ] = new Map([
      [ 'onRequest', [ this._setMethod, this._setInfo, this._setTimeout ] ],
      [ 'onPreMethod', [] ],
      [ 'onPostMethod', [] ],
      [ 'onPreResponse', [] ],
      [ 'onPostResponse', [] ],
    ])
  }

  get isExpired () {
    return this.info.sent + this.timeout <= Date.now()
  }

  /**
   * Runs Request lifecycle.
   */
  execute () {
    this._runRequestCycle()
  }

  /**
   * Sets response.
   *
   * @param {*} response
   */
  setResponse (response) {
    this.response.response(response)
  }

  /**
   * Creates copy of Request without excluded fields.
   *
   * @return {object}
   */
  toJSON () {
    const copy = Object.assign({}, this)
    delete copy.response
    delete copy._method

    return copy
  }

  /**
   * Runs request lifecycle.
   *
   * Lifecycle (Request Lifecycle + Response Lifecycle):
   *  - onRequest ------|
   *  - onPreMethod     |
   *  - onMethod        | - Request Lifecycle
   *  - onPostMethod ---|
   *  - onPreResponse -----|
   *  - onResponse         | - Response Lifecycle
   *  - onPostResponse ----|
   *
   * @protected
   */
  _runRequestCycle () {
    const everyStep = (step, next) => {
      if (this.response.isResponded) {
        return next(new Error('Response was sent'))
      }

      if (this.response.error) {
        return next(this.response.error)
      }

      if (!step) {
        return next()
      }

      return step.call(this, this, next)
    }

    const finalStep = (error) => {
      if (this.response.isResponded) {
        return
      }

      if (error) {
        this.setResponse(error)
      }

      this._runResponseCycle()
    }

    const _onRequest = this._getMergedExtensions('onRequest')
    const _onPreMethod = this._getMergedExtensions('onPreMethod')
    const _onMethod = this._executeMethod
    const _onPostMethod = this._getMergedExtensions('onPostMethod')

    const cycle = new Cycle(everyStep, finalStep)

    cycle.add(_onRequest)
    cycle.add(_onPreMethod)
    cycle.add(_onMethod)
    cycle.add(_onPostMethod)

    cycle.start()
  }

  /**
   * Runs response lifecycle.
   *
   * Lifecycle (Request Lifecycle + Response Lifecycle):
   *  - onRequest ------|
   *  - onPreMethod     |
   *  - onMethod        | - Request Lifecycle
   *  - onPostMethod ---|
   *  - onPreResponse -----|
   *  - onResponse         | - Response Lifecycle
   *  - onPostResponse ----|
   *
   * @protected
   */
  _runResponseCycle () {
    const everyStep = (step, next) => {
      if (!step) {
        return next()
      }

      return step.call(this, this, next)
    }

    const finalStep = (error) => {
      if (error) {
        console.log(error)
      }
    }

    const _onPreResponse = this._getMergedExtensions('onPreResponse')
    const _onResponse = [ this._sendResponse ]
    const _onPostResponse = this._getMergedExtensions('onPostResponse')

    const cycle = new Cycle(everyStep, finalStep)

    cycle.add(_onPreResponse)
    cycle.add(_onResponse)
    cycle.add(_onPostResponse)

    cycle.start()
  }

  /**
   * Merge default extensions of lifecycle with additional.
   *
   * @param {string} name
   * @return {array.<function>}
   * @protected
   */
  _getMergedExtensions (name) {
    const defaultExtensions = this[ _defaultRequestExtensions ].get(name) || []
    return defaultExtensions.concat(this[ _service ].requestExtensions.get(name) || [])
  }

  /**
   * Default step to setMethod into request.
   *
   * @param {Request} request
   * @param {function} next
   * @protected
   */
  _setMethod (request, next) {
    const method = this[ _service ].getMethod(request.method, request.version)
    if (!method) {
      return next(new Error('Not fit method'))
    }

    request._method = method

    next()
  }

  /**
   * Default step to set info about service and request.
   *
   * @param {Request} request
   * @param {function} next
   * @protected
   */
  _setInfo (request, next) {
    Object.assign(request.info, {
      received: Date.now(),
      service: {
        name: this[ _service ].name,
        id: this[ _service ].id,
        ip: IP.getIP()
      }
    })

    next()
  }

  /**
   * Default step to set request timeout.
   *
   * @param {Request} request
   * @param {function} next
   * @protected
   */
  _setTimeout (request, next) {
    if (!request.timeout) {
      return next()
    }

    this[ _timeout ] = setTimeout(() => {
      if (request.response) {
        return request.response.timeout()
      }
    }, request.timeout)

    next()
  }

  /**
   * Default step to execute method.
   *
   * @param {Request} request
   * @param {function} next
   * @protected
   */
  _executeMethod (request, next) {
    const reply = (result) => {
      request.setResponse(result)

      next()
    }

    request._method.run(request, reply)
  }

  /**
   * Default step to send request to Client.
   *
   * @param {Request} request
   * @param {function} next
   * @protected
   */
  _sendResponse (request, next) {
    if (request.response.isResponded) {
      return
    }

    request.info.responded = Date.now()

    this[ _sendResponse ](null, request.response)

    next()
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
