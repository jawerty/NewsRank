
var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname, './build');
var APP_DIR = path.resolve(__dirname, './client');

const config = {
  mode: 'production',
  target: 'web',
   entry: {
     main: APP_DIR + '/index.js'
   },
   output: {
     filename: 'bundle.js',
     path: BUILD_DIR,
   },
   module: {
    rules: [
     {
       test: /(\.css)$/,
       use: [{
           loader: "style-loader" // creates style nodes from JS strings
       }, {
           loader: "css-loader" // translates CSS into CommonJS
       }]
     },
     {
       test: /\.(ttf|eot|woff|woff2)$/,
       use: {
         loader: "file-loader",
         options: {
           name: "font/[name].[ext]",
         },
       },
     },
     {
       test: /\.(jsx|js)?$/,
       use: [{
         loader: "babel-loader",
         options: {
           cacheDirectory: true,
           presets: ['react', ["es2015", { "modules": false }]] // Transpiles JSX and ES6
         }
       }]
     }
    ],

  }
};

module.exports = config;
