module.exports = test

var math = require('mathjs')()
var strings = require('./food.js')

function test(){
  var numbers = []
  var results = []
  for ( var i = 0; i < strings.length; i++ ) {
    numbers.push(math.bignumber(strings[i]))
  }
  return {
    clean: function clear(){
      results = []
    }
  , addition: function addition(){
      for ( var i = 0; i < numbers.length; i++ ) {
        for ( var j = 0; j < numbers.length; j++ ) {
          results.push(math.add(numbers[i], numbers[j]))
        }
      }
    }
  , subtraction: function addition(){
      for ( var i = 0; i < numbers.length; i++ ) {
        for ( var j = 0; j < numbers.length; j++ ) {
          results.push(math.subtract(numbers[i], numbers[j]))
        }
      }
    }
  , multiplication: function multiplication(){
      for ( var i = 0; i < numbers.length; i++ ) {
        for ( var j = 0; j < numbers.length; j++ ) {
          results.push(math.multiply(numbers[i], numbers[j]))
        }
      }
    }
  , division: function division(){
      for ( var i = 0; i < numbers.length; i++ ) {
        for ( var j = 0; j < numbers.length; j++ ) {
          results.push(math.divide(numbers[i], numbers[j]))
        }
      }
    }
  }
}
