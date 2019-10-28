const path = require('path');


module.exports = {
  entry:  './src/app.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'app.js'
  },
  watch:  true,
  module: {
    loaders: [
      { test: /\.js?$/, loader: "awesome-typescript-loader" },
    ]
  }
};