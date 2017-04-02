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

import * as d3 from 'd3'

export function transplot(yRange){
	return {"transform": "matrix(" + [1, 0, 0, -1, 0, yRange] + ")"};
}
/**
 * Reverses the local mirroring of transplot
 * @returns {{transform: string}}
 */
export function transflip(){
	return {"transform": "matrix(" + [1, 0, 0, -1, 0, 0] + ")"};
}
/**
 *
 * @param tickSize
 * @returns {tickSize}
 */
export function tickSize(tickSize){
	var axis = this,
			tickSize0 = Math.max(axis.innerTickSize(), 0),
			tickSize1 = Math.max(tickSize, 0),
			padding = Math.max(axis.tickPadding(), 0) + tickSize0 - tickSize1;
	axis.innerTickSize(tickSize).tickPadding(padding);
	return this;
}
/**
 * Axis constructor that returns custom behaviour on d3.svg.axis
 *
 */
export function d3TransfAxis(){
	var axis = d3.svg.axis();
	function transAxis(g){
		g.call(axis).selectAll(".tick text, .tick line").attr(transflip())
		if(d3.select(g.node()).classed("x")) g.selectAll(".domain").attr(transflip());
	}
	axis.tickSize = tickSize.bind(axis);
	d3.rebind.bind(null, transAxis, axis).apply(null, Object.keys(axis))
	return transAxis;
}
export function d3Axis(){
	var axis = d3.svg.axis();
	axis.tickSize = tickSize.bind(axis);
	return axis;
}