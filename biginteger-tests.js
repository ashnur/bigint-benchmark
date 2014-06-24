module.exports = test

var biginteger = require('biginteger').BigInteger
var strings = require('./food.js')

function test(){
  var results = []
  var numbers = []
  for ( var i = 0; i < strings.length; i++ ) {
    numbers.push(biginteger(strings[i]))
  }
  return {
    clean: function clear(){
      results = []
    }
  , addition: function addition(){
      for ( var i = 0; i < numbers.length; i++ ) {
        for ( var j = 0; j < numbers.length; j++ ) {
          results.push(numbers[i].add(numbers[j]))
        }
      }
    }
  , subtraction: function addition(){
      for ( var i = 0; i < numbers.length; i++ ) {
        for ( var j = 0; j < numbers.length; j++ ) {
          results.push(numbers[i].subtract(numbers[j]))
        }
      }
    }
  , multiplication: function multiplication(){
      for ( var i = 0; i < numbers.length; i++ ) {
        for ( var j = 0; j < numbers.length; j++ ) {
          results.push(numbers[i].multiply(numbers[j]))
        }
      }
    }
  , division: function division(){
      for ( var i = 0; i < numbers.length; i++ ) {
        for ( var j = 0; j < numbers.length; j++ ) {
          results.push(numbers[i].divide(numbers[j]))
        }
      }
    }
  }
}
