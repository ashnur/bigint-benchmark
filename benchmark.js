var Benchmark = require('benchmark')
var suite = new Benchmark.Suite

var arb = require('./arb-tests.js')()
var biginteger = require('./biginteger-tests.js')()
var BigInt = require('./bigint-tests.js')()
var bn = require('./bn-tests.js')()
var gmp = require('./gmp-tests.js')()

// Benchmark.options.minTime = 1
// add tests
suite.add('arb', arb.addition, {onCycle: arb.clean})
suite.add('biginteger', biginteger.addition, {onCycle: biginteger.clean})
suite.add('BigInt', BigInt.addition, {onCycle: BigInt.clean})
suite.add('bn', bn.addition, {onCycle: bn.clean})
//suite.add('gmp', gmp.addition, {onCycle: gmp.clean})

// add listeners
suite.on('cycle', function(event) {
  console.log(String(event.target))
})
suite.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').pluck('name'))
})
// run async
suite.run({ 'async': true })

