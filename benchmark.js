var Benchmark = require('benchmark')
var suite = new Benchmark.Suite

var arb = require('./arb-tests.js')
var biginteger = require('./biginteger-tests.js')

// add tests
suite.add('arb', arb)
suite.add('biginteger', biginteger)

// add listeners
suite.on('cycle', function(event) {
  console.log(String(event.target))
})
suite.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').pluck('name'))
})
// run async
suite.run({ 'async': true })

