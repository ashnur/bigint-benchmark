module.exports = test

var bigint = require('BigInt')
var strings = require('./food.js')

function test(){
  var results = []
  var numbers = []
  for ( var i = 0; i < strings.length; i++ ) {
    numbers.push(BigInt.str2bigInt(strings[i], 10))
  }
  return {
    clean: function clear(){
      results = []
    }
  , addition: function addition(){
      for ( var i = 0; i < numbers.length; i++ ) {
        for ( var j = 0; j < numbers.length; j++ ) {
          results.push(BigInt.add(numbers[i], numbers[j]))
        }
      }
    }
  , subtraction: function addition(){
      for ( var i = 0; i < numbers.length; i++ ) {
        for ( var j = 0; j < numbers.length; j++ ) {
          results.push(BigInt.sub(numbers[i], numbers[j]))
        }
      }
    }
  , multiplication: function multiplication(){
      for ( var i = 0; i < numbers.length; i++ ) {
        for ( var j = 0; j < numbers.length; j++ ) {
          results.push(BigInt.mult(numbers[i], numbers[j]))
        }
      }
    }
  , division: function division(){
      for ( var i = 0; i < numbers.length; i++ ) {
        for ( var j = 0; j < numbers.length; j++ ) {
          var q = [], r = []
          q.length = Math.ceil(numbers[i].length/numbers[j].length)
          r.length = numbers[i].length
          BigInt.divide_(numbers[i], numbers[j], q, r)
          results.push([q,r])
        }
      }
    }
  }
}
