var attractions_data = $.getJSON("./res/泉州.attractions.json");
var $ap_nav = $("#ap-nav");
$ap_nav.addClass("display-none");

var width, height, center;
var points = [];
var points_len = 0;
var is_smooth = true;
var ap_line = window.apl = new Path();
var ap_point_group = window.appg = new Group();
var ap_point_base_style = {
	radius: 80,
	strokeWidth: 2,
	strokeColor: 0.5,
	fillColor: 0.3
};
var apl_group = window.aplg = new Group();
apl_group.addChild(ap_line);
apl_group.addChild(ap_point_group);

var anis = $.Anis();

ap_line.style = {
	fillColor: {
		gradient: {
			stops: [ /*"rgba(255,255,255,1)",*/ "rgba(255,255,255,0.3)", "rgba(255,255,255,0)"]
		},
		origin: view.center - [0, view.center.y / 10],
		destination: view.bounds.bottomCenter - [0, view.center.y / 10]
	},
	// strokeWidth: 1.5,
	// strokeColor: "rgba(255,255,255,0.8)"
};

var mousePos = view.center / 2;
var pathHeight = mousePos.y;
var wavelength = 200;
var img_hover_ani_time = 1200;
var img_hover_ani_scale = 1.6;

function init(cb) {
	$.when(attractions_data).then(function(attractions) {
		var center_y = view.center.y;
		attractions.forEach(function(attraction, i) {
			attraction.position = [wavelength * (i + 1), center_y];

			var img_raster = new Raster(attraction.preview_img_url);
			img_raster.onLoad = function() {
				img_raster.fitBounds(new Rectangle(
					attraction.position[0],
					attraction.position[1],
					ap_point_base_style.radius * 2,
					ap_point_base_style.radius * 2
				), true);
				img_raster.position = img_clip.position;

				function hover_img(scale) {
					anis.remove(img_group.data.hover_ani);
					img_group.data.hover_ani = anis.create({
						scale: scale,
						radius: img_group.data.hover_base_radius / scale,
						rampPoint: img_group.data.hover_base_rampPoint / ((scale - 1) * 2 + 1)
					}, img_hover_ani_time, "easeOutExpo", {
						scale: img_group.data.hover_scale,
						radius: img_border.radius,
						rampPoint: img_border.fillColor.gradient.stops[0].rampPoint
					}, function(new_obj) {
						img_raster.scale(1 / img_group.data.hover_scale * new_obj.scale, img_raster.position);
						img_group.data.hover_scale = new_obj.scale;
						img_clip.radius = img_border.radius = new_obj.radius;
						img_border.fillColor.destination = [new_obj.radius, 0];
						img_border.fillColor.gradient.stops[0].rampPoint = new_obj.rampPoint;
					});
				}
				img_group.data.hover_scale = 1;
				img_group.data.hover_base_radius = img_border.radius;
				img_group.data.hover_base_rampPoint = img_border.fillColor.gradient.stops[0].rampPoint;

				// 由于图片的层级问题会导致鼠标控制不到
				// 手动实现穿透型的事件触发
				var is_hover = false;
				apl_group.on("mousemove", function(e) {
					var _is_hover = (e.point - img_clip.position).length > img_clip.radius;
					if (_is_hover !== is_hover) {
						if (is_hover = _is_hover) { //leave
							hover_img(img_hover_ani_scale);
						} else { // enter
							hover_img(1);
						}
					}
				});

				hover_img(img_hover_ani_scale);
			}

			var img_clip = new Shape.Circle(attraction.position, ap_point_base_style.radius);
			// img_clip.style = {
			// 	fillColor: "rgba(255,255,255," + ap_point_base_style.fillColor + ")"
			// };
			// img_clip.clipMask = true;

			var img_border = new Shape.Circle(attraction.position, ap_point_base_style.radius);
			img_border.style = {
				strokeWidth: ap_point_base_style.strokeWidth,
				strokeColor: "rgba(255,255,255," + ap_point_base_style.strokeColor + ")",
				fillColor: {
					gradient: {
						stops: [
							["rgba(255,255,255,0)", 0.62],
							"rgba(255,255,255," + ap_point_base_style.strokeColor + ")"
						],
						radial: true
					},
					// origin: [attraction.position],
					// destination: [attraction.position[0] + ap_point_base_style.radius, attraction.position[1]]
					origin: [0, 0],
					destination: [ap_point_base_style.radius, 0]
				}
			};

			// var img_clip_group = new Group(img_clip, img_raster);
			// img_clip_group.clipped = true;
			// var img_group = new Group(img_clip_group, img_border);

			img_clip.clipMask = true;
			var img_group = new Group(img_raster, img_clip, img_border);

			attraction.position_circle = img_group;
			ap_point_group.addChild(img_group);
		});
		initializePath(attractions);
		$.isFunction(cb) && cb();
	});
};

