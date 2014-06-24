module.exports = test

var biginteger = require('biginteger').BigInteger
var strings = require('./food.js')

function test(){
  var numbers = []
  var addition_results = []
  for ( var i = 0; i < strings.length; i++ ) {
    numbers.push(biginteger(strings[i]))
  }
  return {
    clean: function clear(){
      addition_results = []
    }
  , addition: function addition(){
      for ( var i = 0; i < numbers.length; i++ ) {
        for ( var j = 0; j < numbers.length; j++ ) {
          addition_results.push(numbers[i].add(numbers[j]))
        }
      }
    }
  }
}
