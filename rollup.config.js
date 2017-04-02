/**
 * Created by cool.blue on 20/03/2017.
 */
import resolve from 'rollup-plugin-node-resolve';

export default {
  entry: 'test.js',
  dest: 'bundle.js',
  format: 'umd',
  globals: {
    d3: 'd3'
  },
  plugins: [
    resolve({ jsnext: true })
  ]
};