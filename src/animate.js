/**
 * Created by cool.blue on 3/04/2017.
 */
import {select} from "d3-selection";
import 'd3-selection-multi'
import {transition} from 'd3-transition'
import * as ease from "d3-ease";
import {timer} from "d3-timer";
// animate
const dummyNode = document.createElement('custom');
const Tinfl = 4000, Tdefl = 4000;
const tinfl = cat => [300, Tinfl][+!!cat];
const tdefl = cat => [300, Tdefl][+!!cat];
const inflate = cat => ["easeInOutCubic", "easeInOutCubic"][+!!cat];
const deflate = cat => ["easeInOutCubic", "easeOutQuad"][+!!cat];
const maxFactor = [1.2, 1.3];
var tick;
var rmax;
var renderer = 'Velocity';

export default function(options) {
  tick = options.tick;
  rmax = options.rmax;
  renderer = options.renderer || renderer;

  // Drive the force simulation from here
  animationLoop[renderer]();

  return function () {
    let nodes = tick ? tick.nodes : undefined;

    if (typeof(nodes) === 'undefined') return;

    // feed the cat 0 nodes in a bit randomly
    nodes
      .filter(d => !d.scheduled && Math.random() > 0.8)
      .each(function (d) {
        let target = this;
        let circle = target.getElementsByTagName('circle')[0];
        let line = target.getElementsByTagName('line')[0];
        window.setTimeout(function () {
          d.scheduled = true;
        }, 0);

        breath[renderer].call(circle, line, d);
      });
    return this;
  };
}

const animationLoop = {
  Velocity: function vTick() {
    // it needs a node as the first argument so just use a dummy one
    Velocity(dummyNode, {
      progress: tick,
      loop: true,
      complete: vTick
    }, 0)
  },
  d3: function tt(){
    timer(tick)
  },
  d3Scale: function tt(){
    timer(tick)
  }
};

function updateLine(d) {
  let l = select(this).attrs({
    x1: -d.rt + rmax / 10,
    x2: d.rt - rmax / 10
  });
  // let x1 = l.attr('x1'), x2 = l.attr('x2');
  // console.log((d.rt*2*0.8 - Math.abs(x1-x2))/(rmax))
}
const breath = {
  Velocity: function (line, d) {
    let circle = this;
    (function breath(){
      Velocity(circle,
      {r: d.r0 * maxFactor[+!!d.category]},
      {
        duration: tinfl(d.category),
        easing: inflate(d.category),
        progress: function () {
          updateLine.call(line, d);
        }
      })
      .then(() => Velocity(circle,
        {r: d.r0},
        {
          duration: tdefl(d.category),
          easing: deflate(d.category),
          progress: function () {
            updateLine.call(line, d);
          },
          complete: breath
        }))
    })();
  },
  d3: function (lineElement, d) {
    let circle = select(this);
    let line = select(lineElement);
    let f = 1;

      (function breath() {
        let tInflate =  transition()
            .duration(tinfl(d.category)*f)
            .ease(d3Ease(inflate(d.category))),
          rInf =  d.r0 * maxFactor[+!!d.category];

        let tDeflate =  transition()
          .duration(tdefl(d.category)*f)
          .ease(d3Ease(deflate(d.category)));

        circle
          .transition(tInflate)
          .attr('r', rInf)
          .transition(tDeflate)
          .attr('r', d.r0)
          .on('end', breath);

        line
          .transition(tInflate)
          .attrs({
            x1: -rInf + rmax / 10,
            x2: rInf - rmax / 10
          })
          .transition(tDeflate)
          .attrs({
            x1: -d.r0 + rmax / 10,
            x2: d.r0 - rmax / 10
          })
      })()
  },
  d3Scale: function (lineElement, d) {
    let circle = select(this);
    let line = select(lineElement);
    let f = 1;

    (function breath() {
      let tInflate =  transition()
          .duration(tinfl(d.category)*f)
          .ease(d3Ease(inflate(d.category))),
        scaleInf =  maxFactor[+!!d.category];

      let tDeflate =  transition()
        .duration(tdefl(d.category)*f)
        .ease(d3Ease(deflate(d.category)));

      circle
        .transition(tInflate)
        .attr('transform', "scale(" + scaleInf + ")")
        .transition(tDeflate)
        .attr('transform', "scale(1)")
        .on('end', breath);

      line
        .transition(tInflate)
        .attr('transform', "scale(" + scaleInf + ")")
        .transition(tDeflate)
        .attr('transform', "scale(1)")
    })()
  }
};
function d3Ease(easeName){
  return ease[easeName.replace(/ease(In(?!O)|Out|InOut)(.*)/, "ease$2$1")]
}