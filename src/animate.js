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
var loop = {stop: ()=>{}};

export default function(options) {
  tick = options.tick || tick;
  rmax = options.rmax || rmax;
  renderer = options.renderer || renderer;

  loop.stop();
  // Drive the force simulation from here
  loop = animationLoop[renderer]();
  function _init() {
    let nodes = tick ? tick.nodes : undefined;

    if (typeof(nodes) === 'undefined') return;

    // feed in the cat 0 nodes a bit randomly
    nodes
      .filter(d => ((!d.scheduled || options.force) && Math.random() > 0.8))
      .each(function (d) {
        window.setTimeout(function () {
          d.scheduled = true;
        }, 0);
        d.stopBreathing && d.stopBreathing();
        breath[renderer].call(this, d);
      });
    return this;
  }
  _init.unSchedule = function(d){ return(delete d.scheduled, d) };
  return _init;
}

const animationLoop = {
  Velocity: function () {
      // it needs a node as the first argument so just use a dummy one with dummy properties
      Velocity(dummyNode, {p: 0},
        {
          progress: tick,
          loop: true
      }, 0);
      return {stop: function(){ Velocity(dummyNode, 'stop')}}
    },
  d3: function tt(){
    return timer(tick);
  },
  d3Scale: function tt(){
    return timer(tick);
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
  Velocity: function (d) {
    let target = this;
    let circle = target.getElementsByTagName('circle')[0];
    let line = target.getElementsByTagName('line')[0];
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
        .catch(e => console.log(e))
    })();
    d.stopBreathing = function(){ Velocity(target, 'stop', true)}
  },
  d3: function (d) {
    let target = this;
    let circle = select(target.getElementsByTagName('circle')[0]);
    let line = select(target.getElementsByTagName('line')[0]);
    let f = 1;
    (function breath() {
      let tInflate = transition('breath')
          .duration(tinfl(d.category) * f)
          .ease(d3Ease(inflate(d.category))),
        rInf = d.r0 * maxFactor[+!!d.category];

      let tDeflate = transition('breath')
        .duration(tdefl(d.category) * f)
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
    })();
    d.stopBreathing = function () {
      circle.interrupt('breath');
      line.interrupt('breath');
    }
  },
  d3Scale: function (d) {
    let target = this;
    let circle = select(target.getElementsByTagName('circle')[0]);
    let line = select(target.getElementsByTagName('line')[0]);
    let f = 1;

    (function breath() {
      let tInflate =  transition('breath')
          .duration(tinfl(d.category)*f)
          .ease(d3Ease(inflate(d.category))),
        scaleInf =  maxFactor[+!!d.category];

      let tDeflate =  transition('breath')
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
    })();
    d.stopBreathing = function () {
      circle.interrupt('breath');
      line.interrupt('breath');
    }
  }
};
function d3Ease(easeName){
  return ease[easeName.replace(/ease(In(?!O)|Out|InOut)(.*)/, "ease$2$1")]
}

export function transform(nodes) {
  nodes
    .attr("transform", function position(d){
      return "translate(" + [d.x, d.y] + ")"
    });
}