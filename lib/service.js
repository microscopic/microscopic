'use strict'

const Cycle = require('./cycle')
const Method = require('./method')
const Request = require('./request')

const BaseTransport = require('microscopic-transport')

const utils = require('microscopic-utils')
const Asserts = utils.asserts
const Random = utils.random

const DEFAULT_SERVICE_OPTIONS = {
  transport: {
    type: 'microscopic-tcp-transport'
  }
}

const _serviceRegistry = Symbol('serviceRegistry')
const _heartbeatInterval = Symbol('heartbeatInterval')
const _extensions = Symbol('extensions')
const _requestExtensions = Symbol('requestExtensions')

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

    this.methods = new Map()

    this[ _serviceRegistry ] = microscopic.serviceRegistry

    this[ _extensions ] = new Map([
      [ 'onPreStart', [ this._setTransport ] ],
      [ 'onPostStart', [ this._registerService, this._initHeartbeat ] ],
      [ 'onPreStop', [] ],
      [ 'onPostStop', [] ],
    ])

    this[ _requestExtensions ] = new Map([
      [ 'onRequest', [] ],
      [ 'onPreMethod', [] ],
      [ 'onPostMethod', [] ],
      [ 'onPreResponse', [] ],
      [ 'onPostResponse', [] ],
    ])
  }

  /**
   * @return {Map}
   */
  get requestExtensions () {
    return this[ _requestExtensions ]
  }

  /**
   * Registers plugin into Service.
   *
   * @param {function} plugin
   * @param {object} options
   */
  register (plugin, options = {}) {
    plugin(this, options)
  }

  /**
   * Adds extension to one of lifecycle events (step).
   * It's possible to add extension into service lifecycle or into request lifecycle.
   *
   * @param {string} event
   * @param {function} extension
   */
  ext (event, extension) {
    Asserts.assert(typeof extension === 'function', new Error('Extension must to be a function'))

    const isRequestExtension = !!this[ _requestExtensions ].has(event)

    const extensions = this[ isRequestExtension ? _requestExtensions : _extensions ]
    const eventExtensions = extensions.get(event)

    Asserts.assert(eventExtensions, new Error('Unknown event'))

    eventExtensions.push(extension)
  }

  /**
   * Adds method to service.
   *
   * @param {MethodDefinition} definition
   */
  addMethod (definition) {
    const method = new Method(definition)

    Asserts.assert(!this.methods.has(method.name), new Error('Method with the same name exists'))

    this.methods.set(method.name, method)
  }

  /**
   * Gets method by name.
   *
   * @param {string} name - The name of method.
   * @return {Method}
   */
  getMethod (methodName, version) {
    const method = this.methods.get(Method.getName(methodName, version))

    return method
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

    const request = new Request(this, message.content, sendResponse)

    request.execute()
  }

  /**
   * Starts service.
   *
   * @return {Promise}
   */
  start () {
    return new Promise((resolve, reject) => {
      const everyStep = (step, next) => {
        if (!step) {
          return next()
        }

        return step.call(this, this, next)
      }

      const finalStep = (error) => {
        if (error) {
          return reject(error)
        }

        resolve()
      }

      const cycle = new Cycle(everyStep, finalStep)

      cycle.add(this[ _extensions ].get('onPreStart'))
      cycle.add(this._startListen)
      cycle.add(this[ _extensions ].get('onPostStart'))

      cycle.start()
    })
  }

  /**
   * Default step to set transport.
   *
   * @param {Service} service
   * @param {function} next
   * @protected
   */
  _setTransport (service, next) {
    const Transport = require(service.options.transport.type)
    service.transport = new Transport(service.options.transport)

    service.options.transport = service.transport.options

    Asserts.assert(service.transport instanceof BaseTransport, new TypeError())

    next()
  }

  /**
   * Default step to start listening.
   *
   * @param {Service} service
   * @param {function} next
   * @protected
   */
  _startListen (service, next) {
    service.transport.listen(service)
      .then((connectionConfig) => {
        service.connection = connectionConfig

        next()
      })
  }

  /**
   * Default step to register service into Service Registry.
   *
   * @param {Service} service
   * @param {function} next
   * @protected
   */
  _registerService (service, next) {
    service.id = this[ _serviceRegistry ].register(service.serviceName, service.connection, service.options)
    next()
  }

  /**
   * Default step to init heartbeat.
   *
   * @param {Service} service
   * @param {function} next
   * @protected
   */
  _initHeartbeat (service, next) {
    this[ _heartbeatInterval ] = setInterval(() => {
      this[ _serviceRegistry ].renew(service.serviceName, service.id)
    }, 30 * 1000)

    next()
  }
}

module.exports = Service
