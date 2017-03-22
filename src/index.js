/**
 * index
 * Created by cool.blue on 20/03/2017.
 */
import d3 from 'd3'
import {ElapsedTime} from '../src/elapsed-time-3.0'
import jQuery from "jquery";
window.$ = window.jQuery = jQuery;
import '../src/fps-histogram'

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

let groupX = d3.scalePoint()
  .range([0, containerWidth])
  .domain([0, 1, 2, 3, 4]);

const data = [],
  rScale = 0.8,
  Rmin = 30,
  Rmax = 60,
  rmin = Rmin*rScale,
  rmax = Rmax*rScale,
  catRange = d3.range(0, 3),
  textRange = d3.range(0, 12);

catRange.forEach(function(j){
  textRange.forEach(function(i){
    var r = random(rmin, rmax);
    data.push({
      text: i,
      category: j,
      x: random(rmax, containerWidth - rmax),
      y: random(rmax, containerHeight - rmax),
      r: r,
      gX: groupX(random(1, 3)),
      fill: colors[j].fill,
      stroke: colors[j].stroke,
      get v() {
        var d = this;
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

// collision detection
// derived from http://bl.ocks.org/mbostock/1748247
function collide(alpha, s0) {
  var quadtree = d3.quadtree(data, d => d.x, d => d.y);
  return function(d) {
    var drt = d.rt;
    applyBoundaries(d, s0);
    var r = drt + rmax,
      nx1 = d.x - r,
      nx2 = d.x + r,
      ny1 = d.y - r,
      ny2 = d.y + r;
    quadtree.visit(function(quad, x1, y1, x2, y2) {
      var data = quad.data;
      if (data) {
        if(data.index > d.index) {
          var x = d.x - data.x - data.vx,
            y = d.y - data.y - data.vy,
            l = x * x + y * y,
            r = drt + data.rt;
          if (l < r * r) {
            l = ((l = Math.sqrt(l)) - r) / l * (1 + alpha);
            d.x -= x *= l;
            d.y -= y *= l;
            data.x += x;
            data.y += y;
          }
        }
        return;
      }
      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    });
  };
}
function radius(d) {
  return d.rt;
}
function applyBoundaries(s, s0){
  function boundaries(d) {
    var moreThan, v0,
      drt = d.rt;
    // boundaries

    //reflect off the edges of the container
    // check for boundary collisions and reverse velocity if necessary
    if((moreThan = d.x > (containerWidth - drt)) || d.x < drt) {
      d.escaped |= 2;
      // if the object is outside the boundaries
      //   manage the sign of its x velocity component to ensure it is moving back into the bounds
      if(~~d.v.x) d.sx = d.v.x * (moreThan && d.v.x > 0 || !moreThan && d.v.x < 0 ? -1 : 1);
      //   if vx is too small, then steer it back in
      else d.sx = (~~Math.abs(d.v.y) || Math.min(s0, 1)*2) * (moreThan ? -1 : 1);
      // clear the boundary without affecting the velocity
      v0 = d.v;
      d.x = moreThan ? containerWidth - drt : drt;
      d.v = v0;
      // add a bit of hysteresis to quench limit cycles
    } else if (d.x < (containerWidth - 2*drt) && d.x > 2*drt) d.escaped &= ~2;

    if((moreThan = d.y > (containerHeight - drt)) || d.y < drt) {
      d.escaped |= 4;
      if(~~d.v.y) d.sy = d.v.y * (moreThan && d.v.y > 0 || !moreThan && d.v.y < 0 ? -1 : 1);
      else d.sy = (~~Math.abs(d.v.x) || Math.min(s0, 1)*2) * (moreThan ? -1 : 1);
      v0 = d.v;
      d.y = moreThan ? containerHeight - drt : drt;
      d.v = v0;
    }  else  if (d.y < (containerHeight - 2*drt) && d.y > 2*drt) d.escaped &= ~4;
  }
  if(s instanceof d3.selection)
    s.each(boundaries);
  else
    boundaries(s);
}
// prepare layout

// create item groups
let node = svgContainer.selectAll('.node')
  .data(data)
  .enter()
  .append('g')
  .attr('class', 'node');
  // .call(force.drag);

// create circles
let circles = node.append('circle')
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
    var n= d3.select(this);
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

let lines = node.append('line')
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

let baseG = 0.2;
let baseQ = 100;
let Q = d => [-baseQ, baseQ, baseQ][d.category];
let force = d3.forceSimulation(data)
  .force("X", d3.forceX(d => d.gX)
    .strength(baseG * 10)) //(baseG * containerHeight / containerWidth / 10))
  .force("Y", d3.forceY(containerHeight/2)
    .strength(baseG))
  .force("charge", d3.forceManyBody(Q))
  .force("collide", d3.forceCollide(radius).strength(1).iterations(3))
  .velocityDecay(0.2);

elapsedTime.start(100);

// put circle into movement
force.on('tick', function t(){
  const s0 = 0.25, k = 0.3;

  let a = this.alpha();
  elapsedTime.mark(a);
  if(elapsedTime.aveLap.history.length)
    hist(elapsedTime.aveLap.history);

  for ( let i = 0; i < 2; i++) {
    circles
      .call(applyBoundaries, s0);
  }

  // regulate the speed of the circles
  data.forEach(function reg(d){
    if(!d.escaped) d.s =  ([s0*5, s0, s0][+d.category] - d.s * k) / (1 - k);
  });

  node.attr("transform", function position(d){return "translate(" + [d.x, d.y] + ")"});

  force.force("collide", d3.forceCollide(radius).strength(1).iterations(3));

  force.alpha(0.05);
});

// animate
window.setInterval(function(){
  const Tinfl = 3000, Tdefl = 3000, inflate = [200, 10], deflate = "easeOutCubic";
  const tinfl = cat => [500, Tinfl, Tinfl][+cat];
  const tdefl = cat => [500, Tdefl, Tdefl][+cat];

  for(let i = 0; i < data.length; i++) {
    if(Math.random()>0.8) data[i].r = random(rmin,rmax);
  }

  circles.filter(function(d){return !d.scheduled && d.r != d.rt})
    .each(function(d) {
      let delta = d.r - d.rt, defl = delta < 0;
      if(~~delta) $(this).velocity(
        {r: d.r},
        {
          duration: defl ? tdefl(d.category) : tinfl(d.category),
          easing: defl ? deflate : inflate,
          begin: transFlag("start", d),
          complete: transFlag("end", d)
        });
    });

  lines.filter(function(d){return !d.scheduled && d.r != d.rt})
    .each(function(d) {
      let delta = d.r - d.rt, defl = delta < 0;
      if(~~delta)
        $(this).velocity({
          x1: -d.r + rmax / 10,
          x2: d.r - rmax / 10
        }, defl ? tdefl(d.category) : tinfl(d.category), defl ? deflate : inflate)
    });
  function transFlag(event, d){
    return {
      start: function(){
        window.setTimeout(function() {
          d.scheduled = true;
        }, 0);
      },
      end: function(){
        window.setTimeout(function(){
          d.scheduled = false;
        }, tinfl(d.category));
      }
    }[event]

  }

}, 500);
