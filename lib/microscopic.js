'use strict'

const EtcdRegistry = require('microscopic-etcd-registry')
const Service = require('./service')
const Client = require('./client')

class Microscopic {
  /**
   * @param {object} options
   */
  constructor (options) {
    this.options = options

    this.options.etcd = this.options.etcd || {}
    this.serviceRegistry = options.registry || new EtcdRegistry(this.options.etcd.hosts)
  }

  /**
   * Creates instance of Service.
   *
   * @param {string} name - Name of service.
   * @param {object} options
   * @return {Service}
   */
  createService (name, options) {
    return new Service(this, name, options)
  }

  /**
   * Creates instance of Client.
   *
   * @param {string} serviceName - Service name.
   * @return {Client}
   */
  createClient (serviceName) {
    return new Client(this, serviceName)
  }
}

module.exports = Microscopic
