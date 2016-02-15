var map_data = $.getJSON("./res/泉州.polyline.1-4.json");
var attractions_data = $.getJSON("./res/泉州.attractions.json");
var $map_nav = $("#map-nav");
$map_nav.addClass("display-none");

var base_scale = 1;
var to_scale = 350; // 地图的数据要在这里放大，所需要的倍数

var map_group = new Group();

var map_paths = window.mp = new Group();
var base_map_style = {
	strokeColor: 0.8,
	fillColor: 0.1,
	strokeWidth: 1,
	dashArray: [2, 2]
};
var attraction_line;
/*= window.al = new Path();
attraction_line.closed = false;*/
var base_al_style = {
	strokeColor: 0.8,
	strokeWidth: 1.5,
	strokeJoin: 'round'
};

var attraction_points = window.ap = new Group();
var base_ap_style = {
	radius: 2,
	fillColor: 0.9,
	shadowBlur: 12,
	shadowColor: 0.8
};
var base_ap_name_style = {
	fontFamily: "微软雅黑",
	fontSize: "19px",
	fillColor: 0.8,
	// strokeColor: 0.8,
	// strokeWidth: 1.5
};

var hover_map_style = $.extend({}, base_map_style);
var hover_ani_time = 300;
var hover_ani;

// 聚焦地图，高亮地图
map_group.on("mouseenter", function() {
	map_paths.dashArray = [];
	anis.remove(hover_ani);
	hover_ani = anis.create({
		strokeColor: 1,
		fillColor: 0.3
	}, hover_ani_time, "easeOutQuart", {
		strokeColor: hover_map_style.strokeColor,
		fillColor: hover_map_style.fillColor
	}, function(new_obj) {
		map_paths.strokeColor = "rgba(255,255,255," + (hover_map_style.strokeColor = new_obj.strokeColor) + ")";
		map_paths.fillColor = "rgba(255,255,255," + (hover_map_style.fillColor = new_obj.fillColor) + ")";
	});
});
map_group.on("mouseleave", function() {
	map_paths.dashArray = [2, 2];
	map_paths.strokeColor = 'rgba(255,255,255,0.8)';
	map_paths.fillColor = "rgba(255,255,255,0.1)";
	anis.remove(hover_ani);
	hover_ani = anis.create({
		strokeColor: base_map_style.strokeColor,
		fillColor: base_map_style.fillColor
	}, hover_ani_time * 2, "easeOutQuart", {
		strokeColor: hover_map_style.strokeColor,
		fillColor: hover_map_style.fillColor
	}, function(new_obj) {
		map_paths.strokeColor = "rgba(255,255,255," + (hover_map_style.strokeColor = new_obj.strokeColor) + ")";
		map_paths.fillColor = "rgba(255,255,255," + (hover_map_style.fillColor = new_obj.fillColor) + ")";
	});
});

var ap_hover_anis = $.Anis();
var ap_hover_ani_time = 400;
// 聚焦景点，显示景点名
attraction_points.on("mouseenter", function(e) {
	var attraction_point = e.target;
	var text = attraction_point.data.$text;
	if (!text) {
		text = attraction_point.data.$text = new PointText($.extend({}, base_ap_name_style, {
			fillColor: "rgba(255,255,255," + base_ap_name_style.fillColor + ")",
		}));
		text.content = attraction_point.data.info.name;
	}
	/*else if (!text.isInserted()) {
		project.activeLayer.addChild(text);
	}*/
	map_group.addChild(text);

	var text_bounds = text.bounds;
	var attraction_point_bounds = attraction_point.bounds;

	var to_position = attraction_point.position - [0, 10 + text_bounds.height / 2] - [0, attraction_point_bounds.height / 2];
	var from_position = to_position - [0, text_bounds.height];

	to_position.opacity = 1;
	from_position.opacity = 0;

	ap_hover_anis.remove(attraction_point.data.ani_text);
	attraction_point.data.ani_text = ap_hover_anis.create(
		to_position,
		ap_hover_ani_time, "easeOutQuad",
		from_position,
		function(new_obj) {
			text.position = new_obj;
			text.opacity = new_obj.opacity;
		});
	attraction_point.data.ani_text_to = to_position;
	attraction_point.data.ani_text_from = from_position;
	main.cursor("pointer");
});
attraction_points.on("mouseleave", function(e) {
	var attraction_point = e.target;
	var text = attraction_point.data.$text;
	if (text) {
		ap_hover_anis.remove(attraction_point.data.ani_text);
		attraction_point.data.ani_text = ap_hover_anis.create(
			attraction_point.data.ani_text_from,
			ap_hover_ani_time, "easeInQuad",
			attraction_point.data.ani_text_to,
			function(new_obj) {
				text.position = new_obj;
				text.opacity = new_obj.opacity;
			});
		attraction_point.data.ani_text.onComplete = function() {
			text.remove();
			// map_group.removeChildren(text);
		};
		main.cursor();
	}
});

