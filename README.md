# Microscopic

Microscopic is a framework for writing microservice in Node. Main aim is to easily and quickly create customizable microservices, which is based on plugin system, so that each service can use a different communication protocol or load balancing algorithm.

Service
```javascript
const utils = require('microscopic-utils');
const IP = utils.ip

const Microscopic = require('microscopic');
const microscopic = new Microscopic({
  etcd: {
    hosts: [ 'http://etcd:2379' ]
  }
})

const dateService = microscopic.createService('date-service', {
  transport: { type: 'microscopic-tcp-transport' },
  loadbalancer: 'microscopic-roundrobin-load-balancer',
})

dateService.addMethod({
  name: 'getDate',
  handler: (request, reply) => {
    reply({ date: new Date().toDateString(), ip: IP.getIP() })
  }
})

dateService.start()
```

Client
```javascript
const Microscopic = require('microscopic');
const microscopic = new Microscopic({
  etcd: {
    hosts: [ 'http://etcd:2379' ]
  }
})

const dateServiceClient = microscopic.createClient('date-service')

dateServiceClient.send('getDate', {}, (error, response) => {
  const date = response.result.date

  console.log(`DATE FROM: ${response.result.ip}`)
})
```

More examples - https://github.com/microscopic/microscopic-examples and more plugins - https://github.com/microscopic

## Notes 
At the moment to use framework is needed [ETCD](https://github.com/coreos/etcd) server, but is scheduled to add the ability to run without additional components.

## Roadmap
- API Gateway
- plugin to generate documentation
- monitoring and logging plugin
- more transport plugins
- more algorithms of load balancing
- documentation
