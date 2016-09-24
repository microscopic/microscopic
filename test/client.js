'use strict'

const chai = require('chai')
const mockery = require('mockery')
const sinon = require('sinon')

const expect = chai.expect

const Client = require('./../lib/client')
const Response = require('../lib/response')
const LoadBalancer = require('microscopic-load-balancer')
const Transport = require('microscopic-transport')

describe('Client', () => {
  let serviceOptions
  let nodes = [ { connection: '127.0.0.1' } ]

  let microscopicMock
  let sendSpy

  let callbackError
  let callbackResponse

  before(() => mockery.enable({
    warnOnReplace: false,
    warnOnUnregistered: false
  }))

  beforeEach(() => {
    serviceOptions = {
      transport: {
        type: 'test-transport'
      }
    }

    sendSpy = sinon.spy()

    microscopicMock = {
      serviceRegistry: {
        getService: () => Promise.resolve(nodes),
        getServiceOptions: () => Promise.resolve(serviceOptions)
      }
    }

    callbackError = null
    callbackResponse = {
      status: Response.STATUS.SUCCESS
    }

    class TestTransport extends Transport {
      listen () {
      }

      send (connectionConfig, msg, callback) {
        sendSpy(connectionConfig, msg, callback)

        callback(callbackError, callbackResponse)
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
    it('should send correct form of request', (done) => {
      const start = Date.now()

      const client = new Client(microscopicMock, 'test')

      setTimeout(() => {
        client.send('test', { params: { a: 1, b: 2 } }, () => {
          const args = sendSpy.args[ 0 ]

          expect(args[ 1 ].method).to.be.equal('test')
          expect(args[ 1 ].params).to.be.deep.equal({ a: 1, b: 2 })
          expect(args[ 1 ].timeout).to.be.deep.equal(10000)
          expect(args[ 1 ].headers).to.be.a('object')
          expect(args[ 1 ].info.client).to.have.all.keys([ 'id', 'ip' ])
          expect(args[ 1 ].info.sent).to.be.within(start, Date.now())
          expect(args[ 1 ]._callback).to.be.undefined
          expect(args[ 1 ]._timeout).to.be.undefined

          done()
        })
      }, 50)
    })

    it('should send request to first node if transport has disabled loadbalancing', (done) => {
      serviceOptions = {
        transport: {
          type: 'test-transport',
          loadbalancing: false
        }
      }

      nodes = [ { connection: '1' }, { connection: '2' } ]

      const client = new Client(microscopicMock, 'test')
      client.send('test', {}, () => {
        const args = sendSpy.args[ 0 ]

        expect(args[ 0 ]).to.be.equal(nodes[ 0 ].connection)

        done()
      })
    })

    it('should send request to first node if not set loadbalancer type', (done) => {
      serviceOptions = {
        loadbalancer: '',
        transport: {
          type: 'test-transport'
        }
      }

      nodes = [ { connection: '1' }, { connection: '2' } ]

      const client = new Client(microscopicMock, 'test')
      client.send('test', {}, () => {
        const args = sendSpy.args[ 0 ]

        expect(args[ 0 ]).to.be.equal(nodes[ 0 ].connection)

        done()
      })
    })

    it('should send request to selected node by loadbalancer', (done) => {
      class TestLoadBalancer extends LoadBalancer {
        balance () {
          return { connection: 'load-balancer' }
        }
      }

      mockery.registerMock('test-load-balancer', TestLoadBalancer)

      serviceOptions = {
        loadbalancer: 'test-load-balancer',
        transport: {
          type: 'test-transport'
        }
      }

      const client = new Client(microscopicMock, 'test')
      client.send('test', {}, () => {
        const args = sendSpy.args[ 0 ]

        expect(args[ 0 ]).to.be.equal('load-balancer')

        done()
      })
    })

    it('should call callback with response', (done) => {
      callbackResponse = { status: Response.STATUS.SUCCESS, result: 1 }

      const client = new Client(microscopicMock, 'test')

      client.send('test', { a: 1 }, (error, response) => {
        expect(error).to.be.null
        expect(response).to.be.deep.equal(callbackResponse)

        done()
      })
    })

    it('should call callback with error', (done) => {
      callbackError = new Error('ERROR')
      callbackResponse = { status: Response.STATUS.SUCCESS, result: 1 }

      const client = new Client(microscopicMock, 'test')

      client.send('test', { a: 1 }, (error) => {
        expect(error).to.be.instanceOf(Error)
        expect(error).to.be.equal(callbackError)

        done()
      })
    })

    it('should call callback with error if response has error', (done) => {
      const err = new Error('ERROR')
      callbackResponse = { error: err, status: Response.STATUS.FAIL, result: 1 }

      const client = new Client(microscopicMock, 'test')

      client.send('test', { a: 1 }, (error) => {
        expect(error).to.be.instanceOf(Error)

        done()
      })
    })

    it('should call callback with error if unknown error', (done) => {
      callbackResponse = { status: Response.STATUS.FAIL, result: 1 }

      const client = new Client(microscopicMock, 'test')

      client.send('test', { a: 1 }, (error) => {
        expect(error).to.be.instanceOf(Error)
        expect(error.message).to.be.equal('Unknown error')

        done()
      })
    })

    it('should call callback with timeout error', (done) => {
      callbackResponse = { status: Response.STATUS.TIMEOUT, result: 1 }

      const client = new Client(microscopicMock, 'test')

      client.send('test', { a: 1 }, (error, response) => {
        expect(error).to.be.instanceOf(Error)
        expect(error.message).to.be.equal('Request timeout!')
        expect(response).to.be.a('object')

        done()
      })
    })

    it('should call callback after timeout', (done) => {
      class TestTransport extends Transport {
        listen () {
        }

        send (connectionConfig, msg, callback) {
        }
      }

      mockery.registerMock('test-transport', TestTransport)

      const client = new Client(microscopicMock, 'test')

      client.send('test', { a: 1, timeout: 10 }, (error, response) => {
        expect(error).to.be.instanceOf(Error)
        expect(error.message).to.be.equal('Request timeout!')
        expect(response).to.be.undefined

        done()
      })
    })

    it('should call callback once after timeout', (done) => {
      class TestTransport extends Transport {
        listen () {
        }

        send (connectionConfig, msg, callback) {
          setTimeout(() => callback(null, 123), 50)
        }
      }

      mockery.registerMock('test-transport', TestTransport)

      const client = new Client(microscopicMock, 'test')

      client.send('test', { a: 1, timeout: 10 }, (error, response) => {
        expect(error).to.be.instanceOf(Error)
        expect(response).to.be.undefined

        done()
      })
    })

    it('should send request with headers', (done) => {
      const client = new Client(microscopicMock, 'test')
      client.send('test', { headers: { 'x-test': 123, 'x-test-1': 1 } }, () => {
        const args = sendSpy.args[ 0 ]

        expect(args[ 1 ].headers).to.be.deep.equal({ 'x-test': 123, 'x-test-1': 1 })

        done()
      })
    })
  })
})
