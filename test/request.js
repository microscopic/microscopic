'use strict'

const chai = require('chai')
const expect = chai.expect

const Request = require('../lib/request')
const Response = require('../lib/response')

describe('Request', () => {
  describe('constructor()', () => {
    // TODO
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
