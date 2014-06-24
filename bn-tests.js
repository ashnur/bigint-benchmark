module.exports = test

var bn = require('bn.js')
var strings = require('./food.js')

function test(){
  var numbers = []
  var results = []
  for ( var i = 0; i < strings.length; i++ ) {
    numbers.push(new bn(strings[i], 10))
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
          results.push(numbers[i].sub(numbers[j]))
        }
      }
    }
  , multiplication: function multiplication(){
      for ( var i = 0; i < numbers.length; i++ ) {
        for ( var j = 0; j < numbers.length; j++ ) {
          results.push(numbers[i].mul(numbers[j]))
        }
      }
    }
  , division: function division(){
      for ( var i = 0; i < numbers.length; i++ ) {
        for ( var j = 0; j < numbers.length; j++ ) {
          results.push(numbers[i].div(numbers[j]))
        }
      }
    }
  }
}
