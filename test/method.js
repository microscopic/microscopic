'use strict'

const chai = require('chai')
const sinon = require('sinon')

const expect = chai.expect

const Method = require('../lib/method')
const Response = require('../lib/response')

describe('Method', () => {
  describe('constructor()', () => {
    it('should throw error if definition does not have a field name', () => {
      expect(() => new Method({ handler: () => null })).to.throw()
    })

    it('should throw error if definition does not have a field handler', () => {
      expect(() => new Method({ name: 'name' })).to.throw()
    })
  })

  describe('get name()', () => {
    it('should return correct name with version', () => {
      const method = new Method({ name: 'name', version: 'v1', handler: () => null })
      expect(method.name).to.be.equal('name_v1')
    })

    it('should return only name without version', () => {
      const method = new Method({ name: 'name', handler: () => null })
      expect(method.name).to.be.equal('name')
    })

    it('should return lower case', () => {
      const method = new Method({ name: 'NAME', handler: () => null })
      expect(method.name).to.be.equal('name')
    })
  })

  describe('run()', () => {
    let definition
    let method

    beforeEach(() => {
      definition = {
        name: 'name',
        handler: sinon.spy()
      }

      method = new Method(definition)
    })

    it('should call handler', () => {
      method.run({}, { createReply: () => null })

      expect(definition.handler.called).to.be.true
    })

    it('should create reply and inject to handler', () => {
      const reply = () => null
      method.run({}, { createReply: () => reply })

      expect(definition.handler.calledWith({}, reply)).to.be.true
    })

    it('should not call handler if response sent', () => {
      method.run({}, { isResponded: true, createReply: () => null })

      expect(definition.handler.called).to.be.false
    })

    it('should not call and call `response.timeout` if request is expired', () => {
      const request = {
        isExpired: true
      }

      const response = {
        createReply: () => null,
        timeout: sinon.spy()
      }

      method.run(request, response)

      expect(response.timeout.calledOnce).to.be.true
      expect(definition.handler.called).to.be.false
    })

    it('should catch error from handler and send error response', () => {
      const error = new TypeError('Test Test')

      definition = {
        name: 'name',
        handler: () => {
          throw error
        }
      }

      const responseSpy = sinon.spy()
      const response = {
        response: responseSpy,
        createReply: () => responseSpy
      }

      const method = new Method(definition)
      method.run({}, response)

      expect(response.response.calledWith(error)).to.be.true
    })

    it('should catch error from promise handler and send error response', () => {
      const error = new TypeError('Test Test')

      definition = {
        name: 'name',
        handler: Promise.reject(error)
      }

      const responseSpy = sinon.spy()
      const response = {
        response: responseSpy,
        createReply: () => responseSpy
      }

      const method = new Method(definition)
      method.run({}, response)

      expect(response.response.calledWith(error)).to.be.true
    })

    it('should catch error from handler and not send error response if response was sent', () => {
      const error = new TypeError('Test Test')

      definition = {
        name: 'name',
        handler: (request, reply) => {
          reply('ok')

          throw error
        }
      }

      const sendSpy = sinon.spy()
      const response = new Response({ info: {} }, sendSpy)

      const method = new Method(definition)
      method.run({}, response)

      expect(sendSpy.calledOnce).to.be.true
    })
  })
})
