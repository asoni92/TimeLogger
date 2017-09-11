var requestMaker = require("./commonRequest.js");
var commonUtils = require("../lib/CommonUtils.js");
var path = require('path');
var fs = require('fs');
var schema = require('bookshelf').DB;
var async = require('async');
var moment = require('moment');
var _ = require('lodash')
var logger = require('../lib/Logger.js').logger;
var config = require('../scripts/config.json')
var queryDebugMode = config.queryDebugMode;
var uniqid = require('uniqid');

module.exports = function(app) {
	var controller = {};

	var welcomeMsg = {
		"mrkdwn" : true,
		"attachments" : [
				{
					"fallback" : "",
					"text" : "",
					"fields" : [
							{
								"title" : "Get",
								"value" : "Syntax: --get --uniqueCode",
								"short" : false
							}, {
								"title" : "--get --XX1234'",
								"value" : "",
								"short" : true
							} ],
					"color" : "#4a4a4a"
				},
				{
					"fallback" : "",
					"text" : "",
					"fields" : [
							{
								"title" : "Add",
								"value" : "Syntax: --add --WorkTime(in hour, minutes or second(h/m/s)) --'Description'",
								"short" : false
							}, {
								"title" : "--add --5m --'Worked on CMMA App'",
								"value" : "",
								"short" : true
							} ],
					"color" : "good"
				},
				{
					"fallback" : "",
					"text" : "",
					"fields" : [
							{
								"title" : "Update",
								"value" : "Syntax: --update --uniqueCode --WorkTime(in hour, minutes or second(h/m/s)) --'Description'",
								"short" : false
							},
							{
								"title" : "--update --XX1234 --15m --'Worked on CMMA App Update'",
								"value" : "",
								"short" : false
							} ],
					"color" : "warning"
				},
				{
					"fallback" : "",
					"text" : "",
					"fields" : [ {
						"title" : "Remove",
						"value" : "Syntax: --remove --uniqueCode",
						"short" : false
					}, {
						"title" : "--remove --XX1234",
						"value" : "",
						"short" : false
					} ],
					"color" : "#F35A00"
				},
				{
					"fallback" : "",
					"text" : "",
					"fields" : [ {
						"title" : "Log History",
						"value" : "Syntax: --logs",
						"short" : false
					}, {
						"title" : "--logs",
						"value" : "This will show the last 7 days entries.",
						"short" : false
					} ],
					"color" : "#0a4cad"
				} ]
	}
	
	getErrorMessage = function(msg) {
		var errorMsg = {
				"mrkdwn" : true,
				"attachments" : [{ "fallback" : "",
							"text" : "Oops!!! Looks like your request is not correct. Try below command for more help",
							"fields" : [ {
								"title" : "/timelog --help",
								"value" : "",
								"short" : false
							},
							 {
								"title" : "",
								"value" : msg,
								"short" : false
							}],
							"color" : "danger"
						} ]
		}
		return errorMsg;
	}
	
	 
     
	controller.populateUserIdAndProcessRequest = function (req, res, next) {
	    console.log("Name is "+req.body.user_name)
		try {
	    	schema.model('User').forge().where({
				username: req.body.user_name,
				active: 1
			}).fetch().then(function (result) {
				if (result) {
					var userData = result.toJSON();
					req.headers.user_id = result.get('id');
					processRequest(req, res, next);
				} else {
					return res.send(getErrorMessage('Seems like you are not registered for this app.'));
				}
			}).catch(function (err) {
				console.log("-------")
				console.log(err)
				return res.send(getErrorMessage('Seems like you are not registered for this app.'));
			});
	    } catch(ex) {
	    	console.log(ex)
	    	return res.send(getErrorMessage('Seems like you are not registered for this app.'));
	    }     
	}

	processRequest = function(req, res, next) {
		console.log("---------------");
		console.log(req.body)
		var teamDomain = req.body.team_domain;
		var username = req.body.user_name;
		var command = req.body.text;
		if (command == null || command == '' || command.trim().length == 0) {
			return res.send(getErrorMessage('No Opertion Specified.'));
		}
		var data = command.split("--");
		if (data.length == 0) {
			return res.send(getErrorMessage('No Opertion Specified.'));
		}
		console.log()
		var option = data[1];
		option = option.trim();
		if (option.toLowerCase() == 'add') {
			var workLogTime = getTimeFromRequest(data[2]);
			var description = getDescriptionFromRequest(data[3])
			if(workLogTime == null) {
				return res.send(getErrorMessage('Invalid Time.'));
			}
			if(description == null) {
				return res.send(getErrorMessage('Invalid Description.'));
			}
			addLog(req, res, workLogTime,description,username);
		} else if (option.toLowerCase() == 'update') {
			var code = data[2];
			console.log(code);
			if(code == null || code == '' || code.trim().length == 0) {
				return res.send(getErrorMessage('No Code Specified.'));
			} else {
				var workLogTime = getTimeFromRequest(data[3]);
				console.log(workLogTime);
				var description = getDescriptionFromRequest(data[4])
				console.log(description)
				if(workLogTime == null) {
					return res.send(getErrorMessage('Invalid Time.'));
				}
				if(description == null) {
					return res.send(getErrorMessage('Invalid Description.'));
				}
				console.log("---Req---")
				console.log(req);
				updateLog(req, res, code, username, workLogTime, description, req.headers.user_id)
			}
		} else if (option.toLowerCase() == 'logs') {
			myTask(req, res, next, username);
		} else if (option.toLowerCase() == 'remove') {
			var code = data[2];
			console.log(code);
			if(code == null || code == '' || code.trim().length == 0) {
				return res.send(getErrorMessage('No Code Specified.'));
			} else {
				console.log("Inside Code");
				deleteLog(req, res, code);
			}
		} else if(option.toLowerCase() == 'help') { 
			return res.send(welcomeMsg);
		} else if(option.toLowerCase() == 'get') { 
			var code = data[2];
			if(code == null || code == '' || code.trim().length == 0) {
				return res.send(getErrorMessage('No Code Specified.'));
			} else {
				retrieveLog(req, res, code, username);
			}
		} else {
			return res.send(welcomeMsg);
		}
	};
	
	
	function myTask(req, res, next, username) {
		var response = { "attachments" : [{ "fallback" : "", "text" : "Following are your log enteries: ",
							"fields" : [ { "title" : "Total Logged Time: ", "value" : "", "short" : false}],
							"color" : "#2fb36d"
						} ]
		}
		schema.model('WorkLog').forge().where({
			userId: req.headers.user_id,
			active: 1
		}).fetchAll().then(function (data) {
			if (data == null || data.length == 0) {
				return res.send(getErrorMessage('No logs found.'));
			} else {
				var msg = "";
				var totalTime = 0;
				async.mapSeries(data.toJSON(), function (log, cb) {
					msg = msg + "User: "+username+"     Code: "+log.code+"     Logged Time: "+secondsToHMS(log.time)+"     Description: "+log.description+"\n";
					totalTime = totalTime + parseFloat(log.time);
					console.log(totalTime);
					cb();
				}, function (err, result) {
					response.attachments[0].fields[0].value = secondsToHMS(totalTime);
					var tmp = { "title" : "", "value" : msg, "short" : true };
					response.attachments[0].fields.push(tmp);
					return res.send(response);
				})
			}
		}).catch(function (err) {
			console.log("Error Occured");
		})
	}
	
	function secondsToHMS(d) {
	    d = Number(d);
	    var h = Math.floor(d / 3600);
	    var m = Math.floor(d % 3600 / 60);
	    var s = Math.floor(d % 3600 % 60);

	    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
	    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
	    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
	    return hDisplay + mDisplay + sDisplay; 
	}
	
	function retrieveLog(req, res, code, username) {
		var now = moment().unix();
		try {
			schema.model('WorkLog').forge().where({
				code: code,
				active: 1
			}).fetch().then(function (result) {
				if (result) {
					var tmp = result.toJSON();
					var successMsg = getEntity(tmp, username);
					return res.send(successMsg);
				} else {
					return res.send(getErrorMessage('No entry found with the given code.'));
				}
			}).catch(function (err) {
				return res.send(getErrorMessage('Error occurred while geeting data for given record.'));
			});
		} catch(ex) {
			return res.send(getErrorMessage('Error occurred while geeting data for given record.'));
		}
	}
	
	function getDescriptionFromRequest(data) {
		var description = null;
		if(data == null || data == '' || data.trim().length == 0) {
			return null;
		} else {
			data = data.trim();
			console.log("-------------------------------->"+data)
			if((data.startsWith("‘") && data.endsWith("’"))  || (data.startsWith("'") && data.endsWith("'"))) {
				description = data.substring(1, data.length - 1);
			}
			return description;
		}
	}
	
	function getTimeFromRequest(data) {
		try {
		var time = null;
		if(data == null || data == '' || data.trim().length == 0) {
			return null;
		} else {
			data = data.trim();
			if(data.toLowerCase().endsWith('h')) {
				var temp = data.substring(0,data.lastIndexOf('h'));
			    if(temp == null || temp == '' || isNaN(temp)) {
			    	// Invalid time
			    	return time;
			    } else {
			    	temp = parseFloat(temp);
			    	time = temp * 60 * 60;
			    }
			} else if(data.toLowerCase().endsWith('m')) {
				var temp = data.substring(0,data.lastIndexOf('m'));
			    if(temp == null || temp == '' || isNaN(temp)) {
			    	// Invalid time
			    	return time;
			    } else {
			    	temp = parseFloat(temp);
			    	time = temp * 60;
			    }
			} else if(data.toLowerCase().endsWith('s')) {
				var temp = data.substring(0,data.lastIndexOf('s'));
			    if(temp == null || temp == '' || isNaN(temp)) {
			    	// Invalid time
			    	return time;
			    } else {
			    	temp = parseFloat(temp);
			    	time = temp;
			    }
			}  
			return time;
		}
		} catch(Ex) {
			console.log(Ex)
		}
	}
	
	getEntity = function(data, username) {
		var res = { "attachments" : [{
		 	"fallback" : "", "text" : "Following record found with given code: ",
		 	"fields" : [{
		 		"title" : "User: "+username, "value" : "", "short" : false }, 
		 		{"title" : "Code: "+data.code, "value" : "", "short" : true},
		 		{"title" : "Time Logged: "+moment.utc(data.time*1000).format('HH:mm:ss'), "value" : "", "short" : true},
		 		{"title" : "Description: "+data.description, "value" : "", "short" : false},
		 		], "color" : "good"
		 }] };
		return res;
	}
	
	getSaveSuccessMsg = function(data, username) {
		var res = { "attachments" : [{
		 	"fallback" : "", "text" : "Record Successfully Created.",
		 	"fields" : [{
		 		"title" : "User: "+username, "value" : "", "short" : false }, 
		 		{"title" : "Code: "+data.code, "value" : "", "short" : true},
		 		{"title" : "Time Logged: "+moment.utc(data.time*1000).format('HH:mm:ss'), "value" : "", "short" : true},
		 		{"title" : "Description: "+data.description, "value" : "", "short" : false},
		 		], "color" : "good"
		 }] };
		return res;
	}
	
	getUpdateSuccessMsg = function(data, username) {
		var res = { "attachments" : [{
		 	"fallback" : "", "text" : "Record Successfully Updated.",
		 	"fields" : [{
		 		"title" : "User: "+username, "value" : "", "short" : false }, 
		 		{"title" : "Code: "+data.code, "value" : "", "short" : true},
		 		{"title" : "Time Logged: "+moment.utc(data.time*1000).format('HH:mm:ss'), "value" : "", "short" : true},
		 		{"title" : "Description: "+data.description, "value" : "", "short" : false},
		 		], "color" : "good"
		 }] };
		return res;
	}
	
	getRemoveSuccessMsg = function(data) {
		var res = { "attachments" : [{
		 	"fallback" : "", "text" : "Record Successfully Deleted",
		 	"fields" : [
		 	    {"title" : "Code: "+data.code, "value" : "", "short" : true},
		 		{"title" : "Time Logged: "+moment.utc(data.time*1000).format('HH:mm:ss'), "value" : "", "short" : true},
		 		{"title" : "Description: "+data.description, "value" : "", "short" : false},
		 		], "color" : "good"
		 }] };
		return res;
	}
	
	function addLog(req, res, workLogTime, description, username) {
		try {
		var now = moment().unix();
		var _workLog = {
				code: uniqid(),
				userId: req.headers.user_id,
				time: workLogTime,
				dateCreated: now,
				dateModified: now,
				active: true,
				description: description
			}
			schema.model('WorkLog').forge().save(_workLog).then(function (savedWork) {
				var loggedWork = savedWork.toJSON();
				var successMsg = getSaveSuccessMsg(loggedWork, username);
				return res.send(successMsg);
			}).catch(function (err) {
				return res.send(getErrorMessage('Error is logging hours for your work.'));
			});
		} catch(ex) {
			return res.send(getErrorMessage('Error is logging hours for your work.'));
		}
	}
	
	function updateLog(request, res, code, username, time, description, userId) {
		console.log(userId)
		var now = moment().unix();
		try {
			schema.model('WorkLog').forge().where({
				code: code,
				active: 1
			}).fetch().then(function (result) {
				console.log("-----------------------")
				console.log(result)
				if (result) {
					var tmp = result.toJSON();
					console.log(req)
					if(tmp.userId != userId) {
						return res.send(getErrorMessage('You are not authorised to update this entry.'));
					}
					var req = {dateModified: now};
					if(time != null) {
						req.time = time;
					}
					if(description != null) {
						req.description = description;
					}
					result.save(req, {
						method: 'update',
						patch: true,
						require: false
					}).then(function (result) {
						var updatedWork = result.toJSON();
						var successMsg = getUpdateSuccessMsg(updatedWork, username);
						return res.send(successMsg);
					}).catch(function (err) {
						console.log(err)
						return res.send(getErrorMessage('Error occurred in deleting the work log entry.'));
					})
				} else {
					return res.send(getErrorMessage('No entry found with the given code.'));
				}
			}).catch(function (err) {
				console.log("--------------------------")
				console.log(err)
				return res.send(getErrorMessage('Error occurred in deleting the work log entry.'));
			});
		} catch(ex) {
			console.log(ex);
			return res.send(getErrorMessage('Error occurred in deleting the work log entry.'));
		}		
		
	}
	
	function deleteLog(req, res, code) {
		var now = moment().unix();
		try {
			schema.model('WorkLog').forge().where({
				code: code,
				active: 1
			}).fetch().then(function (result) {
				console.log("-----------------------")
				console.log(result)
				if (result) {
					var tmp = result.toJSON();
					if(tmp.userId != req.headers.user_id) {
						return res.send(getErrorMessage('You are not authorised to update this entry.'));
					}
					result.save({
						active: 0,
						dateModified: now
					}, {
						method: 'update',
						patch: true,
						require: false
					}).then(function (result) {
						var removedWork = result.toJSON();
						var successMsg = getRemoveSuccessMsg(removedWork);
						return res.send(successMsg);
					}).catch(function (err) {
						return res.send(getErrorMessage('Error occurred in deleting the work log entry.'));
					})
				} else {
					return res.send(getErrorMessage('No entry found with the given code.'));
				}
			}).catch(function (err) {
				return res.send(getErrorMessage('Error occurred in deleting the work log entry.'));
			});
		} catch(ex) {
			return res.send(getErrorMessage('Error occurred in deleting the work log entry.'));
		}		
		
	}

	return controller;
}