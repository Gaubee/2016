var loaderProgressController = (function() {
	var $loader_progress_bar = $("#loader-progress-bar");
	var $loader_progress = $("#loader-progress");
	var _tl = new TimelineLite();

	var default_attrs = {
		rotation: 0,
		transformOrigin: "center center",
		ease: Power1.easeInOut
	};

	// 初始化样式
	_tl.set($loader_progress_bar, $.extend({}, default_attrs, {
		drawSVG: "0%",
		opacity: 0.5
	}));
	// 初始化加载进度
	function initLoaderProgress(progress) {
		TweenLite.to($loader_progress, 2, {
			scale: 0.5,
			transformOrigin: "center center",
			ease: Back.easeOut.config(1.7)
		});
		res.setLoaderProgress = setLoaderProgress;
		return setLoaderProgress(progress);
	};
	// 设置加载进度
	function setLoaderProgress(progress) {
		_tl.clear();
		_tl.to($loader_progress_bar, 0.3, $.extend({}, default_attrs, {
			rotation: 360 * (progress / 100),
			drawSVG: progress + "%",
			opacity: progress == 100 ? 1 : 0.5
		}));

		if (progress == 100) {
			res.setLoaderProgress = closeLoaderProgress;
			closeLoaderProgress()
		}
	};
	// 结束加载
	function closeLoaderProgress() {
		_tl.to($loader_progress_bar, 0.5, $.extend({}, default_attrs, {
			rotation: 360,
			opacity: 0
		}));
		_tl.to($loader_progress, 2, {
			scale: 2,
			transformOrigin: "center center",
			opacity: 0,
			ease: Power4.easeOut
		});
	};
	// 关闭进度加载器
	function closeLoader() {

	};
	var res = {
		setLoaderProgress: initLoaderProgress,
		closeLoader: closeLoader
	}
	return res;
}());

var _progress = 0;
var _ti = setInterval(function() {
	_progress += Math.random() * 5;
	if (_progress >= 100) {
		clearInterval(_ti);
		_progress = 100;
	}
	console.log("progress:", _progress);
	loaderProgressController.setLoaderProgress(_progress);
}, 100); //0.5 * 20 = 10