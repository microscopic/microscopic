'use strict'

const Method = require('./method')
const Request = require('./request')

const BaseTransport = require('microscopic-transport')
const utils = require('microscopic-utils')

const Asserts = utils.asserts
const Random = utils.random

const DEFAULT_SERVICE_OPTIONS = {
  worker: false, // TODO remove
  transport: {
    type: 'microscopic-tcp-transport'
  }
}

const _methods = Symbol('methods')
const _serviceRegistry = Symbol('serviceRegistry')
const _heartbeatInterval = Symbol('heartbeatInterval')

class Service {
  /**
   * @param {Microscopic} microscopic
   * @param {string} name - Name of service
   * @param {object} options - Service options
   */
  constructor (microscopic, name, options) {
    Asserts.assert(typeof name === 'string', new Error('Name is required!'))

    this.id = Random.uuid()
    this.serviceName = name

    this.options = Object.assign({}, DEFAULT_SERVICE_OPTIONS, options)
    this.options.transport.worker = this.options.worker

    this[ _methods ] = new Map()
    this[ _serviceRegistry ] = microscopic.serviceRegistry
  }

  /**
   * Starts service.
   *
   * @return {Promise}
   */
  start () {
    const Transport = require(this.options.transport.type)
    this.transport = new Transport(this.options.transport)

    this.options.transport = this.transport.options

    Asserts.assert(this.transport instanceof BaseTransport, new TypeError())

    return this.transport.listen(this)
      .then((connectionConfig) => {
        this.id = this[ _serviceRegistry ].register(this.serviceName, connectionConfig, this.options)

        _initHeartbeat.call(this)
      })

    /**
     * Initialize interval to send heartbeat.
     *
     * @private
     */
    function _initHeartbeat () {
      this[ _heartbeatInterval ] = setInterval(() => {
        this[ _serviceRegistry ].renew(this.serviceName, this.id)
      }, 30 * 1000)
    }
  }

  /**
   * Processes the message.
   * Used in transports.
   *
   * @param {object} message - Object from sender (client)
   * @param {function} sendResponse - Callback function to send response to sender (client)
   */
  onMessage (message, sendResponse = () => null) {
    if (!message) {
      return
    }

    const request = new Request(this, message.content)
    const response = request.createResponse(sendResponse)

    const method = this.getMethod(Method.getName(request.method, request.version))
    method.run(request, response)
  }

  /**
   * Adds method to service.
   *
   * @param {MethodDefinition} definition
   */
  addMethod (definition) {
    const method = new Method(definition)

    Asserts.assert(!this[ _methods ].has(method.name), new Error('Method with the same name exists'))

    this[ _methods ].set(method.name, method)
  }

  /**
   * Gets method by name.
   *
   * @param {string} name - The name of method.
   * @return {Method}
   */
  getMethod (name) {
    const method = this[ _methods ].get(name)

    Asserts.assert(method, new Error('Not fit method'))

    return method
  }
}

module.exports = Service
