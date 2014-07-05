module.exports = test

var arb = require('../arb')
var strings = require('./food.js')

function nodups(arr, next){
  if ( arr.indexOf(next) == -1 ) arr.push(next)
  return arr
}

function test(){
  var results = []
  var numbers = []
  for ( var i = 0; i < strings.length; i++ ) {
    var x = arb.parse(strings[i])
    numbers.push(x)
  }
  function inputs(n){
    return numbers.indexOf(n) == -1
  }
  return {
    clean: function clear(){
      results = results.reduce(nodups, []).filter(inputs)
      for ( var i = 0; i < results.length; i++ ) {
        arb.memory.free(results[i])
      }
      results = []
    }
  , cleanDiv: function clear(){
      results = results.reduce(nodups, []).filter(inputs)
      for ( var i = 0; i < results.length; i++ ) {
        arb.memory.free(results[i][0])
        arb.memory.free(results[i][1])
      }
      results = []
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
      for ( var i = 0; i < numbers.length; i++ ) {
        for ( var j = 0; j < numbers.length; j++ ) {
          results.push(arb.divide(numbers[i], numbers[j]))
        }
      }
    }
  }
}
