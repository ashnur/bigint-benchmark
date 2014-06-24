module.exports = test

var gmp = require('./gmp/gmp_wrapper/gmp_wrapper.js')
gmp.ccall('init_mpz_vars')
var strings = require('./food.js')

function test(){
  var numbers = []
  var addition_results = []
  for ( var i = 0; i < strings.length; i++ ) {
    var n = gmp.ccall('new_mpz_var', 'number')
    gmp.ccall('w_mpz_set_str', '', ['number', 'string', 'number'], [n, strings[i], 10])
    numbers.push(n)
  }
  return {
    clean: function clear(){
      for ( var i = 0; i < addition_results.length; i++ ) {
        gmp.ccall('del_mpz_var', '', ['number'], [addition_results[i]])
      }
      addition_results = []
    }
  , addition: function addition(){
      for ( var i = 0; i < numbers.length; i++ ) {
        for ( var j = 0; j < numbers.length; j++ ) {
          var r = gmp.ccall('new_mpz_var', 'number')
          gmp.ccall('w_mpz_add', '', ['number', 'number', 'number'], [r, numbers[i], numbers[j]]);
          addition_results.push(r)
        }
      }
    }
  }
}
