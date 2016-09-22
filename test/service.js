'use strict'

const chai = require('chai')
const mockery = require('mockery')
const sinon = require('sinon')

const expect = chai.expect

const Method = require('../lib/method')
const Request = require('../lib/request')
const Response = require('../lib/response')
const Service = require('../lib/service')
const Transport = require('microscopic-transport')

describe('Service', () => {
  describe('addMethod()', () => {
    it('should add method', () => {
      const service = new Service({}, 'test', {})

      const method = { name: 'name', handler: () => null }

      expect(() => service.addMethod(method)).to.not.throw()
    })

    it('should throw error if method with the same name and version exists ', () => {
      const service = new Service({}, 'test', {})

      const method = { name: 'name', version: 'v1', handler: () => null }
      service.addMethod(method)

      expect(() => service.addMethod(method)).to.throw()
    })
  })

  describe('getMethod()', () => {
    it('should return method', () => {
      const service = new Service({}, 'test', {})

      service.addMethod({ name: 'name', handler: () => null })

      const method = service.getMethod('name')

      expect(method).to.be.instanceOf(Method)
      expect(method.name).to.be.equal('name')
    })

    it('should throw error if method does not exist', () => {
      const service = new Service({}, 'test', {})

      expect(() => service.getMethod('name')).to.throw()
    })
  })

  describe('onMessage()', () => {
    it('should run method from message', () => {
      const service = new Service({}, 'test', {})

      const method = { run: sinon.spy() }
      sinon.stub(service, 'getMethod').returns(method)

      const message = { name: 'test', version: 'v1' }

      service.onMessage(message)

      expect(method.run.called).to.be.true
    })

    it('should create request and response', () => {
      const service = new Service({}, 'test', {})

      const method = { run: sinon.spy() }
      sinon.stub(service, 'getMethod').returns(method)

      const message = { name: 'test', version: 'v1' }
      const sendResponse = () => 1

      service.onMessage(message, sendResponse)

      const args = method.run.args[ 0 ] // arguments from first call
      expect(args[ 0 ]).to.be.instanceOf(Request)
      expect(args[ 1 ]).to.be.instanceOf(Response)
    })

    it('should not run method if message does not exist', () => {
      const service = new Service({}, 'test', {})

      const method = { run: sinon.spy() }
      sinon.stub(service, 'getMethod').returns(method)

      service.onMessage(null)

      expect(method.run.called).to.be.false
    })
  })

  describe('start()', () => {
    let listenSpy
    let microscopicMock

    before(() => mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false
    }))

    beforeEach(() => {
      listenSpy = sinon.spy()

      microscopicMock = {
        serviceRegistry: {
          register: sinon.spy(),
          renew: sinon.spy()
        }
      }

      class TestTransport extends Transport {
        listen (...args) {
          listenSpy(args)

          return Promise.resolve({ address: this.options.address || '127.1.1.1' })
        }

        send () {

        }
      }

      mockery.registerMock('test-transport', TestTransport)
    })

    after(() => mockery.disable())

    it('should call listen on new Transport', () => {
      const service = new Service(microscopicMock, 'test', { transport: { type: 'test-transport' } })

      service.start()

      expect(listenSpy.called).to.be.true
    })

    it('should register service into Service Registry', () => {
      const service = new Service(microscopicMock, 'test', { transport: { type: 'test-transport' } })
      service.start()
        .then(() => {
          const args = microscopicMock.serviceRegistry.register.args[ 0 ]

          expect(args[ 0 ]).to.be.equal('test') // name
          expect(args[ 1 ]).to.be.deep.equal({ address: '127.1.1.1' }) // connectionConfig
          expect(args[ 2 ]).to.be.deep.equal({ transport: { type: 'test-transport' } }) // options
        })
    })

    it('should start heartbeat interval ', () => {
      const clock = sinon.useFakeTimers()

      const service = new Service(microscopicMock, 'test', { transport: { type: 'test-transport' } })
      service.start()
        .then(() => {
          clock.tick(30 * 1000)
          clock.tick(30 * 1000)

          expect(microscopicMock.serviceRegistry.renew.calledTwice).to.be.true

          clock.restore()
        })
    })

    it('should throw error if transport does not inherit from Transport (microscopic-transport)', () => {
      class TestTransport {
        listen (...args) {
          listenSpy(args)

          return Promise.resolve({ address: this.options.address || '127.1.1.1' })
        }

        send () {

        }
      }

      mockery.registerMock('test-transport', TestTransport)

      const service = new Service(microscopicMock, 'test', { transport: { type: 'test-transport' } })

      expect(() => service.start()).to.throw(TypeError)
    })
  })
})
