module.exports = test

var bigint = require('BigInt')
var numbers = []
var strings = require('./food.js')

function test(){
  for ( var i = 0; i < strings.length; i++ ) {
    numbers.push(BigInt.str2bigInt(strings[i], 10))
  }
  return numbers
}
