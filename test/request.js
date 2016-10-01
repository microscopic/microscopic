// 'use strict'
//
// const chai = require('chai')
// const sinon = require('sinon')
//
// const expect = chai.expect
//
// const Request = require('../lib/request')
//
// describe('Request', () => {
//   describe('get isExpired()', () => {
//     it('should return true if request is expired', (done) => {
//       const request = new Request(
//         { name: 'test', id: '123' }, {
//           timeout: 10, info: { sent: Date.now() }
//         })
//
//       setTimeout(() => {
//         expect(request.isExpired).to.be.true
//
//         done()
//       }, 20)
//     })
//
//     it('should return false if request is not expired', (done) => {
//       const request = new Request(
//         { name: 'test', id: '123' }, {
//           timeout: 100, info: { sent: Date.now() }
//         })
//
//       setTimeout(() => {
//         expect(request.isExpired).to.be.false
//
//         done()
//       }, 20)
//     })
//   })
//
//   describe('setResponse()', () => {
//     it('should set response', () => {
//       const request = new Request({ name: 'test', id: '123' }, { method: 'test' })
//
//       const spy = sinon.spy()
//       request.response = {
//         response: spy
//       }
//
//       request.setResponse({ ok: 1 })
//
//       expect(spy.calledWith({ ok: 1 })).to.be.true
//     })
//   })
//
//   describe('toJSON()', () => {
//     it('should return copy of request', () => {
//       const request = new Request({ name: 'test', id: '123' }, { method: 'test' })
//       expect(request.toJSON()).to.not.equal(request)
//     })
//
//     it('should return copy without response field', () => {
//       const request = new Request({ name: 'test', id: '123' }, { method: 'test' })
//       expect(request.toJSON().response).to.be.undefined
//     })
//
//     it('should return copy without response field - JSON.stringify', () => {
//       const request = new Request({ name: 'test', id: '123' }, { method: 'test' })
//       expect(JSON.parse(JSON.stringify(request)).response).to.be.undefined
//     })
//   })
// })
