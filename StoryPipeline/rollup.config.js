// Rollup plugins
import babel from 'rollup-plugin-babel';
import babelrc from 'babelrc-rollup';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';

export default {
  entry: 'node_modules/node-summary/lib/summary.js',
  format: 'umd',
  plugins: [
  	babel(Object.assign({
  		exclude: [
	       'node_modules/**',
	       '*.json'
    	]
 	}, babelrc())),
  	json(),
  	resolve({
  		extensions: [ '.mjs', '.js', '.jsx' ],
  		preferBuiltins: true,
  		exclude: ['*.json']
  	}),
  	commonjs()],
  dest: 'node_modules/node-summary/lib/summary.compiled.js'
};