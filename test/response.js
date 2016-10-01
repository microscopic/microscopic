'use strict'

const chai = require('chai')
const sinon = require('sinon')

const expect = chai.expect

const Request = require('../lib/request')
const Response = require('../lib/response')

const serviceMock = {
  name: 'name',
  id: 1
}

describe('Response', () => {
  describe('get isResponded()', () => {
    it('should return true if response was sent', () => {
      const request = new Request(serviceMock, {
        info: {
          responded: 1
        }
      })

      const response = new Response(request)
      expect(response.isResponded).to.be.true
    })

    it('should return false if response was not sent', () => {
      const request = new Request(serviceMock, {})

      const response = new Response(request)
      expect(response.isResponded).to.be.false
    })
  })

  describe('response()', () => {
    it('should set success status', () => {
      const response = new Response(new Request(serviceMock, {}))

      response.response({ ok: 1 })

      expect(response.status).to.be.equal(Response.STATUS.SUCCESS)
    })

    it('should set success result', () => {
      const response = new Response(new Request(serviceMock, {}))

      response.response({ ok: 1 })

      expect(response.result).to.be.deep.equal({ ok: 1 })
    })

    it('should set error status', () => {
      const response = new Response(new Request(serviceMock, {}))

      response.response(new Error('test'))

      expect(response.status).to.be.equal(Response.STATUS.FAIL)
    })

    it('should set error result', () => {
      const response = new Response(new Request(serviceMock, {}))

      const error = new Error('test test')
      error.data = { test: 1, test1: 2 }

      response.response(error)

      expect(response.error).to.be.equal(error)
    })
  })

  describe('timeout()', () => {
    it('should set timeout status', () => {
      const response = new Response(new Request(serviceMock, {}))

      response.timeout()

      expect(response.status).to.be.equal(Response.STATUS.TIMEOUT)
    })

    it('should set error', () => {
      const response = new Response(new Request(serviceMock, {}))

      response.timeout()

      expect(response.error.message).to.be.equal('Timeout')
    })
  })

  describe('toJSON()', () => {
    it('should return copy of response', () => {
      const response = new Response(new Request({ name: 'test', id: '123' }, { method: 'test' }))
      expect(response.toJSON()).to.not.equal(response)
    })

    it('should return copy without response field', () => {
      const response = new Response(new Request({ name: 'test', id: '123' }, { method: 'test' }))
      expect(response.toJSON().request.response).to.be.undefined
    })

    it('should return copy without response field - JSON.stringify', () => {
      const response = new Response(new Request({ name: 'test', id: '123' }, { method: 'test' }))
      expect(JSON.parse(JSON.stringify(response)).request.response).to.be.undefined
    })
  })
})
