'use strcit'

const utils = require('microscopic-utils')
const Async = utils.async

class Cycle {
  /**
   * @param {function} [everyStep]
   * @param {function} [finalStep]
   */
  constructor (everyStep, finalStep) {
    this.everyStep = everyStep || ((method, next) => method(next))
    this.finalStep = finalStep || (() => null)

    this.cycle = []
  }

  /**
   * Adds step or steps to cycle.
   *
   * @param {function|array.<function>}steps
   */
  add (steps = []) {
    if (Array.isArray(steps)) {
      steps.forEach((step) => this.cycle.push(step))
    } else {
      this.cycle.push(steps)
    }
  }

  /**
   * Runs all steps from cycle.
   */
  start () {
    Async.serial(this.cycle, this.everyStep, this.finalStep)
  }
}

module.exports = Cycle
