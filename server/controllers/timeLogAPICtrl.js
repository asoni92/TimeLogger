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

	controller.processRequest = function(req, res, next) {
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
			// do the update operation
		} else if (option.toLowerCase() == 'logs') {
			// do the logs operation
		} else if (option.toLowerCase() == 'remove') {
			var code = data[2];
			console.log(code);
			if(code == null || code == '' || code.trim().length == 0) {
				return res.send(getErrorMessage('No Code Specified.'));
			} else {
				
			}
		} else if(option.toLowerCase() == 'help') { 
			return res.send(welcomeMsg);
		} else {
			return res.send(welcomeMsg);
		}
	};
	
	function getDescriptionFromRequest(data) {
		var description = null;
		if(data == null || data == '' || data.trim().length == 0) {
			return null;
		} else {
			data = data.trim();
			if(data.startsWith("‘") && data.endsWith("’")) {
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
				var temp = data.substring(0,data.lastIndexOf('m'));
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
	
	getSaveSuccessMsg = function(data, username) {
		var res = { "attachments" : [{
		 	"fallback" : "", "text" : "Record Successfully Created",
		 	"fields" : [{
		 		"title" : "User: "+username, "value" : "", "short" : false }, 
		 		{"title" : "Code: "+data.code, "value" : "", "short" : true},
		 		{"title" : "Time Log: "+moment.utc(data.time*1000).format('HH:mm:ss'), "value" : "", "short" : true},
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
				userId: 1,
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
	
	function deleteLog(req, res, code) {
		var now = moment().unix();
		try {
			schema.model('WorkLog').forge().where({
				code: code,
				active: 1
			}).fetch().then(function (result) {
				if (result) {
					result.save({
						active: 0,
						dateModified: 0
					}, {
						method: 'update',
						patch: true,
						require: false
					}).then(function (result) {
						
					}).catch(function (err) {
						
					})
				} else {
					return res.send(getErrorMessage('No entry found with the given code.'));
				}
			}).catch(function (err) {
				return res.send(getErrorMessage('Error is logging hours for your work.'));
			});
		} catch(ex) {
			return res.send(getErrorMessage('Error is logging hours for your work.'));
		}		
		
	}

	return controller;
}