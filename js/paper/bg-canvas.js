var bg_img = window.bi = new Raster('./img/big-bg.jpg', view.center);
var bg_mask = window.bm = new Path.Rectangle(view.bounds);
var base_mask_style = {
	fillColor: 0.8
};
bg_mask.style = {
	fillColor: "rgba(0,0,0," + base_mask_style.fillColor + ")"
};

// 背景图滚动

var bg_img_anis = $.Anis();
var img_move_time = 30000;

var img_move_ani;

bg_img.onLoad = function() {
	bg_img.fitBounds(view.bounds, true);

	bg_img_anis.remove(img_move_ani);

	function toLeft() {
		img_move_ani = bg_img_anis.create({
			x: 0,
			y: 0
		}, img_move_time, "easeInSine", bg_img.bounds, function(new_obj) {
			bg_img.bounds.x = new_obj.x
			bg_img.bounds.y = new_obj.y
		});
		img_move_ani.onComplete = toRight;
	}

	function toRight() {
		img_move_ani = bg_img_anis.create({
			x: view.bounds.width - bg_img.bounds.width,
			y: view.bounds.height - bg_img.bounds.height
		}, img_move_time * 2, "easeInSine", bg_img.bounds, function(new_obj) {
			bg_img.bounds.x = new_obj.x
			bg_img.bounds.y = new_obj.y
		});
		img_move_ani.onComplete = toLeft;
	}

	toLeft();
};

var bg_img_loader = new Raster();
bg_img_loader.remove();
var change_img_ani_time = 300;

function changeBGImg(url) {

	var loader_deferred = $.Deferred();
	var then_deferred = $.Deferred();

	// bg_img.source = url;
	bg_img_loader.source = url;
	bg_img_loader.onLoad = function() {
		loader_deferred.resolve();
	};

	bg_img_anis.create({
		opacity: 0
	}, change_img_ani_time, "easeInQuad", {
		opacity: 1
	}, function(new_obj) {
		console.log(new_obj);
		bg_img.opacity = new_obj.opacity;
	});
	setTimeout(function() {
		then_deferred.resolve();
	}, change_img_ani_time);

	$.when(loader_deferred, then_deferred).then(function() {
		bg_img.source = url;
		console.log("QAQ")
		bg_img_anis.create({
			opacity: 1
		}, 300, "easeInQuad", {
			opacity: 0
		}, function(new_obj) {
			console.log(new_obj);
			bg_img.opacity = new_obj.opacity;
		});
	});
};

var bg_hover_anis = $.Anis();
var bg_mask_ani_time = 600;
var bg_mask_ani_style = $.extend({}, base_mask_style);
var bg_img_ani_time = 600;
var bg_img_ani_scale = 1;

function hoverBGCore(opacity, scale) {
	opacity = parseFloat(opacity) || base_mask_style.fillColor;

	bg_hover_anis.clear();

	bg_hover_anis.create({
		fillColor: opacity
	}, bg_mask_ani_time, "easeOutQuad", bg_mask_ani_style, function(new_obj) {
		bg_mask_ani_style.fillColor = new_obj.fillColor;
		bg_mask.style.fillColor = "rgba(0,0,0," + bg_mask_ani_style.fillColor + ")";
	});
	bg_hover_anis.create({
		scale: scale
	}, bg_img_ani_time, "easeOutQuad", {
		scale: bg_img_ani_scale
	}, function(new_obj) {
		bg_img.scale(1 / bg_img_ani_scale * new_obj.scale, view.center);
		bg_img_ani_scale = new_obj.scale;
	});
	return bg_hover_anis;
};

function hoverBG(is_enter) {
	if (is_enter) {
		bg_img_anis.stop(current_frame_info.count,
			current_frame_info.time,
			current_frame_info.delta);
		hoverBGCore(0.68, 1.08);
	} else {
		hoverBGCore(0.8, 1).then(function() {
			bg_img_anis.remuse(current_frame_info.count,
				current_frame_info.time,
				current_frame_info.delta);
		});
	}
}

var current_frame_info = {
	count: 0,
	time: 0,
	delta: 0
};

function onFrame(e) {
	current_frame_info.count = e.count;
	current_frame_info.time = e.time;
	current_frame_info.delta = e.delta;

	bg_img_anis.run(e.count, e.time, e.delta);
	bg_hover_anis.run(e.count, e.time, e.delta);
};

window.bigbg = {
	changeImg: changeBGImg,
	hover: hoverBG
}