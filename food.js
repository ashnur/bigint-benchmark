var fs = require('fs')
// var byline = require('byline')
// var stream = fs.createReadStream('food.txt',{encoding: 'utf8'})
// stream = byline.createStream(stream)


function empty(str){ return str.length != 0 }

module.exports = fs.readFileSync('food.txt', {encoding: 'utf8'}).split('\n').filter(empty)
