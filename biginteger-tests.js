module.exports = test

var biginteger = require('biginteger').BigInteger
var numbers = []
var strings = require('./food.js')

function test(){
  for ( var i = 0; i < strings.length; i++ ) {
    numbers.push(biginteger(strings[i]))
  }
  return numbers
}
