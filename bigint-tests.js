module.exports = test

var bigint = require('BigInt')
var strings = require('./food.js')

function test(){
  var numbers = []
  var addition_results = []
  for ( var i = 0; i < strings.length; i++ ) {
    numbers.push(BigInt.str2bigInt(strings[i], 10))
  }
  return {
    clean: function clear(){
      addition_results = []
    }
  , addition: function addition(){
      for ( var i = 0; i < numbers.length; i++ ) {
        for ( var j = 0; j < numbers.length; j++ ) {
          addition_results.push(BigInt.add(numbers[i], numbers[j]))
        }
      }
    }
  }
}