var small_ani;
var small_ani_time = 2000;
var small_base_scale = 1;
var samll_width = 120;
var small_x = 10;
var small_y = 10;

var oneline_ani;
var oneline_ani_time = 1200;
var oneline_base_style;
// 笑话
attraction_points.on("click", function(e) {
	attraction_points.emit("mouseleave", e);
	// small ani
	var attraction_point = e.target;
	var map_paths_bounds = map_paths.bounds;
	anis.remove(small_ani);
	small_ani = anis.create({
		scale: samll_width / map_paths_bounds.width,
		x: small_x,
		y: small_y
	}, small_ani_time, "easeOutExpo", {
		scale: small_base_scale,
		x: map_paths_bounds.x,
		y: map_paths_bounds.y
	}, function(new_obj) {
		map_paths.scale(1 / small_base_scale * new_obj.scale);
		small_base_scale = new_obj.scale;

		map_paths.bounds.x = new_obj.x;
		map_paths.bounds.y = new_obj.y;
	});

	// stop marquee
	is_stop_marquee_ani = true;

	// oneline ani
	oneline_base_style || (oneline_base_style = {
		x: attraction_line.bounds.x,
		y: attraction_line.bounds.y,
		height: attraction_line.bounds.height,
		width: attraction_line.bounds.width
	});
	anis.remove(oneline_ani);
	oneline_ani = anis.create({
		x: -view.bounds.width * 0.5 / 2,
		y: view.center.y,
		height: 0,
		width: view.bounds.width * 1.5
	}, oneline_ani_time, "easeOutExpo", oneline_base_style, function(new_obj) {
		attraction_line.bounds.height = new_obj.height;
		attraction_line.bounds.width = new_obj.width;
		attraction_line.bounds.x = new_obj.x;
		attraction_line.bounds.y = new_obj.y;
	});
	oneline_ani.onComplete = function() {

		bigbg.blur(5 + bigbg.getBlurPx());

		var base_scale = 1
		anis.create({
			scale: 0
		}, oneline_ani_time / 2, "easeInQuad", {
			scale: base_scale
		}, function(new_obj) {
			var scale = 1 / base_scale * new_obj.scale;
			attraction_line.scale(scale, view.center);
			attraction_points.scale(scale, view.center);
			base_scale = new_obj.scale;
		}).onComplete = function() {
			apnav.init(apnav.show)
		}
	}

});

var anis = $.Anis();
var is_stop_marquee_ani = false;

