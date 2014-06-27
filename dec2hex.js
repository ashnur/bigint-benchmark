var fs = require('fs')
var hex_food_txt = fs.createWriteStream('./hex_food.txt')
var food_txt = fs.createReadStream('./food.txt', {encoding: 'utf8'})
var byline  = require('byline')
var stream = byline(food_txt)

stream.on('data', function(line) {
  var hex = dec2hex(line)
  hex_food_txt.write(hex+'\n')
})


function dec2hex(str){ // .toString(16) only works up to 2^53
    var dec = str.toString().split(''), sum = [], hex = [], i, s
    while(dec.length){
        s = 1 * dec.shift()
        for(i = 0; s || i < sum.length; i++){
            s += (sum[i] || 0) * 10
            sum[i] = s % 16
            s = (s - sum[i]) / 16
        }
    }
    while(sum.length){
        hex.push(sum.pop().toString(16))
    }
    return hex.join('')
}
