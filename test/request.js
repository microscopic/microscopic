'use strict'

const chai = require('chai')
const sinon = require('sinon')

const expect = chai.expect

const Request = require('../lib/request')
const Response = require('../lib/response')

describe('Request', () => {
  describe('constructor()', () => {
    it('should set info data', () => {
      const request = new Request(
        { name: 'test', id: '123' }, {
          timeout: 10, info: { sent: Date.now() }
        })

      expect(request.info).to.have.all.keys([ 'received', 'service', 'sent' ])
      expect(request.info.service).to.have.all.keys([ 'name', 'id', 'ip' ])
    })

    it('should set timeout', (done) => {
      const request = new Request(
        { name: 'test', id: '123' }, {
          timeout: 10, info: { sent: Date.now() }
        })

      request.response = {
        timeout: sinon.spy()
      }

      setTimeout(() => {
        expect(request.response.timeout.called).to.be.true

        done()
      }, 100)
    })
  })

  describe('get isExpired()', () => {
    it('should return true if request is expired', (done) => {
      const request = new Request(
        { name: 'test', id: '123' }, {
          timeout: 10, info: { sent: Date.now() }
        })

      setTimeout(() => {
        expect(request.isExpired).to.be.true

        done()
      }, 20)
    })

    it('should return false if request is not expired', (done) => {
      const request = new Request(
        { name: 'test', id: '123' }, {
          timeout: 100, info: { sent: Date.now() }
        })

      setTimeout(() => {
        expect(request.isExpired).to.be.false

        done()
      }, 20)
    })
  })

  describe('createResponse()', () => {
    it('should create response', () => {
      const request = new Request({ name: 'test', id: '123' }, { method: 'test' })
      const sendResponse = () => 1

      const response = request.createResponse(sendResponse)

      expect(response).to.be.instanceOf(Response)
      expect(response.request).to.be.equal(request)
      expect(request.response).to.be.equal(response)
    })
  })

  describe('toJSON()', () => {
    it('should return copy of request', () => {
      const request = new Request({ name: 'test', id: '123' }, { method: 'test' })
      expect(request.toJSON()).to.not.equal(request)
    })

    it('should return copy without response field', () => {
      const request = new Request({ name: 'test', id: '123' }, { method: 'test' })
      expect(request.toJSON().response).to.be.undefined
    })

    it('should return copy without response field - JSON.stringify', () => {
      const request = new Request({ name: 'test', id: '123' }, { method: 'test' })
      expect(JSON.parse(JSON.stringify(request)).response).to.be.undefined
    })
  })
})
