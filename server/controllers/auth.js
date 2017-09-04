var schema = require('bookshelf').DB;
var Deferred = require('promised-io/promise').Deferred;
var async = require('async');
var _ = require('lodash');
var crypto = require('crypto');
var moment = require('moment-timezone');
var passport = require("passport");
var https = require('https');
var requestMaker = require("./commonRequest.js");
var encryptionService = require("../lib/EncryptionDecryption.js");
var logger = require('../lib/Logger.js').logger

module.exports = function (app) {
	var controller = {};

	controller.authenticate = function (req, res, next) {
		requestMaker.makeServerRequest('/svcs/user_authentication/checkineasy', 'POST', null, req.body, req.headers, function (data, statusCode) {
			if (data != null && data.authResponseDTO != null) {
				req.session.uuid = data.authResponseDTO.uuid;
				req.session.save();
				var sessionObj = {};
				sessionObj.username = req.body.username;
				sessionObj.password = encryptionService.encrypt(req.body.password);
				sessionObj.lasthit = (new Date()).getTime();
				sessionObj.active = true;
				sessionObj.uuid = data.authResponseDTO.uuid;
				sessionObj.portalId = req.headers.portal_id;
				schema.model('UserSession').forge().save(sessionObj).then(function (result) {
					schema.model('Event').forge().where({
						portalId: req.headers.portal_id,
						isDefault: true
					}).fetch().then(function (_event) {
						_event = _event.toJSON()
						if (_event) {
							console.log("------------------")
							data.eventCode = _event.eventCode;
							data.eventId = _event.eventId;
							data.accountCode = _event.accountCode;
							requestMaker.getRequestResponse(req, res, data, statusCode);
						} else {
							requestMaker.getRequestResponse(req, res, data, statusCode);
						}
					}).catch(function (err) {
						requestMaker.getRequestResponse(req, res, data, statusCode);
					})
				}).catch(function (err) {
					logger.error("Error occurred in authenticate API: ", err)
				})
			} else {
				res.status(404).send();
			}
		}, function () {
			res.status(404).send();
		});
	}

	controller.logout = function (req, res, next) {
		schema.model('UserSession').forge().where({
			uuid: req.headers.uuid,
			portalId: req.headers.portal_id,
			active: true
		}).fetch().then(function (data) {
			if (data) {
				var userSession = data.toJSON();
				userSession.active = 0;
				data.save(userSession, {
					method: 'update',
					patch: true
				}).then(function (result) {
					res.status(200).send();
				});
			} else {
				res.status(200).send();
			}
		}).catch(function (err) {
			logger.error("Error occurred in logout API: ", err)
		})
	}

	return controller;
}