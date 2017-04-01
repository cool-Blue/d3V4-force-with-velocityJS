/**
 Modified by cool.blue on 25/03/2017.

 Copyright 2010-2016 Mike Bostock
 All rights reserved.

 Redistribution and use in source and binary forms, with or without modification,
 are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice, this
 list of conditions and the following disclaimer.

 * Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation
 and/or other materials provided with the distribution.

 * Neither the name of the author nor the names of contributors may be used to
 endorse or promote products derived from this software without specific prior
 written permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
import d3 from 'd3'

var constant = function(x) {
  return function() {
    return x;
  };
};
var jiggle = function() {
  return (Math.random() - 0.5) * 1e-6;
};
var quadtree = d3.quadtree;

function x(d) {
  return d.x + d.vx;
}

function y(d) {
  return d.y + d.vy;
}

export default function(radius) {
  var nodes,
    radii,
    strength = 1,
    iterations = 1;

  if (typeof radius !== "function") radius = constant(radius == null ? 1 : +radius);

  function force(alpha) {
    var i, n = nodes.length,
      tree,
      node,
      xi,
      yi,
      ri,
      ri2;

    for (var k = 0; k < iterations; ++k) {
      tree = quadtree(nodes, x, y).visitAfter(prepare);
      for (i = 0; i < n; ++i) {
        node = nodes[i];
        ri = radii[node.index], ri2 = ri * ri;
        xi = node.x + node.vx;
        yi = node.y + node.vy;
        tree.visit(apply);
      }
    }

    function apply(quad, x0, y0, x1, y1) {
      var data = quad.data, rj = quad.r, r = ri + rj;
      if (data) {
        if (data.index > node.index) {
          var x = xi - data.x - data.vx,
            y = yi - data.y - data.vy,
            l = x * x + y * y;
          if (l < r * r) {
            if (x === 0) x = jiggle(), l += x * x;
            if (y === 0) y = jiggle(), l += y * y;
            l = (r - (l = Math.sqrt(l))) / l * strength;
            node.vx += (x *= l) * (r = (rj *= rj) / (ri2 + rj));
            node.vy += (y *= l) * r;
            data.vx -= x * (r = 1 - r);
            data.vy -= y * r;

            node.x += x;
            node.y += y;
            data.x -= x;
            data.y -= y;
          }
        }
        return;
      }
      return x0 > xi + r || x1 < xi - r || y0 > yi + r || y1 < yi - r;
    }
  }

  function prepare(quad) {
    if (quad.data) return quad.r = radii[quad.data.index];
    for (var i = quad.r = 0; i < 4; ++i) {
      if (quad[i] && quad[i].r > quad.r) {
        quad.r = quad[i].r;
      }
    }
  }

  function initialize() {
    if (!nodes) return;
    var i, n = nodes.length, node;
    radii = new Array(n);
    for (i = 0; i < n; ++i) node = nodes[i], radii[node.index] = +radius(node, i, nodes);
  }

  force.initialize = function(_) {
    nodes = _;
    initialize();
  };

  force.iterations = function(_) {
    if(arguments.length) {
      iterations = +_;
      return force
    }
    return iterations;
  };

  force.strength = function(_) {
    if(arguments.length) {
      strength = +_;
      return force
    }
    return strength;
  };

  force.radius = function(_) {
    return arguments.length
      ? (radius = typeof _ === "function" ? _ : constant(+_), initialize(), force)
      : radius;
  };

  return force;
}
// collision detection
// derived from http://bl.ocks.org/mbostock/1748247
function _collide(alpha, s0) {
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
