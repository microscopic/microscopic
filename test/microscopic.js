'use strict'

const chai = require('chai')
const expect = chai.expect

const Microscopic = require('../lib/microscopic')
const Client = require('../lib/client')
const Service = require('../lib/service')

describe('Microscopic', () => {
  describe('createService()', () => {
    it('should return Service', () => {
      const microscopic = new Microscopic({})

      const service = microscopic.createService('test', { test: 1 })

      expect(service).to.be.instanceOf(Service)
    })
  })

  describe('createClient()', () => {
    it('should return Client', () => {
      const microscopic = new Microscopic({ registry: { getServiceOptions: () => ({}) } })

      const client = microscopic.createClient('test')

      expect(client).to.be.instanceOf(Client)
    })
  })
})
