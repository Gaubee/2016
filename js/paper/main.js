var _progress = 0;
var _ti = setInterval(function() {
	_progress += Math.random() * 80;
	if (_progress >= 100) {
		clearInterval(_ti);
		_progress = 100;
	}
	loader.setProgress(_progress);
}, 500);

// 初始化加载器
var $welcome_view = $("#welcome-view");
loader.init($welcome_view);

$welcome_view.find("> .bar").hover(function() {
	loader.hover(true);
	bigbg.hover(true);
}, function() {
	loader.hover();
	bigbg.hover();
}).click(function() {

	bigbg.changeImg("./img/big-bg-2.jpg");
	loader.close().then(function() {
		mapnav.init(mapnav.show);
	});
	bigbg.blur(5);
});

window.main = {
	cursor: function(type) {
		type || (type = "default");
		if (type === "hover") {
			type = "pointer";
		}
		if (type === "grab") {
			type = "-webkit-grab";
		}
		if (type === "grabbing") {
			type = "-webkit-grabbing";
		}
		document.body.style.cursor = type;
	}
}