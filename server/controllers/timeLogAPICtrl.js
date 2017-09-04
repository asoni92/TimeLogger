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
		console.log(req);
		console.log(req.body)
		if(req.body == null || req.body == '' || req.body.trim().length == 0) {
			//Handle the unwanted exception
			res.send("No Data Found");
			return;
		}
		var command = req.body;
		var username = null;
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