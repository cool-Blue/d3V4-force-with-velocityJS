/**
 * fps-histogram
 */
import d3 from 'd3'
import 'd3SelectionMulti'
import {transplot} from '../src/plot-transform'

d3.ui = d3.ui || {};

d3.ui.FpsMeter = function Histogram(on, style, config) {
  let BINS = 30;
  let _style = merge({
      "background-color": 'black',
      display: "inline-block",
      margin: "0 0 0 6px"
    }, style),
    hist = d3.select(on).append("div")
      .styles(_style)
      .attr("id", "histogram")
      .append("svg")
      .styles({display: "inline-block", overflow: "visible", margin: 0})
      .attrs(merge({fill: "url(#xColor)"}, config)),
    plot = hist.append("g")
      .attrs(transplot(config.height))
      .classed("plot", true)
      .attrs({"fill": "url(#xColor)"}),
    _xAxis = d3.axisBottom()
      .tickFormat("")
      .ticks(3)
      .tickSize(config.tickSize || 3),
    xAxis = (g) => {
      g.call(_xAxis)
        .attrs({
          "fill": "url(#xColor)", stroke: 'url(#xColor)'
        });
      g.select(".domain").attr("stroke", "none");
      let ticks = g.selectAll(".tick:not(:first-of-type) line").attr("stroke", "black");
      ticks.select("line").attr("stroke-width", "0.5px")
    },
    xG = hist.append("g")
      .attrs({
        "transform": "translate(0," + (config.height) + ")",
        "id": "x-axis-fill"
      }),

    defs = hist.append("defs"),
    gradient = defs.append("linearGradient")
      .attrs({
        id: "xColor", x1: "0%", y1: "0%", x2: "100%", y2: "0%",
        gradientUnits: "userSpaceOnUse"
      });
  gradient.append("stop")
    .attrs({"offset": "0%", "stop-color": "red"});
  gradient.append("stop")
    .attrs({"offset": "50%", "stop-color": "orange"});
  gradient.append("stop")
    .attrs({"offset": "100%", "stop-color": "green"});

  update(d3.range(BINS));

  function update(data) {
    if (!data || !data.length) return;
    let x = d3.scaleLinear()
        .domain(config.domain || [0, d3.max(data, config.values)])
        .range([0, config.width]),
      h = makeHist(data, config.values, x),
      y = d3.scaleLinear()
        .domain([0, d3.max(h, function (d) {
          return d.length
        })])
        .range([0, config.height]),
      bars = plot.selectAll(".bar").data(h);

    bars.enter().append("rect")
      .attrs({
        class: "bar",
        opactity: 1,
        width: function (d) {
          return x(d.x1 - d.x0)
        },
        x: function (d) {
          return x(d.x0)
        }
      });

    bars.exit().remove();

    bars.attr("height", function (d) {
      return y(d.length)
    });
    _xAxis.scale(x);
    xG.call(xAxis);
  }

  return update;

  function makeHist(data, values, x) {
    return d3.histogram()
      .domain(x.domain())
      .thresholds(x.ticks(BINS))(data.map(d => values(d)))
  }

  function merge(source, target) {
    for (let p in source) if (target && !target.hasOwnProperty(p)) target[p] = source[p];
    return target;
  }
};

