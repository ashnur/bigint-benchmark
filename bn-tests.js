module.exports = test

var bn = require('bn.js')
var numbers = []
var strings = require('./food.js')

function test(){
  for ( var i = 0; i < strings.length; i++ ) {
    numbers.push(new bn(strings[i], 10))
  }
  return numbers
}
