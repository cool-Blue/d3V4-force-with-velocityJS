/**
 * Created by cool.blue on 20/03/2017.
 */
import resolve from 'rollup-plugin-node-resolve';

export default {
  entry: 'src/index.js',
  dest: 'build/js/bundle.js',
  format: 'umd',
  plugins: [
    resolve({ jsnext: true })
  ]
};