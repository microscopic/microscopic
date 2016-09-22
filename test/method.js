'use strict'

const chai = require('chai')
const sinon = require('sinon')

const expect = chai.expect

const Method = require('../lib/method')

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
  })
})