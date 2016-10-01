'use strict'

const utils = require('microscopic-utils')
const Asserts = utils.asserts

class Method {
  /**
   * @param {MethodDefinition} definition
   */
  constructor (definition) {
    Asserts.assert(typeof definition.handler === 'function' ||
      typeof definition.handler.then === 'function', new Error('Handler is required!'))
    Asserts.assert(typeof definition.name === 'string', new Error('Name is required!'))

    /**
     * @type {MethodDefinition}
     */
    this.definition = definition
  }

  /**
   * Name with version.
   *
   * @return {string}
   */
  get name () {
    return Method.getName(this.definition.name, this.definition.version)
  }

  /**
   * Executes handler of method.
   *
   * @param {Request} request
   * @param {Response} response
   */
  run (request, reply) {
    try {
      this.definition.handler(request, reply)
    } catch (error) {
      reply(error)
    }
  }


  /**
   * Returns full name of method (name + version).
   *
   * @param {string} name - The name of method.
   * @param {string} version - The version of method.
   * @return {string}
   */
  static getName (name, version) {
    const result = version ? `${name}_${version}` : name
    return result.toLowerCase()
  }
}

module.exports = Method

/**
 * @typedef {object} MethodDefinition
 * @property {string} name - The name of method.
 * @property {string} [version] - The version of method.
 * @property {function} handler - Handler (logic) of method.
 */
