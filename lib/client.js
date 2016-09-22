'use strict'

const utils = require('microscopic-utils')
const Assert = utils.asserts
const Random = utils.random

const _serviceRegistry = Symbol('serviceRegistry')
const _loadBalancer = Symbol('loadBalancer')
const _options = Symbol('options')
const _transport = Symbol('transport')

class Client {
  /**
   * @param {Microscopic} microscopic
   * @param {string} serviceName - Service name with which the client communicates.
   */
  constructor (microscopic, serviceName) {
    this.serviceName = serviceName
    this.id = Random.uuid()

    this[ _options ] = {}
    this[ _serviceRegistry ] = microscopic.serviceRegistry

    this._init()
  }

  /**
   * Send request to remote method.
   *
   * @param {string} method - Name of method in service.
   * @param {*} options - Options of request.
   * @param {function} callback
   */
  send (method, options, callback) {
    console.log(this[ _transport ])

    if (!this[ _transport ]) {
      throw new Error('Not set transport!')
    }

    const request = {
      method: method,
      params: options.params,
      info: {
        client: {
          id: this.id
        },
        sent: Date.now()
      }
    }

    this[ _transport ].send(this._getConnection(), request, (error, response) => {
      callback(error, response)
    })
  }

  /**
   * Gets selected by load balancer connection.
   *
   * @return {*} Information about connection
   * @protected
   */
  _getConnection () {
    const nodes = this[ _serviceRegistry ].getService(this.serviceName)
    const node = this._isPossibleLoadBalancing() ? this[ _loadBalancer ].balance(nodes) : nodes[ 0 ]

    return node.connection
  }

  /**
   * Initialize Client.
   * Load dynamic components.
   *
   * @protected
   */
  _init () {
    if (!this[ _serviceRegistry ]) {
      throw new Error('Service Registry is requried!')
    }

    this[ _options ] = this[ _serviceRegistry ].getServiceNode(this.serviceName).options

    this._setTransport()
    this._setLoadBalancer()
  }

  /**
   * Sets dynamic transport.
   *
   * @protected
   */
  _setTransport () {
    if (!this[ _options ] || !this[ _options ].transport) {
      return
    }

    this[ _transport ] = _loadDynamicComponent(this[ _options ].transport.type, this[ _options ].transport)
  }

  /**
   * Sets dynamic load balancer.
   *
   * @protected
   */
  _setLoadBalancer () {
    if (!this[ _options ] || !this[ _options ].loadbalancer) {
      return
    }

    this[ _loadBalancer ] = _loadDynamicComponent(this[ _options ].loadbalancer)
  }

  /**
   * Gets information about possibility load balancing.
   *
   * @return {boolean}
   * @protected
   */
  _isPossibleLoadBalancing () {
    const transportLoadBalancingOn = !(this[ _options ].transport.loadbalancing === false)
    const loadBalancingType = !!this[ _options ].loadbalancer
    const loadBalancerExists = !!this[ _loadBalancer ]

    return transportLoadBalancingOn && loadBalancingType && loadBalancerExists
  }
}

/**
 * Helper method to load dynamic component.
 *
 * @param {string} type - Path or name of module.
 * @param {*} options
 * @private
 */
function _loadDynamicComponent (type, options) {
  Assert.assert(type, new Error())

  const Component = require(type)
  return new Component(options)
}

module.exports = Client
