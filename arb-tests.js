module.exports = test

var arb = require('arb')
var strings = require('./food.js')

function test(){
  var results = []
  var numbers = []
  var dividing = false
  for ( var i = 0; i < strings.length; i++ ) {
    numbers.push(arb.parse(strings[i]))
  }
  return {
    clean: function clear(){
      for ( var i = 0; i < results.length; i++ ) {
        if ( ! dividing ) {
          arb.pool.free(results[i])
        } else {
          arb.pool.free(results[i][0])
          arb.pool.free(results[i][1])
        }
      }
      results = []
      dividing = false
    }
  , addition: function addition(){
      for ( var i = 0; i < numbers.length; i++ ) {
        for ( var j = 0; j < numbers.length; j++ ) {
          results.push(arb.add(numbers[i], numbers[j]))
        }
      }
    }
  , subtraction: function addition(){
      for ( var i = 0; i < numbers.length; i++ ) {
        for ( var j = 0; j < numbers.length; j++ ) {
          results.push(arb.subtract(numbers[i], numbers[j]))
        }
      }
    }
  , multiplication: function multiplication(){
      for ( var i = 0; i < numbers.length; i++ ) {
        for ( var j = 0; j < numbers.length; j++ ) {
          results.push(arb.multiply(numbers[i], numbers[j]))
        }
      }
    }
  , division: function division(){
      var dividing = true
      for ( var i = 0; i < numbers.length; i++ ) {
        for ( var j = 0; j < numbers.length; j++ ) {
          results.push(arb.divide(numbers[i], numbers[j]))
        }
      }
    }
  }
}
