var radius = 300;
var circumference = function() {
	return 2 * Math.PI * radius;
};
var fill_opacity = 0.5;
var init_ani_time = 1200;
var set_p_ani_time = 300;
var end_p_ani_time = 1600; //1:1
var hover_ani_time = 1500; //2:3
var close_ani_time = 1200;

var loader_base_line = new Path.Circle({
	center: view.center,
	radius: radius
});
loader_base_line.style = {
	strokeColor: 'rgba(255,255,255,0.8)',
	dashArray: [2, 6],
	strokeWidth: 0.5,
	strokeCap: 'square'
};

// 计算圆弧上的点
function new_p(deg) { //arc_p
	return new Point(Math.sin(deg), -Math.cos(deg));
	// return new Point(parseFloat(Math.sin(deg).toFixed(6)), parseFloat(-Math.cos(deg).toFixed(6)));
};

var from_p = new_p(0) * radius + view.center;
var loader_progress_line = window.lpl = new Path.Arc(from_p, from_p, from_p);
loader_progress_line.style = {
	strokeColor: 'rgba(255,255,255,' + fill_opacity + ')',
	strokeWidth: 4,
	strokeCap: 'square',
};
// loader_progress_line.selected = true
loader_progress_line._progress = 0;
loader_progress_line._setProgress = function(p) {
	loader_progress_line._progress = p;
	if (p === 1) {
		p.segments = Path.Circle(view.center, radius).segments;
	} else {
		var deg = p * 2 * Math.PI;
		var through = new_p(deg / 2, deg / 2) * radius + view.center;
		var to = new_p(deg, deg) * radius + view.center;
		this.removeSegments(1, this.segments.length);
		this.arcTo(through, to);
	}
};

var loader_group = new Group(loader_base_line, loader_progress_line);
window.loader_group = loader_group;

// 初始化 动画
var anis = $.Anis();

// $ele: show after progress is 100%;
function initP($ele) {
	if (loader.$controller = $ele) {
		TweenLite.set($ele, {
			scale: 0
		});
	}

	var base_scale = 1;
	var base_rotate = 0;
	anis.create({
		scale: 1,
		rotate: 0
	}, init_ani_time, "easeInOutBack", {
		scale: 0.5,
		rotate: 0
	}, function(new_obj) {
		loader_group.rotate(new_obj.rotate - base_rotate);
		base_rotate = new_obj.rotate;
		loader_group.scale(1 / base_scale * new_obj.scale, view.center);
		base_scale = new_obj.scale;
	});
	anis.then(_run_progress);
};
// 进度 动画

function setP(progress) {
	progress = progress / 100;
	anis.clear();
	anis.create({
		progress: progress,
	}, set_p_ani_time, "easeOutQuad", {
		progress: loader_progress_line._progress
	}, function(new_obj) {
		loader_progress_line._setProgress(new_obj.progress)
	});

	if (progress >= 1) {
		// 高亮进度条
		var a1 = anis.thenAdd({
			fill_opacity: 1,
		}, end_p_ani_time / 2, "easeOutQuart", {
			fill_opacity: 0.5,
		}, function(new_obj) {
			loader_progress_line.style.strokeColor = 'rgba(255,255,255,' + new_obj.fill_opacity + ')';
		}, 100);
		// 隐藏进度条
		var a2 = anis.thenAdd({
			opacity: 0,
		}, end_p_ani_time / 2, "easeOutQuart", {
			opacity: 1,
		}, function(new_obj) {
			loader_progress_line.opacity = new_obj.opacity;
		});

		loader.can_hover_able = true;
		loader.$controller && TweenLite.to(loader.$controller, end_p_ani_time / 2 / 1000, {
			scale: 1,
			ease: Back.easeOut.config(1.7)
		});
	}
};

// 焦距动画
var hover_ani;
var hover_scale = 1;
var hover_rotate = 0;

function hoverP(is_enter) {
	if (!loader.can_hover_able) {
		return
	}
	anis.remove(hover_ani);
	if (is_enter) { // enter
		var to = {
			rotate: 60,
			scale: 0.85
		};
	} else { // leave
		to = {
			rotate: 0,
			scale: 1
		}
	}
	hover_ani = anis.create(to, hover_ani_time * 2 / 5, "easeOutQuart", {
		rotate: hover_rotate,
		scale: hover_scale
	}, function(new_obj) {
		loader_group.rotate(new_obj.rotate - hover_rotate);
		hover_rotate = new_obj.rotate;
		loader_group.scale(1 / hover_scale * new_obj.scale, view.center);
		hover_scale = new_obj.scale;
	});
	console.log(hover_ani)
};

// 关闭 动画

function closeP() {
	var base_scale = 1;
	var base_rotate = 0;
	anis.clear();
	anis.create({
			scale: 0,
			rotate: 360,
		}, close_ani_time, "easeInBack", {
			scale: 1,
			rotate: 0,
		},
		function(new_obj) {
			loader_group.rotate(new_obj.rotate - base_rotate);
			base_rotate = new_obj.rotate;
			loader_group.scale(1 / base_scale * new_obj.scale, view.center);
			base_scale = new_obj.scale;
		});
	loader.$controller && TweenLite.to(loader.$controller, close_ani_time / 1000, {
		scale: 0,
		opacity: 0,
		ease: Back.easeIn.config(1.7)
	});
	anis.then(function() {
		loader_group.remove();
		loader.$controller && loader.$controller.remove();
	});
};

function onResize() {
	loader_base_line.style.center = view.center;
	loader_progress_line.style.center = view.center;
};

function onFrame(e) {
	anis.run(e.count, e.time, e.delta);
};

var $e = $();
window.loader = {
	init: initP,
	setProgress: setP,
	can_hover_able: false,
	hover: hoverP,
	close: closeP,
};
// 事件触发器
$.each([
	"on",
	"one",
	"off",
	"trigger"
], function(i, key) {
	loader[key] = function() {
		return $e[key].apply($e, arguments);
	}
});

function _run_progress() {
	var p = 0;
	var _ti = setInterval(function() {
		p += Math.random() * 80;
		if (p >= 100) {
			p = 100;
			clearInterval(_ti);
		};
		setP(p);
	}, 500);
};

loader.init($("#welcome-view"));