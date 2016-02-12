require("GQ-core");

function getPoint(point_str) {
	var point_info = point_str.split(",");
	point_info[0] = parseFloat((point_info[0]));
	point_info[1] = parseFloat((point_info[1]));
	return point_info;
};

var map_data = require("./泉州地图.json");

var res = map_data.districts.map(function(district, i) {
	var polyline = district.polyline;
	var center_info = district.center.split(",");
	return {
		center: getPoint(district.center),
		name: district.name,
		polylines: polyline.split("|").map(function(line, i) {
			return line.split(";").map(function(point, i) {
				return getPoint(point);
			});
		})
	}
})[0];

fs.writeFileSync("./泉州.polyline.1-1.json", JSON.stringify(res));

res.polylines = res.polylines.map(function(line) {
	return line.filter(function(point, i) {
		return i % 4 === 0
	});
});

fs.writeFileSync("./泉州.polyline.1-4.json", JSON.stringify(res));


var attractions = map_data.districts[0].districts.map(function(attraction) {
	return {
		name: attraction.name,
		center: getPoint(attraction.center)
	}
})
fs.writeFileSync("./泉州.attractions.json", JSON.stringify(attractions));