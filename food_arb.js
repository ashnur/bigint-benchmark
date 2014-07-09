var arb = require('../arb/integer.js')
var inteq = require('../arb/integer_equality.js')
var ri = require('../arb/test/helpers/rand_int.js')
var large = ri(null, null, 0)
var small = ri('small', null, 0)
var tiny = ri('tiny', null, 0)
var one = require('../arb/one.js')
var zero = require('../arb/zero.js')
var negone = arb.subtract(zero, one)
var fs = require('fs')
var print = require('../arb/print.js')

var food_txt = fs.createWriteStream('./food.txt')

var numbers = [one, negone]

function equal(n){
  return function(x){
    return inteq(x, n)
  }
}

// generate 50 random numbers
while ( numbers.length < 10 ) {
  var n = numbers.length < 3 ? tiny()
        : numbers.length < 6 ? small() : large()

  if ( numbers.some(equal(n)) || arb.equal(n, zero) ) { continue }
  numbers.push(n)
  food_txt.write(arb.to_dec(n)+'\n')
}


// var pairs = Array.apply(null, Array(25)).map(function(_,i){ return [i, 49 - i]})

module.export = numbers
