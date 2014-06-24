module.exports = test

var arb = require('arb')
var numbers = []

var strings = require('./food.js')

function test(){
  for ( var i = 0; i < strings.length; i++ ) {
    numbers.push(arb.parse(strings[i]))
  }
  return numbers
}
