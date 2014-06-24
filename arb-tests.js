module.exports = test

var arb = require('arb')

var strings = require('./food.js')

function test(){
  var numbers = []
  var addition_results = []
  for ( var i = 0; i < strings.length; i++ ) {
    numbers.push(arb.parse(strings[i]))
  }
  return {
    clean: function clear(){
      for ( var i = 0; i < addition_results.length; i++ ) {
        arb.pool.free(addition_results[i])
      }
      addition_results = []
    }
  , addition: function addition(){
      for ( var i = 0; i < numbers.length; i++ ) {
        for ( var j = 0; j < numbers.length; j++ ) {
          addition_results.push(arb.add(numbers[i], numbers[j]))
        }
      }
    }
  }
}

var x = test()
x.addition()
