/**
 * index
 * Created by cool.blue on 20/03/2017.
 */
import FpsMeter from '../src/d3-fps-histogram'
import {select, event} from 'd3-selection'
import 'd3-selection-multi'
import {drag} from 'd3-drag'
import {dispatch} from 'd3-dispatch'
import {format} from 'd3-format'
import {forceSimulation, forceX, forceY, forceCollide, forceCenter} from 'd3-force'
import {range} from 'd3-array'
import animate from './animate';
// import collide from '../src/collide'

// helpers
let random = function (min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  },
  metrics = select('#bubble-cloud').append("div")
    .attr("id", "metrics")
    .style("white-space", "pre"),
  hist = FpsMeter("#metrics", {display: "inline-block"}, {
    height: 10, width: 100,
    values: function (d) {
      return 1 / d
    },
    domain: [0, 60]
  })
    .message(function (value, this_lap, aveLap) {
      return 'alpha:' + format(" >7,.3f")(value)
    }),
  // mock data
  colors = [
    {
      fill: 'rgba(242,216,28,0.3)',
      stroke: 'rgba(242,216,28,1)'
    },
    {
      fill: 'rgba(207,203,196,0.3)',
      stroke: 'rgba(207,203,196,1)'
    },
    {
      fill: 'rgba(0,0,0,0.2)',
      stroke: 'rgba(100,100,100,1)'
    }
  ];

// initialize
let container = select('#bubble-cloud');
const containerWidth = 960;
let containerHeight = 470 - hist.selection.node().clientHeight;
let svgContainer = container
  .append('svg')
  .attr('width', containerWidth)
  .attr('height', containerHeight)
  .attr('class', 'svg-container');
let jiggle = function() {
  return (Math.random() - 0.5) * 1e-6;
};

const data = [],
  rScale = 0.3,
  Rmin = 30,
  Rmax = 60,
  rmin = Rmin*rScale,
  rmax = Rmax*rScale,
  catRange = range(0, 3),
  textRange = range(0, 24),
  groups = 9,
  // catRange = range(2),
  // textRange = range(1),
  // groups = 0,
  groupDomain = range(groups + 1),
  groupXY = groupDomain.map((d, i) => {
    return {x: containerWidth/2 + jiggle(), y: containerHeight/2 + jiggle()}
  });

catRange.forEach(function(j){
  textRange.forEach(function(i){
    let r = random(rmin, rmax);
    let group = random(0, groups);

    data.push({
      text: i,
      category: j,
      group: group,
      x: groupXY[group].x, //containerWidth/2 /*random(rmax, containerWidth - rmax)*/,
      y: groupXY[group].y /*random(rmax, containerHeight - rmax)*/,
      r: r,
      r0: r,
      get gX() { return groupXY[this.group].x},
      get gY() { return groupXY[this.group].y},
      fill: colors[j].fill,
      stroke: colors[j].stroke,
      get v() {
        let d = this;
        return {x: d.vx || 0, y: d.vy || 0}
      },
      set v(v) {
        var d = this;
        d.vx = v.x;
        d.vy = v.y;
      },
      get s() {
        var d = this;
        return Math.sqrt(d.vx * d.vx + d.vy * d.vy)
      },
      set s(s1){
        var s0 = this.s, v0 = this.v;
        if(!v0 || s0 == 0) {
          var theta = Math.random() * Math.PI * 2;
          this.v = {x: Math.cos(theta) * s1, y: Math.sin(theta) * s1}
        } else this.v = {x: v0.x * s1/s0, y: v0.y * s1/s0};
      },
      set sx(s) {
        this.v = {x: s, y: this.v.y}
      },
      set sy(s) {
        this.v = {y: s, x: this.v.x}
      },
    });
  })
});

function radius(d) {
  return d.rt*1.1;
}

