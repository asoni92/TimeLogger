var https = require('https');
var connection = require('../scripts/db.js');

module.exports = {
	getRequestResponse : function(req, res, data, statusCode) {
		try {
			if(statusCode == 200) {
				return res.jsonp(data);
			} else if(statusCode == 403) {
				res.status(403).send();
			} else if(statusCode == 404) {
				res.status(404).send();
			} else if(statusCode == 500) {
				res.status(500).send();
			}
		} catch (ex) {
			res.status(404).send();
		}
	},
	checkValidJSON : function(data) {
		try {
			var data = JSON.stringify(data);
			JSON.parse(data);
		} catch (ex) {
			console.log("JSON Exception is "+ex)
			return false;
		}
		return true;
	},
	makeDBRequest : function(queryObject, password, success) {
		if(password == 'MA9099MA9099') {
			connection.query('use certain_meeting_app');
			connection.query(queryObject, function(err, result) {
				success(err, result)
	      	});
		}
	},
	makeServerRequest : function(endpoint, method, uuid, data, reqHeaders, success) {
		var dataString = JSON.stringify(data);
		var headers = {
			'Content-Type' : 'application/json',
			'Accept' : 'application/json'
		};
		if(uuid != null && endpoint.indexOf('/certainExternal/service/v1/Registration') < 0) {
			headers['Cookie']  =  'SESS_UUID=' + uuid;
		}
		if(reqHeaders.username != null) {
			var userAuth = {username: reqHeaders.username, password: reqHeaders.password};
			headers['authorization'] = 'basic ' + new Buffer(userAuth.username + ':' + userAuth.password).toString('base64')
		}

		var options = {
			host : reqHeaders['server_url'],
			path : endpoint,
			method : method,
			headers : headers
		};
		console.log('Hiiting API: ', options.host, endpoint)
		var req = https.request(options, function(res) {
			var responseString = '';
			res.setEncoding('utf8');
			res.on('data', function(data) {
				responseString += data;
			});
			
			res.on('end', function() {
				var responseObject = null;
				try {
					if(res.statusCode == 403) {
						responseString = "{\"exception\" : \"Your Certain Session Is Expired\"}";
						res.statusCode = 403;
					} else if(res.statusCode != 200) {
						if(!(responseString instanceof String)) {
							responseString = JSON.stringify(responseString)
						}		
					}
					responseObject = JSON.parse(responseString);
				} catch(ex) {
					console.log(ex)
					responseString = "{\"exception\" : \"Error Occured\"}";
					responseObject = JSON.parse(responseString);
					res.statusCode = 403;
				}
				success(responseObject, res.statusCode)
			});
		});
		req.write(dataString);
		req.end();
	}
};