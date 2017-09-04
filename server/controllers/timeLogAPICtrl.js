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

module.exports = function (app) {
	var controller = {};

	controller.processRequest = function (req, res, next) {
		console.log("---------------");
		console.log(req.body)
		var teamDomain = req.body.team_domain;
		var username = req.body.user_name;
		var command = req.body.text;
		if(command == null || command == '' || command.trim().length == 0) {
			//Handle the unwanted exception
			console.log("---------If--------------")
			return res.send("No Data Found");
		} else {
			console.log("---------Else--------------")
			return res.send("You send ", command);
		}
		console.log("---------If/Else end--------------")
		var code = null;
		var description = null;
		var option = null;
		var descriptionIndex = command.indexOf("'");
		if(descriptionIndex > 0) {
			description = command.substring(descriptionIndex+1, command.lastIndexOf("'"));
			var remainingString = command.substring(0,descriptionIndex);
			var data = remainingString.split(" ");
			console.log(data);
		} else {
			
		}
	};


	return controller;
}