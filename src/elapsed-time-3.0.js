// <script src="https://gitcdn.xyz/repo/cool-Blue/d3-lib/master/elapsedTime/elapsedTime/elapsed%20time%201.0.js"></script>

  import d3 from 'd3'
  import 'd3SelectionMulti'

	console.warn("elapsed-time-2.0.js");
	(function() {
		//polly-fill for safari
		if("performance" in window == false) {
			window.performance = {};
		}

		Date.now = (Date.now || function() {  // thanks IE8
			return new Date().getTime();
		});

		if("now" in window.performance == false) {

			let nowOffset = Date.now();

			if(performance.timing && performance.timing.navigationStart) {
				nowOffset = performance.timing.navigationStart
			}

			window.performance.now = function now() {
				return Date.now() - nowOffset;
			}
		}

	})();
	function OutputDiv() {
		//constructor
		function _OutputDiv(on, style, before) {
			//private instance state
			let _sel     = d3.select(on), id = ~~(Math.random() * 1000),
					_style   = merge({
						margin       : '10px 10px 10px 0',
						padding      : '3px 3px 3px 3px',
						display      : 'inline-block',
						'white-space': 'pre'
					}, style || {}),
					_message = function(value) {
						return value
					};
			if(before) {
				_sel = _sel.insert('div', before)
			} else {
				_sel = _sel.append('div')
			}
			_sel = _sel.styles(_style)
				.attr("id", "ouputDiv_" + id)
				.attr("class", "ouputDiv");

			//public instance state
			this.selection = _sel;
			this.update = function() {
				this.selection.text(_message.apply(this, arguments));
				return this
			};
			this.message = function(f) {
				_message = f;
				return this
			};
			function merge(source, target) {
				for(let p in source) if(target && !target.hasOwnProperty(p)) target[p] = source[p];
				return target;
			}
		}

		//create and initialise new instance
		return function(on, style, before) {
			return new _OutputDiv(on, style, before)
		}
	}

	export function ElapsedTime(on, style, before) {
		let elapsedTime = OutputDiv()(on, style, before).update("loading...");
		elapsedTime.start = function(aveWindow) {
			this.aveLap = _AveLap.call(this, aveWindow || 1000);
			this.startTime = window.performance.now();
			this.lapTime = this.startTime;
			this.ticks = 0;
			this.update(0);
			this.running = true;
			return this
		};
		elapsedTime.lap = function () {
			if (this.running) {
				this.lastLap = (window.performance.now() - this.lapTime) / 1000;
				this.lapTime = window.performance.now()
			}
			return this
		};
		elapsedTime.t = function() {
			return d3.format(" >8,.3f")((window.performance.now() - this.startTime) / 1000)
		};
		elapsedTime.mark = function(f) {
			if(this.running) {
				let _tMark = (window.performance.now() - this.startTime);
				this.ticks += 1;
				if(!f) {
					this.update(_tMark / 1000)
				} else if(f.call) {
					f.call(this, _tMark)
				} else this.update(f)
			} else {
				let _tMark = 0;
				//this.start()
			}
			return this
		};
		elapsedTime.message(function(value) {
			return 'time elapsed : ' + d3.format(",.3f")(value)
				+ ' sec\t' + d3.format(",d")(this.ticks)
		});
		elapsedTime.stop = function() {
			this.running = false;
			return this
		};
		elapsedTime.timestamp = function(caller, message) {
			if(this.consoleOn) {
				let _caller = (caller && caller.callee) ? /function\s+(\w*)\(/.exec(caller.callee)[1] : caller;
				this.mark(function(t) {
					console.log(d3.format(" >8,.6f")(t / 1000) + (_caller ? "\t" + _caller + (message ? "\t"
						+ message : "") : ""))
				})
			}
		};
		elapsedTime.consoleOn = false;
		return elapsedTime;

		function _AveLap(aveWindow) {
			let _i = 0, _aveP = 0, _history = [], _aveWindow = aveWindow || 1000;
			function f(this_lap) {
				this_lap = this_lap || this.lap().lastLap;
				if(!_aveWindow) return _aveP = _i++ ? (_aveP + this_lap / (_i - 1)) * (_i - 1)
				/ _i : this.lap().lastLap;
				if(this_lap) _history.push(this_lap);
				for(; _history.length > _aveWindow;) {
					_history.shift()
				}
				return _history.reduce(function(ave, t, i, h) {
					return ave + t / h.length
				}, 0)
			}
			Object.defineProperties(f, {
				history:{get: function() {return _history}},
				aveWindow:{get: function() {return _aveWindow}, set: function(w) {_aveWindow = w}}
			});
			return f
		}
	}

