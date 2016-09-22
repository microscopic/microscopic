'use strict'

const chai = require('chai')
const mockery = require('mockery')
const sinon = require('sinon')

const expect = chai.expect

const Client = require('./../lib/client')
const LoadBalancer = require('microscopic-load-balancer')
const Transport = require('microscopic-transport')

describe('Client', () => {
  let serviceNode = {
    transport: {
      type: 'test-transport'
    }
  }

  let nodes = [ { connection: '127.0.0.1' } ]

  let microscopicMock
  let sendSpy

  before(() => mockery.enable({
    warnOnReplace: false,
    warnOnUnregistered: false
  }))

  beforeEach(() => {
    sendSpy = sinon.spy()

    microscopicMock = {
      serviceRegistry: {
        getService: () => nodes,
        getServiceNode: () => serviceNode
      }
    }

    class TestTransport extends Transport {
      listen () {
      }

      send (connectionConfig, msg, callback) {
        sendSpy(connectionConfig, msg, callback)

        callback(null, {})
      }
    }

    mockery.registerMock('test-transport', TestTransport)
  })

  after(() => mockery.disable())

  describe('constructor()', () => {
    it('should set serviceName', () => {
      const client = new Client(microscopicMock, 'test')

      expect(client.serviceName).to.be.equal('test')
    })

    it('should set random id', () => {
      const client = new Client(microscopicMock, 'test')
      const client1 = new Client(microscopicMock, 'test')

      expect(client.id).to.not.be.undefined
      expect(client.id).to.not.be.equal(client1.id)
    })

    it('should throw error if service registry does not exist', () => {
      expect(() => new Client({}, 'test')).to.throw()
    })
  })

  describe('send()', () => {
    it('should send correct form of request', () => {
      const start = Date.now()

      const client = new Client(microscopicMock, 'test')
      client.send('test', { params: { a: 1, b: 2 } }, () => null)

      const args = sendSpy.args[ 0 ]

      expect(args[ 1 ].method).to.be.equal('test')
      expect(args[ 1 ].params).to.be.deep.equal({ a: 1, b: 2 })
      expect(args[ 1 ].info.client).to.be.deep.equal({
        id: client.id
      })
      expect(args[ 1 ].info.sent).to.be.within(start, Date.now())
    })

    it('should send request to first node if transport has disabled loadbalancing', () => {
      serviceNode = {
        transport: {
          type: 'test-transport',
          loadbalancing: false
        }
      }

      nodes = [ { connection: '1' }, { connection: '2' } ]

      const client = new Client(microscopicMock, 'test')
      client.send('test', {}, () => null)

      const args = sendSpy.args[ 0 ]

      expect(args[ 0 ]).to.be.equal(nodes[ 0 ].connection)
    })

    it('should send request to first node if not set loadbalancer type', () => {
      serviceNode = {
        loadbalancer: '',
        transport: {
          type: 'test-transport'
        }
      }

      nodes = [ { connection: '1' }, { connection: '2' } ]

      const client = new Client(microscopicMock, 'test')
      client.send('test', {}, () => null)

      const args = sendSpy.args[ 0 ]

      expect(args[ 0 ]).to.be.equal(nodes[ 0 ].connection)
    })

    it('should send request to selected node by loadbalancer', () => {
      class TestLoadBalancer extends LoadBalancer {
        balance () {
          return { connection: 'load-balancer' }
        }
      }

      mockery.registerMock('test-load-balancer', TestLoadBalancer)

      serviceNode = {
        loadbalancer: 'test-load-balancer',
        transport: {
          type: 'test-transport'
        }
      }

      const client = new Client(microscopicMock, 'test')
      client.send('test', {}, () => null)

      const args = sendSpy.args[ 0 ]

      expect(args[ 0 ]).to.be.equal('load-balancer')
    })

    it('should throw error if does not set transport', () => {
      serviceNode = {}

      nodes = [ { connection: '1' }, { connection: '2' } ]

      const client = new Client(microscopicMock, 'test')
      expect(() => client.send('test', {}, () => null)).to.throw()
    })
  })
})
