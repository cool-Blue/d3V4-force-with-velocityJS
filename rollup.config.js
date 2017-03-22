/**
 * Created by cool.blue on 20/03/2017.
 */
export default {
  entry: 'src/index.js',
  dest: 'build/js/bundle.js',
  format: 'umd',
  external: [ 'd3', 'd3SelectionMulti', 'jquery' ],
  paths: {
    d3: 'https://d3js.org/d3.v4.min.js',
    d3SelectionMulti: 'https://d3js.org/d3-selection-multi.v1.min.js',
    jquery: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.0.0-alpha1/jquery.min.js'
  }
};