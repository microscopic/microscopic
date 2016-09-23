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

      const response = new Response(request, () => null)
      expect(response.isResponded).to.be.true
    })

    it('should return false if response was not sent', () => {
      const request = new Request(serviceMock, {})

      const response = new Response(request, () => null)
      expect(response.isResponded).to.be.false
    })
  })

  describe('createReply()', () => {
    it('should return function', () => {
      const response = new Response(new Request(serviceMock, {}), () => null)
      const reply = response.createReply()

      expect(reply).to.be.a('function')
    })
  })

  describe('response()', () => {
    it('should set success status', () => {
      const response = new Response(new Request(serviceMock, {}), () => null)

      response.response({ ok: 1 })

      expect(response.status).to.be.equal(Response.STATUS.SUCCESS)
    })

    it('should set success result', () => {
      const response = new Response(new Request(serviceMock, {}), () => null)

      response.response({ ok: 1 })

      expect(response.result).to.be.deep.equal({ ok: 1 })
    })

    it('should send response', () => {
      const sendResponseSpy = sinon.spy()
      const response = new Response(new Request(serviceMock, {}), sendResponseSpy)

      response.response({ ok: 1 })

      expect(sendResponseSpy.calledWith(null, response)).to.be.true
    })

    it('should set responded time', () => {
      const response = new Response(new Request(serviceMock, {}), () => null)
      expect(response.request.info.responded).to.be.undefined

      const start = Date.now()

      response.response({ ok: 1 })

      expect(response.request.info.responded).to.be.within(start, Date.now())
    })

    it('should set error status', () => {
      const response = new Response(new Request(serviceMock, {}), () => null)

      response.response(new Error('test'))

      expect(response.status).to.be.equal(Response.STATUS.FAIL)
    })

    it('should set error result', () => {
      const response = new Response(new Request(serviceMock, {}), () => null)

      const error = new Error('test test')
      error.data = { test: 1, test1: 2 }

      response.response(error)

      expect(response.error).to.be.deep.equal({ message: 'test test', details: { test: 1, test1: 2 } })
    })

    it('should throw error if response called wtice', () => {
      const response = new Response(new Request(serviceMock, {}), () => null)
      response.response({ ok: 1 })

      expect(() => response.response({ ok: 2 })).to.throw(Error)
    })
  })

  describe('timeout()', () => {
    it('should set timeout status', () => {
      const response = new Response(new Request(serviceMock, {}), () => null)

      response.timeout()

      expect(response.status).to.be.equal(Response.STATUS.TIMEOUT)
    })

    it('should send response', () => {
      const sendResponseSpy = sinon.spy()
      const response = new Response(new Request(serviceMock, {}), sendResponseSpy)

      response.timeout()

      expect(sendResponseSpy.calledWith(null, response)).to.be.true
    })
  })
})
