const path = require('path');
module.exports = {
  mode: "development",
  optimization: {
    // We no not want to minimize our code.
    minimize: false
  },
  target: 'node',
  entry: './node_modules/node-summary/index.js',
  output: {
    path: path.join(__dirname),
    filename: 'node-summary.js',
    library: 'node-summary',
    libraryTarget: 'commonjs2'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        // exclude: /(node_modules)/,
      },
    ]
  }
}