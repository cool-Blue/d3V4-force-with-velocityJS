/**
 * index
 * Created by cool.blue on 20/03/2017.
 */
import d3 from 'd3'
import {ElapsedTime} from '../src/elapsed-time-3.0'
import jQuery from "jquery";
window.$ = window.jQuery = jQuery;
import '../src/fps-histogram'
// import collide from '../src/collide'


// helpers
let random = function (min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  },
  metrics = d3.select('#bubble-cloud').append("div")
    .attr("id", "metrics")
    .style("white-space", "pre"),
  elapsedTime = ElapsedTime("#metrics", {
    border: 0, margin: 0, "box-sizing": "border-box",
    padding: "0 0 0 6px", background: "black", "color": "orange"
  })
    .message(function (value) {
      let this_lap = this.lap().lastLap, aveLap = this.aveLap(this_lap);
      return 'alpha:' + d3.format(" >7,.3f")(value)
        + '\tframe rate:' + d3.format(" >4,.1f")(1 / aveLap) + " fps"
    }),
  hist = d3.ui.FpsMeter("#metrics", {display: "inline-block"}, {
    height: 10, width: 100,
    values: function (d) {
      return 1 / d
    },
    domain: [0, 60]
  }),  // mock data
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
let container = d3.select('#bubble-cloud');
const containerWidth = 960;
let containerHeight = 470 - elapsedTime.selection.node().clientHeight;
let svgContainer = container
  .append('svg')
  .attr('width', containerWidth)
  .attr('height', containerHeight);

