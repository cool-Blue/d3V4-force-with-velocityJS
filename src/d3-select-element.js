/**
 * d3-select-element
 * 
 * Created by cool.blue on 4/04/2017.
 * Example
 * <script src="https://gitcdn.xyz/repo/cool-Blue/d3-lib/master/inputs/select/select.js"></script>
 *
 *		isoLines = d3.ui.select({
 *			base: inputs,
 * 			onUpdate: update,
 *			data: [{text: "show lines", value: "#ccc"}, {text: "hide lines", value: "none"}]
 *		}),
 *
 *		.style("stroke", isoLines.value());
*/
import {dispatch} from "d3-dispatch";
import 'd3-selection-multi'
import {select} from "d3-selection";

export default function (config) {
  // add a select element on base with options matching data
  // if the text and value is the same then data is scalar array
  // 	otherwise the data elements must have text and value fields
  // config
  //  base
  //  before
  //  style
  //  initial
  //  hook
  //  onX
  var selectElement  = (config.base ?
      (config.base.append ? config.base : select(config.base)) :
      select("body"))
      [config.before ? "insert" : "append"]("select", config.before ? config.before : null)
      .each(hookEvents)
      .data([config.data]),
    options = selectElement.selectAll("option").data(function(d) {return d});
  options = options.merge(options.enter().append("option"));
  options = options.enter().append("option").merge(options);
  options.exit().remove();
  if(config.style) selectElement.styles(config.style);
  return merge(config, options, ["base", "before", "style", "initial", "hook", /on.+/])
    .attrs({
      value: function(d) {
        return d.value || d;
      },
      selected: function(d){return d == config.initial ? "selected" : null}
    })
    .text(function(d) {
      return d.text || d
    })
    .call(function(selection) { //add a custom property to the final selection
      if(config.hook) config.hook();
      selection.value = function() {
        return selectElement.property('value')
      }
    });

  function hookEvents() {
    // store the DOM element
    var _control = this;
    // config object for the control
    // parse the keys and bind a listener to any key beginning with "on"
    Object.keys(config).filter(function(k) {
      return k.slice(0, 2) == "on";
    }).map(function(p, i, listeners) {
      // strip the event name off the listener
      var e = p.slice(2);

      if(!config.on)
      // lazily create a dispatch with the events found in config
        config.on = dispatch
          .apply(null, listeners.map(function(l) {
            return l.slice(2);
          }));

      config.on.on(e, config[p]);
      // then hook the dispatch to the element event
      select(_control).on(e, function() {
        config.on.apply(e, this, arguments)
      })

    });
  }
  function merge(source, target, exclude) {
    function included(test){
      return !exclude.some(function(p,i){return test.match(p)})
    }
    for(var p in source)
      if(included(p) && target && !target.hasOwnProperty(p))
        Object.defineProperty(target, p, Object.getOwnPropertyDescriptor(source, p));
    return target;
  }
}
