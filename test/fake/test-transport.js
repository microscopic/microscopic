'use strict'

const Transport = require('microscopic-transport')

class FakeTransport extends Transport {
  listen (...args) {
    this.options.listenSpy(args)

    return Promise.resolve({ address: this.options.address || '127.1.1.1' })
  }

  send () {

  }
}

module.exports = FakeTransport
