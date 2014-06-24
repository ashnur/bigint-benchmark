var arb = require('arb/integer.js')
var inteq = require('arb/integer_equality.js')
var ri = require('arb/test/helpers/rand_int.js')
var one = require('arb/one.js')
var zero = require('arb/zero.js')
var negone = arb.subtract(zero, one)
var fs = require('fs')

var food_txt = fs.createWriteStream('./food.txt')


var numbers = [zero, one, negone]

food_txt.write(arb.to_dec(zero)+'\n')
food_txt.write(arb.to_dec(one)+'\n')
food_txt.write(arb.to_dec(negone)+'\n')

function equal(n){
  return function(x){
    return inteq(x, n)
  }
}

// generate 50 random numbers
// while ( numbers.length < 50 ) {
//   var n = ri()()
//   if ( numbers.some(equal(n)) ) continue
//   numbers.push(n)
// }

// var pairs = Array.apply(null, Array(25)).map(function(_,i){ return [i, 49 - i]})

module.export = numbers