let layout = (function(){
  let nodes, circles, lines, force;

  // create item groups
  function init(data){

    data.forEach(function(d){
      d.x = d.gX + jiggle();
      d.y = d.gY + jiggle();
    });

    let G = d => [1, 10][+!!d.category] * baseG;
    force = forceSimulation(data)
      .force("X", forceX(d => groupXY[d.group].x)
        .strength(G)) //(baseG * 10))
      .force("Y", forceY(d => groupXY[d.group].y)
        .strength(G))
      .force("collide", forceCollide(radius).strength(1).iterations(1))
      // .force("collide", collide(radius).strength(1).iterations(3))
      .alphaTarget(0.05)
      // .velocityDecay(0.4)
      .alpha(0.05);

    force.stop();

    hist.start(100);

    nodes = svgContainer.selectAll('.nodes')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'nodes');

    // create circles
    circles = nodes.append('circle')
      .classed('circle', true)
      .attr('r', function (d) {
        return d.r;
      })
      .style('fill', function (d) {
        return d.fill;
      })
      .style('stroke', function (d) {
        return d.stroke;
      })
      .attr('transform', "scale(1)")
      .each(function(d){
        // add dynamic r getter
        let n= select(this);
        Object.defineProperty(d, "rt", {get: function(){
          return +(n.attr("r").replace("px", ""))
        }})
      });

    // create labels
    nodes.append('text')
      .text(function(d) {
        return 'text' + d.text
      })
      .classed('text', true)
      .styles({
        'fill': '#ffffff',
        'text-anchor': 'middle',
        'font-size': (12 * rScale) + 'px',
        'font-weight': 'bold',
        'text-transform': 'uppercase',
        'font-family': 'Tahoma, Arial, sans-serif'
      })
      .attr('x', function (d) {
        return 0;
      })
      .attr('y', function (d) {
        return - rmax/5;
      });

    nodes.append('text')
      .text(function(d) {
        return 'Cat ' + d.category
      })
      .classed('category', true)
      .styles({
        'fill': '#ffffff',
        'font-family': 'Tahoma, Arial, sans-serif',
        'text-anchor': 'middle',
        'font-size': (12 * rScale) + 'px'
      })
      .attr('x', function (d) {
        return 0;
      })
      .attr('y', function (d) {
        return rmax/3;
      });

    lines = nodes.append('line')
      .classed('line', true)
      .attrs({
        x1: function (d) {
          return - d.r + rmax/10;
        },
        y1: function (d) {
          return 0;
        },
        x2: function (d) {
          return d.r - rmax/10;
        },
        y2: function (d) {
          return 0;
        }
      })
      .attr('stroke-width', 1)
      .attr('stroke',  function (d) {
        return d.stroke;
      })
      .attr('transform', "scale(1)")
      .each(function(d){
        // add dynamic x getter
        var n= select(this);
        Object.defineProperty(d, "lxt", {get: function(){
          return {x1: +n.attr("x1").replace("px", ""), x2: +n.attr("x2").replace("px", "")}
        }})
      });

    function dragstarted() {
      outerForce.restart().alpha(0.1);
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    function dragged() {
      let d = event.subject;
      d.fx = event.x;
      d.fy = event.y;
      if(d.category == 0) return;
      groupXY[d.group].x = d.x;
      groupXY[d.group].y = d.y;
      force.force('X').initialize(force.nodes());
      force.force('Y').initialize(force.nodes());
    }

    function dragended() {
      let d = event.subject;
      d.fx = null;
      d.fy = null;
      groupXY[d.group].x = d.x;
      groupXY[d.group].y = d.y;
      force.force('X').initialize(force.nodes());
      force.force('Y').initialize(force.nodes());
    }

    svgContainer.call(drag()
      .subject(() => force.find(event.x, event.y))
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

    tick.force = force;
    tick.nodes = nodes;

    // force.force("collide").initialize(force.nodes());
    t();

    return {nodes: nodes, circles: circles, lines: lines, force: force}
  }
// put circle into movement
  function t(){

    if(typeof force == "undefined") return;

    const s0 = 0.25, k = 0.3;
    // regulate the speed of the circles
    data.forEach(function reg(d){
      if(d.fx || d.fy) return;
      if(!d.escaped) d.s =  ([s0*5, s0, s0][+d.category] - d.s * k) / (1 - k);
    });

    force.force('X').initialize(force.nodes());
    force.force('Y').initialize(force.nodes());
    force.force("collide").initialize(force.nodes());

    let a = force.alpha();
    hist.mark(a);

    nodes
      .attr("transform", function position(d){
        return "translate(" + [d.x, d.y] + ")"
      });
    return this;
  }
  // remote tick function
  function tick(){
    if(typeof force == "undefined") return;
    force.tick();
    t()
  }
  return {
    init: init,
    animate: animate({tick: tick, rmax: rmax, renderer: "d3"}),
  }
})();

let baseG = 0.1;
let baseQ = -300;

let groupR = 60;
let alphaCool = 0.7;
let forceEvents = dispatch('cooled');
let outerForce = forceSimulation(groupXY)
  .force("center", forceCenter(containerWidth/2, containerHeight/2))
  .force('X', forceX(containerWidth/2).strength(baseG*containerHeight/containerWidth))
  .force('Y', forceY(containerHeight/2).strength(baseG*containerWidth/containerHeight))
  .force("Gcollide", forceCollide(groupR*1.5))
  // .alphaTarget(alphaTarget)
  .on('tick.main', function() {
    groupNodes.attr("transform", function position(d){return "translate(" + [d.x, d.y] + ")"});
    if(this.alpha() > alphaCool) return;
    layout.animate(); // start the animations
  })
  .on('tick.emerge', function(){
    if(this.alpha() > alphaCool) return;
    layout.init(data);
    this.on('tick.emerge', null);
  });

// outer group
let groupNodes = svgContainer.selectAll('.group-node')
  .data(groupXY)
  .enter()
  .append('circle')
  .attr('r', groupR)
  .attr('class', 'group-node');
