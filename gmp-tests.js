module.exports = test

var gmp = require('./gmp/gmp_wrapper/gmp_wrapper.js')
gmp.ccall('init_mpz_vars')
var numbers = []
var strings = require('./food.js')

function test(){
  for ( var i = 0; i < strings.length; i++ ) {
    var n = gmp.ccall('new_mpz_var', 'number')
    gmp.ccall('w_mpz_set_str', '', ['number', 'string', 'number'], [n, strings[i], 10])
    numbers.push(n)
  }
  return numbers
}
