/*
 * @author: Gaubee, gaubeebangeel@gmail.com
 */
;
(function($) {
	function AniFactory() {

		// 动画队列
		var quene = Ani._q = [];

		function Ani(to, duration, easing_name, obj, cb, delay) {
			var self = this;
			if (!(self instanceof Ani)) {
				return new Ani(to, duration, easing_name, obj, cb, delay);
			}
			/*check to*/
			if (typeof to !== "object") {
				throw TypeError("to must be Object.");
			}
			var keys = Object.keys(to);
			var keys_len = keys.length;
			self.to = to;

			/*check easing_name*/
			var easing_fun = $.easing[easing_name];
			if (!$.isFunction(easing_fun)) {
				throw TypeError(easing_name + " no defined in $.easing.");
			}
			self.easing_name = easing_name;

			/*check obj*/
			if (typeof obj !== "object") {
				throw TypeError("obj must be Object.");
			}
			var from = {};
			for (var _i = 0, _key; _i < keys_len; _i += 1) {
				_key = keys[_i];
				from[_key] = obj[_key];
			}
			self.from = from;

			// console.log(to, from, keys)

			/*check cb*/
			if (!$.isFunction(cb)) {
				cb = function(new_obj) {
					var key;
					for (var i = 0; i < keys_len; i += 1) {
						key = keys[i];
						obj[key] = new_obj[key]
					}
				}
			}
			self.cb = cb;

			self.run = function first_run(count, time, delta) {
				self.start_time = time - delta;
				self.start_count = count;
				self.run = run;
				run.apply(self, arguments);
			};
			self.stop = function(count, time, delta) {
				if (!self.is_stop) {
					self.stop_time = time;
					self.stop_count = count;
					self.is_stop = true;
				}
			};
			self.remuse = function(count, time, delta) {
				if (self.is_stop) {
					self.is_stop = false;
					self.start_time += time - self.stop_time;
					self.start_count += count - self.stop_count;
				}
			};

			function run(count, time, delta) {
				if (self.is_stop) {
					return
				}
				var x, t, b, c, d;
				t = (time - self.start_time) * 1000;
				if (self.remaining_delay !== 0) {
					self.remaining_delay = Math.max(self.delay - t, 0);
					if (self.remaining_delay > 0) {
						return;
					} else {
						// 正式开始，重新写时间点
						self.start_time = time;
						self.start_count = count;
						t = (time - self.start_time) * 1000;
					}
				}

				d = self.duration;
				t = Math.min(d, t);
				x = self.progress = d ? t / d : 1; // d == 0 --> progress = 1
				// console.log(x, easing_fun(x, t, 0, 1, d))

				var new_obj = {};
				var key;
				for (var i = 0; i < keys_len; i += 1) {
					key = keys[i];
					/*
					 * t: current time, 
					 * b: begInnIng value, 
					 * c: change In value, 
					 * d: duration
					 */

					/* 高版本的jQ，返回的是百分比的值，低版本的返回的是计算结果 */
					// b = from[key];
					// c = to[key];
					// new_obj[key] = easing_fun(x, t, b, c, d) //low

					new_obj[key] = from[key] + (to[key] - from[key]) * easing_fun(x, t, 0, 1, d); //hight
				}
				cb(new_obj);
				if (self.progress === 1) {
					self.complete = true;
					Ani.remove(self);
					if ($.isFunction(self.onComplete)) {
						self.onComplete(count, time, delta);
					}
				}
			};

			/*base attrs*/
			self.duration = Math.max(parseInt(duration, 10) || 0, 0); // animate duration
			self.delay = parseInt(delay, 10) || 0;
			self.remaining_delay = self.delay;
			self.start_time = 0; // first frame time
			self.start_count = 0; // first frame id
			self.progress = 0;
			self.complete = false;

		};
		Ani.create = function() {
			var ani = Ani.apply(this, arguments);

			/*add to quene*/
			Ani.add(ani);
			return ani;
		};

		Ani.add = function(ani) {
			if (ani instanceof Ani && quene.indexOf(ani) === -1) {
				quene.push(ani)
			}
		};
		Ani.remove = function(ani) {
			var index = quene.indexOf(ani);
			if (index !== -1) {
				quene.splice(index, 1);
			}
		};
		Ani.clear = function() {
			quene.length = 0;
		};
		Ani.run = function(count, time, delta) {
			for (var i = 0, ani; ani = quene[i]; i += 1) {
				ani.run(count, time, delta)
			}
		};
		Ani.stop = function(count, time, delta) {
			for (var i = 0, ani; ani = quene[i]; i += 1) {
				ani.stop(count, time, delta)
			}
		};
		Ani.remuse = function(count, time, delta) {
			for (var i = 0, ani; ani = quene[i]; i += 1) {
				ani.remuse(count, time, delta)
			}
		};

		Ani.getDelay = function(delay) {
			var max_delay = 0;
			for (var i = 0, ani; ani = quene[i]; i += 1) {
				// console.log(ani.remaining_delay)
				max_delay = Math.max(max_delay, ani.remaining_delay + ani.duration * (1 - ani.progress));
			}
			delay = parseInt(delay, 10) || 0;
			delay += max_delay;
			return delay;
		};
		Ani.thenAdd = function(to, duration, easing_name, obj, cb, delay) {
			delay = Ani.getDelay(delay);
			return Ani.create(to, duration, easing_name, obj, cb, delay);
		};
		Ani.then = function(cb, delay) {
			delay = Ani.getDelay(delay);

			// 使用动画队列，可被remove
			return $.isFunction(cb) && Ani.create({}, 0, "linear", {}, cb, delay);
		};
		return Ani;
	}

	$.Anis = window.Anis = AniFactory;
}(jQuery));