const data = [],
  rScale = 0.3,
  Rmin = 30,
  Rmax = 60,
  rmin = Rmin*rScale,
  rmax = Rmax*rScale,
  catRange = d3.range(0, 3),
  textRange = d3.range(0, 24),
  groups = 8,
  groupDomain = d3.range(groups + 1),
  groupX = groupDomain.map(
    d3.scalePoint()
    .range([0, containerWidth])
    .domain(groupDomain)
  ),
  groupY = groupDomain.map(g => containerHeight/2),
  groupXY = groupDomain.map((d, i) => {
    return {x: containerWidth/2, y: containerHeight/2}
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
  let node, circles, lines, force;

  // create item groups
  function init(data){

    data.forEach(function(d){
      d.x = d.gX;
      d.y = d.gY;
    });

    let G = d => [1, 10][+!!d.category] * baseG;
    force = d3.forceSimulation(data)
      .force("X", d3.forceX(d => groupXY[d.group].x)
        .strength(G)) //(baseG * 10))
      .force("Y", d3.forceY(d => groupXY[d.group].y)
        .strength(G))
      .force("charge", d3.forceManyBody(baseQ))
      // .force("collide", d3.forceCollide(radius).strength(1).iterations(3))
      .alphaTarget(0.05)
      .velocityDecay(0.4);

    elapsedTime.start(100);

    node = svgContainer.selectAll('.node')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'node');

    // create circles
    circles = node.append('circle')
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
      .each(function(d){
        // add dynamic r getter
        let n= d3.select(this);
        Object.defineProperty(d, "rt", {get: function(){
          return +(n.attr("r").replace("px", ""))
        }})
      });

    // create labels
    node.append('text')
      .text(function(d) {
        return 'text' + d.text
      })
      .classed('text', true)
      .styles({
        'fill': '#ffffff',
        'text-anchor': 'middle',
        'font-size': (10 * rScale) + 'px',
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

    node.append('text')
      .text(function(d) {
        return 'cat' + d.category
      })
      .classed('category', true)
      .styles({
        'fill': '#ffffff',
        'font-family': 'Tahoma, Arial, sans-serif',
        'text-anchor': 'middle',
        'font-size': '8px'
      })
      .attr('x', function (d) {
        return 0;
      })
      .attr('y', function (d) {
        return rmax/4;
      });

    lines = node.append('line')
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
      .each(function(d){
        // add dynamic x getter
        var n= d3.select(this);
        Object.defineProperty(d, "lxt", {get: function(){
          return {x1: +n.attr("x1").replace("px", ""), x2: +n.attr("x2").replace("px", "")}
        }})
      });

    function dragstarted() {
      outerForce.restart().alpha(0.1);
      d3.event.subject.fx = d3.event.subject.x;
      d3.event.subject.fy = d3.event.subject.y;
    }
    function dragged() {
      let d = d3.event.subject;
      d.fx = d3.event.x;
      d.fy = d3.event.y;
      if(d.category == 0) return;
      groupXY[d.group].x = d.x;
      groupXY[d.group].y = d.y;
      force.force('X').initialize(force.nodes());
      force.force('Y').initialize(force.nodes());
    }

    function dragended() {
      let d = d3.event.subject;
      d.fx = null;
      d.fy = null;
      groupXY[d.group].x = d.x;
      groupXY[d.group].y = d.y;
      force.force('X').initialize(force.nodes());
      force.force('Y').initialize(force.nodes());
    }

    node.call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

    t();

    return {node: node, circles: circles, lines: lines, force: force}
  }
// put circle into movement
  function t(){

    if(typeof force == "undefined") return;

    force.force('X').initialize(force.nodes());
    force.force('Y').initialize(force.nodes());

    animate();

    const s0 = 0.25, k = 0.3;

    let a = force.alpha();
    elapsedTime.mark(a);
    if(elapsedTime.aveLap.history.length)
      hist(elapsedTime.aveLap.history);

    // regulate the speed of the circles
    data.forEach(function reg(d){
      if(d.fx || d.fy) return;
      if(!d.escaped) d.s =  ([s0*5, s0, s0][+d.category] - d.s * k) / (1 - k);
    });

    force.force("collide", d3.forceCollide(radius).strength(1).iterations(1));

    node
      .attr("transform", function position(d){
        return "translate(" + [d.x, d.y] + ")"
      });

    force.alpha(0.05);
  }

// animate
  function animate(){
    const Tinfl = 2000, Tdefl = 2000;
    const tinfl = cat => [300, Tinfl][+!!cat];
    const tdefl = cat => [300, Tdefl][+!!cat];
    const inflate = cat => ["easeInOutSine", "easeInOutSine"][+!!cat];
    const deflate = cat => ["easeInOutSine", "easeInOutSine"][+!!cat];
    const maxFactor = [1.2, 1.3];

    for(let i = 0; i < data.length; i++) {
      if(!data.scheduled && Math.random()>0.8) {
        let d = data[i];
        d.r = [d.r0, d.r0*maxFactor[+!!d.category]][+(d.r == d.r0)];
      }
    }

    circles.filter(d => !d.scheduled && d.r != d.rt)
      .each(function(d) {
        let delta = d.r - d.rt, defl = delta < 0;
        if(~~delta) $(this).velocity(
          {r: d.r},
          {
            duration: defl ? tdefl(d.category) : tinfl(d.category),
            easing: defl ? deflate(d.category) : inflate(d.category),
            begin: transFlag("start", d, defl),
            progress: _collide,
            complete: transFlag("end", d, defl)
          });
      });

    lines.filter(function(d){return !d.scheduled && d.r != d.rt})
      .each(function(d) {
        let delta = d.r - d.rt, defl = delta < 0;
        if(~~delta)
          $(this).velocity({
            x1: -d.r + rmax / 10,
            x2: d.r - rmax / 10
          }, defl ? tdefl(d.category) : tinfl(d.category), defl ? deflate(d.category) : inflate(d.category))
      });
    function transFlag(event, d, defl){
      return {
        start: function(){
          window.setTimeout(function() {
            d.scheduled = true;
          }, 0);
        },
        end: function(){
          window.setTimeout(function(){
            d.scheduled = false;
            if(defl) d.r = d.r0;
          }, 0);
        }
      }[event];
    }

    function _collide() {
      force.force("collide", d3.forceCollide(radius).strength(1).iterations(1));
    }

  }
  return {t: t, init: init,
    handover(){
      if(typeof force == "undefined") return;
      force.on('tick', t)
    }
  }
})();

let baseG = 0.1;
let baseQ = -300;

let groupR = 60;
let alphaTarget = 0.05;
let forceEvents = d3.dispatch('cooled');
let outerForce = d3.forceSimulation(groupXY)
  // .force("center", d3.forceCenter(containerWidth/2, containerHeight/2))
  .force('X', d3.forceX(containerWidth/2).strength(baseG*containerHeight/containerWidth))
  .force('Y', d3.forceY(containerHeight/2).strength(baseG*containerWidth/containerHeight))
  // .force('Y', d3.forceY())
  .force("charge", d3.forceManyBody(100))
  .force("Gcollide", d3.forceCollide(groupR*1.5))
  // .alphaTarget(alphaTarget)
  .on('tick.main', function() {
    groupNodes.attr("transform", function position(d){return "translate(" + [d.x, d.y] + ")"});
    if(this.alpha() > 0.7) return;
    layout.t();
    console.log(this.alpha());
  })
  .on('tick.emerge', function(){
    if(this.alpha() > 0.7) return;
    forceEvents.call('cooled', this);
    this.on('tick.emerge', null);
  })
  .on('end', layout.handover);

forceEvents.on('cooled', function(){
  layout.init(data);
});

// outer group
let groupNodes = svgContainer.selectAll('.group-node')
  .data(groupXY)
  .enter()
  .append('circle')
  .attr('r', groupR)
  .attr('class', 'group-node');
