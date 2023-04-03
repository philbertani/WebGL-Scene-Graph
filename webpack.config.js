const path = require('path');

console.log(path.resolve(__dirname))

module.exports = {
  entry: './index.mjs',
  output: {
    path: path.resolve(__dirname),
    filename: 'bundle.js'
  }
}
