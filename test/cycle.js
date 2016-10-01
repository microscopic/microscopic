'use strcit'

const chai = require('chai')
const expect = chai.expect

const Cycle = require('../lib/cycle')

describe('Cycle', () => {
  describe('add()', () => {
    it('should add step to cycle', () => {
      const cycle = new Cycle()

      expect(cycle.cycle.length).to.be.equal(0)

      cycle.add(() => 1)

      expect(cycle.cycle.length).to.be.equal(1)
    })

    it('should flat array', () => {
      const cycle = new Cycle()

      expect(cycle.cycle.length).to.be.equal(0)

      cycle.add([ () => 1, () => 2 ])

      expect(cycle.cycle.length).to.be.equal(2)
    })
  })

  describe('start()', () => {
    it('should run steps in order', () => {
      const result = []

      const cycle = new Cycle()
      cycle.add([
        (next) => {
          result.push(1)
          next()
        },
        (next) => {
          result.push(2)
          next()
        }
      ])

      cycle.add([
        (next) => {
          result.push(3)
          next()
        },
        (next) => {
          result.push(4)
          next()
        }
      ])

      cycle.start()

      expect(result.length).to.be.equal(4)

      for (let i = 0; i < result.length; i++) {
        expect(result[ i ]).to.be.equal(i + 1)
      }
    })
  })
})
