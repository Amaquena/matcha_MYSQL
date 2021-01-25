let request = require("request");
let url = "https://geolocation-db.com/json";

module.exports = {
	getLocation: function (req, res, next) {
		request({
			url: url,
			json: true
		}, function (error, response, body) {
		
			if (!error && response.statusCode === 200) {
				res.locals.country = body.country_name;
				res.locals.city = body.city;
				res.locals.lat = body.latitude;
				res.locals.long = body.longitude;
				res.locals.province = body.state;
				next();
			}
		});
	}
};