// 显示模块
function show() {
	var show_map_ani_time = 1200;

	$map_nav.removeClass("display-none");

	map_group.addChildren([
		map_paths,
		attraction_line,
		attraction_points,
	]);
	map_group.position = view.center;

	// MP
	map_paths.style = {
		strokeWidth: base_map_style.strokeWidth,
		strokeColor: "rgba(255,255,255," + base_map_style.strokeColor + ")",
		dashArray: base_map_style.dashArray,
		fillColor: "rgba(255,255,255," + base_map_style.fillColor + ")"
	};
	// AL
	attraction_line.style = {
		strokeWidth: base_al_style.strokeWidth,
		strokeColor: "rgba(255,255,255," + base_al_style.strokeColor + ")",
		strokeJoin: base_al_style.strokeJoin
	};
	attraction_line.closed = false;
	window.al = attraction_line;
	// AP
	attraction_points.style = {
		fillColor: "rgba(255,255,255," + base_ap_style.fillColor + ")",
		shadowBlur: base_ap_style.shadowBlur,
		shadowColor: "rgba(255,255,255," + base_ap_style.shadowColor + ")"
	};

	// 同比缩放地图，以及景点

	anis.create({
		scale: to_scale,
		strokeWidth: 0.8
	}, show_map_ani_time, "easeInOutBack", {
		scale: base_scale,
		strokeWidth: 0.2
	}, function(new_obj) {

		map_paths.strokeWidth = new_obj.strokeWidth;

		var scale_v = 1 / base_scale * new_obj.scale;
		base_scale = new_obj.scale;
		map_group.scale(scale_v, view.center);
		// map_paths.scale(scale_v, view.center);
		// attraction_line.scale(scale_v, view.center);
		// attraction_points.scale(scale_v, view.center);
	});

	// 地图跑马灯
	var marquee_time = 1000;

	function marquee() {
		is_stop_marquee_ani || anis.thenAdd({
			dashOffset: map_paths.style.dashOffset + 4
		}, marquee_time, "linear", map_paths.style);
		setTimeout(marquee, marquee_time);
	};



	/*收尾*/
	// 显示跑马灯
	marquee();

}

// 初始化模块
function init(cb) {
	$.when(map_data, attractions_data).then(function(map, attractions) {
		map = map[0];
		attractions = attractions[0];

		// MP
		map_paths.pivot = map.center;
		map.polylines.forEach(function(line) {
			var map_path = new Path(line);
			map_paths.addChild(map_path);
		});

		// AL、 AP
		attraction_line = [];
		attraction_points.pivot = map.center;
		attractions.forEach(function(attraction) {
			attraction_line.push(attraction.center);
			// var at = attraction_symbol.place();
			// at.position = attraction.center;
			var at = Shape.Circle(attraction.center, base_ap_style.radius / to_scale);

			at.data.ani_style = { // 动画缓冲的参数
				scale: 1
			};
			at.data.info = attraction;

			attraction_points.addChild(at);
		});
		attraction_line = new Path(attraction_line);
		attraction_line.pivot = map.center;


		$.isFunction(cb) && cb(map_paths);
	});
};


var ap_anis = $.Anis();

function onMouseMove(e) {
	var current_point = e.point;

	var reaction_range = 120; // 反应的范围
	var reaction_mount = 4; // 反应力度，缩放的倍率
	var reaction_range_min = reaction_mount * base_ap_style.radius; // 反应停止的返回
	var reaction_ani_time = 300; // 响应的动画时间
	ap_anis.clear();
	attraction_points.children.forEach(function(p) {
		var vector = p.position - current_point;
		var vector_length = vector.length - reaction_range_min;
		if (vector_length <= reaction_range) { // 放大
			var rr = Math.min(reaction_range - vector_length, reaction_range);
			var rm = $.easing.easeInQuart(
				rr / reaction_range,
				rr,
				1,
				reaction_mount,
				reaction_range
			);
			var to = {
				scale: rm
			};
		} else if (p.data.ani_style.scale !== -1) { // 缩小
			to = {
				scale: 1
			};
		} else {
			return
		}
		ap_anis.create(to, reaction_ani_time, "easeOutQuad", {
			scale: p.data.ani_style.scale
		}, function(new_obj) {
			var scale_v = 1 / p.data.ani_style.scale * new_obj.scale;
			p.data.ani_style.scale = new_obj.scale;
			p.scale(scale_v);
		});

	});

}

function onFrame(e) {
	anis.run(e.count, e.time, e.delta);
	ap_anis.run(e.count, e.time, e.delta);
	ap_hover_anis.run(e.count, e.time, e.delta);
};


window.mapnav = {
	init: init,
	show: show
};

// init(show);