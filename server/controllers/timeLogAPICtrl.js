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
								"title" : "--add --5m 'Worked on CMMA App'",
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
								"title" : "--update --XX1234 --15m 'Worked on CMMA App Update'",
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

	controller.processRequest = function(req, res, next) {
		console.log("---------------");
		console.log(req.body)
		var teamDomain = req.body.team_domain;
		var username = req.body.user_name;
		var command = req.body.text;
		if (command == null || command == '' || command.trim().length == 0) {
			//Handle the unwanted exception
			console.log("---------If--------------")
			return res.send(welcomeMsg);
		}
		var code = null;
		var description = null;
		var option = null;
		var descriptionIndex = command.indexOf("'");
		var data = command.split("--");
		console.log(data);
		if (data.length == 0) {
			//Handle the error
		}
		console.log('--['+data[1]+']--')
		if (data[1].toLowerCase() == 'add') {
			// Do the add operation
			console.log('Add operation Called')
			addLog(req, res, next);
		} else if (data[1].toLowerCase() == 'update') {
			//do the update operation 
		} else if (data[1].toLowerCase() == 'logs') {
			//do the logs operation
		} else if (data[1].toLowerCase() == 'remove') {
			// do the remove operation
		}
		return res.send(command);
	};
	
	function addLog(req, res, next) {
		try {
		var now = moment().unix();
		var _workLog = {
				code: '1234',
				userId: 1,
				time: 10,
				dateCreated: now,
				dateModified: now,
				active: true
			}
			schema.model('WorkLog').forge().save(_workLog).then(function (savedWork) {
				
			}).catch(function (err) {
				console.log("----Error---")
				comnsole.log(err)
				return res.status(500).send();
			});
		} catch(ex) {
			console.log(ex)
		}
	}

	return controller;
}