function initializePath(_points) {
	points = _points;
	points_len = points.length;
	center = view.center;
	width = view.size.width;
	height = view.size.height / 2;
	ap_line.segments = [];
	ap_line.add([wavelength, view.bounds.height]);
	for (var i = 0; i < points_len; ++i) {
		var point = new Point(points[i].position);
		ap_line.add(point);
	}
	ap_line.add([wavelength * i, view.bounds.height]);
	// ap_line.fullySelected = true;

	view.draw()
};

function show(num) {
	$ap_nav.removeClass("display-none");
	jumpTo(num);
};

function jumpTo(num) {
	var point;
	if (Number.isFinite(num) && (point = points[num])) {
		// ap_point_group.addChild(point.position_circle);
		point.position_circle.emit("mouseenter");
	}
};

var drag_ani;
var drag_ani_time = 1200;
var drag_position_x;

function onMouseMove(event) {
	mousePos = event.point;
};
/*
 * 鼠标样式
 */

main.cursor("grab");

function onMouseDown(e) {
	main.cursor("grabbing");
};

function onMouseUp(e) {
	main.cursor("grab");
};

ap_point_group.on("mouseenter", function(e) {
	main.cursor("hover");
});

ap_point_group.on("mouseleave", function(e) {
	main.cursor("grab");
});


function onMouseDrag(e) {
	drag_position_x === undefined && (drag_position_x = apl_group.position.x);
	if (drag_position_x > wavelength + apl_group.bounds.width / 2) {
		drag_position_x = wavelength + apl_group.bounds.width / 2;
	} else if (drag_position_x < -wavelength * 2) {
		drag_position_x = -wavelength * 2;
	}
	drag_position_x += e.delta.x;
	anis.remove(drag_ani);
	drag_ani = anis.create({
		x: drag_position_x
	}, drag_ani_time, "easeOutExpo", {
		x: apl_group.position.x
	}, function(new_obj) {
		apl_group.position.x = new_obj.x;
	});
};


function onFrame(event) {
	pathHeight += (center.y - mousePos.y - pathHeight) / 10;
	for (var i = 0; i < points_len; ++i) {
		var sinSeed = event.count + (i + i % 10) * 100;
		var sinHeight = Math.sin(sinSeed / 200) * pathHeight / 10;
		var yPos = Math.sin(sinSeed / 100) * sinHeight + height;
		ap_line.segments[i + 1].point.y = yPos;
		points[i].position_circle.position.y = yPos;
	}
	if (is_smooth) {
		ap_line.smooth({
			type: 'continuous'
		});
		ap_line.segments[0].handleOut = ap_line.segments[0].handleIn = null
		ap_line.segments[1].handleOut = ap_line.segments[1].handleIn = null
		var len = ap_line.segments.length;
		ap_line.segments[len - 1].handleOut = ap_line.segments[len - 1].handleIn = null
		ap_line.segments[len - 2].handleOut = ap_line.segments[len - 2].handleIn = null
	}

	anis.run(event.count, event.time, event.delta);
}

window.apnav = {
	init: init,
	show: show,
	jumpTo: jumpTo
};

init(function() {
	show(6)
});