module.exports = test
var fs = require('fs')
var asmcrypto = require('../asmcrypto.js/asmcrypto.js')

var asmbn = asmcrypto.BigNumber

function empty(str){ return str.length != 0 }
var strings = fs.readFileSync('hex_food.txt', {encoding: 'utf8'}).split('\n').filter(empty)

function test(){
  var results = []
  var numbers = []
  for ( var i = 0; i < strings.length; i++ ) {
    numbers.push(new asmcrypto.BigNumber(asmcrypto.hex_to_bytes(strings[i])))
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

