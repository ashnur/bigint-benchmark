var Benchmark = require('benchmark')

// ignore the lines with arb, it's not just the slowest by two orders of magnitude, but given how it is written, it SHOULD be the slowest

// var arb = require('./arb-tests.js')()
var biginteger = require('./biginteger-tests.js')()
var BigInt = require('./bigint-tests.js')()
var bn = require('./bn-tests.js')()
//var gmp = require('./gmp-tests.js')()
var mathjs = require('./mathjs-tests.js')()
var asmbn = require('./asmbignum-tests.js')()

// Benchmark.options.minTime = 1
// Benchmark.options.minSamples = 50
// add tests
var addition = new Benchmark.Suite
// addition.add('arb-add', arb.addition, {onCycle: arb.clean})
addition.add('biginteger-add', biginteger.addition, {onCycle: biginteger.clean})
addition.add('BigInt-add', BigInt.addition, {onCycle: BigInt.clean})
addition.add('bn-add', bn.addition, {onCycle: bn.clean})
addition.add('mathjs-add', mathjs.addition, {onCycle: mathjs.clean})
addition.add('asmbn-add', asmbn.addition, {onCycle: asmbn.clean})
//suite.add('gmp', gmp.addition, {onCycle: gmp.clean})

// add listeners
addition.on('cycle', function(event) { console.log(String(event.target)) })
addition.on('complete', function() { console.log('Fastest is ' + this.filter('fastest').pluck('name')) })
// run async
addition.run({ 'async': false })

var subtraction = new Benchmark.Suite
//subtraction.add('arb-subtraction', arb.subtraction, {onCycle: arb.clean})
subtraction.add('biginteger-subtraction', biginteger.subtraction, {onCycle: biginteger.clean})
subtraction.add('BigInt-subtraction', BigInt.subtraction, {onCycle: BigInt.clean})
subtraction.add('bn-subtraction', bn.subtraction, {onCycle: bn.clean})
subtraction.add('mathjs-subtraction', mathjs.subtraction, {onCycle: mathjs.clean})
subtraction.add('asmbn-add', asmbn.subtraction, {onCycle: asmbn.clean})

// add listeners
subtraction.on('cycle', function(event) { console.log(String(event.target)) })
subtraction.on('complete', function() { console.log('Fastest is ' + this.filter('fastest').pluck('name')) })
// run async
subtraction.run({ 'async': false })

var multiplication = new Benchmark.Suite
//multiplication.add('arb-multiplication', arb.multiplication, {onCycle: arb.clean})
multiplication.add('biginteger-multiplication', biginteger.multiplication, {onCycle: biginteger.clean})
multiplication.add('BigInt-multiplication', BigInt.multiplication, {onCycle: BigInt.clean})
multiplication.add('bn-multiplication', bn.multiplication, {onCycle: bn.clean})
multiplication.add('mathjs-multiplication', mathjs.multiplication, {onCycle: mathjs.clean})
multiplication.add('asmbn-multiplication', asmbn.multiplication, {onCycle: asmbn.clean})

// add listeners
multiplication.on('cycle', function(event) { console.log(String(event.target)) })
multiplication.on('complete', function() { console.log('Fastest is ' + this.filter('fastest').pluck('name')) })
// run async
multiplication.run({ 'async': false })


var division = new Benchmark.Suite
//division.add('arb-division', arb.division, {onCycle: arb.clean})
division.add('biginteger-division', biginteger.division, {onCycle: biginteger.clean})
division.add('BigInt-division', BigInt.division, {onCycle: BigInt.clean})
division.add('bn-division', bn.division, {onCycle: bn.clean})
division.add('mathjs-division', mathjs.division, {onCycle: mathjs.clean})
division.add('asmbn-division', asmbn.division, {onCycle: asmbn.clean})

// add listeners
division.on('error', function(event) { console.log( event.target.error[0]) })
division.on('cycle', function(event) { console.log(String(event.target)) })
division.on('complete', function() { console.log('Fastest is ' + this.filter('fastest').pluck('name')) })
// run async
division.run({ 'async': false })

