/**
 * plot-transform
 * Created by cool.blue@y7mail.com on 22/08/2015.
 * Returns an afine transform that maps from top left to bottom left origin
 *  the transform is wrapped in an object that will be accepted by .attr() in d3
 * @param height
 * 	- height of the plot area in pixels
 * @returns
 *  - attr object
 */

import {select} from 'd3-selection'

export function transplot(yRange){
	return {"transform": "matrix(" + [1, 0, 0, -1, 0, yRange] + ")"};
}
/**
 * todo get all this working in d3 v4
 * Reverses the local mirroring of transplot
 * @returns {{transform: string}}
 */
export function transflip(){
	return {"transform": "matrix(" + [1, 0, 0, -1, 0, 0] + ")"};
}
/**
 * @param tickSize
 * @returns {tickSize}
 */
export function tickSize(tickSize){
	var axis = this,
			tickSize0 = Math.max(axis.tickSizeInner(), 0),
			tickSize1 = Math.max(tickSize, 0),
			padding = Math.max(axis.tickPadding(), 0) + tickSize0 - tickSize1;
	axis.tickSizeInner(tickSize).tickPadding(padding);
	return this;
}
/**
 * Axis constructor that returns custom behaviour on d3.svg.axis
 *
 */
export function d3TransfAxis(axis){
	function transAxis(g){
		g.call(axis).selectAll(".tick text, .tick line").attr(transflip());
		if(select(g.node()).classed("x")) g.selectAll(".domain").attr(transflip());
	}
	axis.tickSize = tickSize.bind(axis);
	// d3.rebind.bind(null, transAxis, axis).apply(null, Object.keys(axis));
  Object.keys(axis).reduce(function(o, p) {
    o[p] = function() {
      var value = axis[p].apply(axis, arguments);
      return value === axis ? o : value;
    }
  }, transAxis);
	return transAxis;
}
export function d3Axis(axis){
	axis.tickSize = tickSize.bind(axis);
	return axis;
}