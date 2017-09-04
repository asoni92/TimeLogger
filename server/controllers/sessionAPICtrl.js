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
var svn_update = require('../scripts/SVN.js');
var queryDebugMode = config.queryDebugMode;

module.exports = function (app) {
	var controller = {};

	var now = moment().unix();

	controller.getEventsByPortalId = function (req, res, next) {
		schema.model('Event').forge().where({
			portalId: req.headers.portal_id
		}).fetchAll().then(function (data) {
			if (data == null) {
				data = [];
			}
			return res.jsonp(data.toJSON())
		}).catch(function (err) {
			logger.error('Error occurred in getEventsByPortalId API: ', err)
			return res.status(500).send();
		})
	};

	controller.getLocationByEventId = function (req, res, next) {
		schema.model('SessionLocation').forge().where({
			eventId: req.query.eventId,
			portalId: req.headers.portal_id,
			active: 1
		}).query(function (qb) {
			qb.debug(queryDebugMode)
		}).orderBy('venue', 'ASC').fetchAll().then(function (data) {
			var locations = {
				data: []
			};
			if (data) {
				async.mapSeries(data.toJSON(), function (location, cb) {
					var _location = {
						id: location.locationId,
						eventId: location.eventId,
						name: location.locationName,
						title: location.locationName,
						venue: location.venue,
						capacity: location.capacity,
						active: location.active,
						locationCode: location.locationCode
					}
					locations.data.push(_location);
					cb();
				}, function (err, result) {
					return res.jsonp(locations)
				})
			} else {
				return res.jsonp(locations)
			}
		}).catch(function (err) {
			logger.error('Error occurred in getLocationByEventId API: ', err)
			return res.status(500).send();
		});
	}

	controller.getSessionById = function (req, res, next) {
		schema.model('Session').forge().where({
			eventId: req.query.eventId,
			portalId: req.headers.portal_id,
			id: req.query.sessionId
		}).query(function (qb) {
			qb.debug(queryDebugMode)
		}).fetch().then(function (sesion) {
			if (sesion == null) {
				sesion = {}
			}
			return res.jsonp(sesion.toJSON());
		}).catch(function (err) {
			logger.error('Error occurred in getSessionById API: ', err)
			return res.status(500).send();
		});
	}

	controller.getSessionsInstanceByRegCode = function (req, res, next) {
		if (req.query.regCode == null || req.query.regCode == '') {
			return res.status(404).send("You are looking up without selecting any registration.")
		} else {
			schema.model('RegistrationSession').forge().query(function (qb) {
				qb.join('session', function () {
						this.on('session.id', '=', 'registration_session.sessionId').onIn('session.eventId', [req.query.eventId]).onIn('session.portalId', [req.headers.portal_id])
					})
					.join('session_location', function () {
						this.on('session.locationCode', '=', 'session_location.locationCode').onIn('session_location.eventId', [req.query.eventId]).onIn('session_location.portalId', [req.headers.portal_id])
					})
					.column('registration_session.*', 'session.sessionTitle', 'session.instanceId', 'session_location.locationCode', 'session_location.locationName', 'session_location.venue')
					.where({
						'registration_session.eventCode': req.query.eventCode,
						'registration_session.accountCode': req.query.accountCode,
						'registration_session.portalId': req.headers.portal_id,
						'registration_session.registrationCode': req.query.regCode,
						'registration_session.isPublished': 1
					}).debug(queryDebugMode)
			}).fetchAll().then(function (regs) {
				if (regs == null) {
					regs = []
				}
				return res.jsonp(regs.toJSON())
			}).catch(function (err) {
				logger.error('Error occurred in getSessionsInstanceByRegCode API: ', err)
				return res.status(500).send();
			});
		}
	}

	controller.getSessionStatuses = function (req, res, next) {
		requestMaker
			.makeServerRequest('/svcs/registration_session_statuses',
				'GET', req.session.uuid, {}, req.headers,
				function (
					data, statusCode) {
					requestMaker.getRequestResponse(req, res, data,
						statusCode);
				});
	}


	controller.getSessionTypes = function (req, res, next) {
		schema.model('SessionType').forge().where({
			eventId: req.query.eventId,
			portalId: req.headers.portal_id
		}).query(function (qb) {
			qb.debug(queryDebugMode)
		}).orderBy('sessionType').fetchAll().then(function (sessionType) {
			if (sessionType == null) {
				sessionType = []
			}
			return res.jsonp(sessionType.toJSON());
		}).catch(function (err) {
			logger.error('Error occurred in  API: ', err)
			return res.status(500).send();
		});
	}

	controller.createNewRegistration = function (req, res, next) {
		if (req.body.registrationCode != null && req.body.registrationCode != '') {
			regUrl = '/certainExternal/service/v1/Registration/' + req.body.accountCode + '/' + req.body.eventCode + '/' + req.body.registrationCode;
			profileUrl = '/certainExternal/service/v1/Profile/' + req.body.accountCode + '/' + req.body.profile.pin;

			var profileObj = {};
			profileObj.firstName = req.body.profile.firstName;
			profileObj.lastName = req.body.profile.lastName;
			if (req.body.profile.organization != null) {
				profileObj.organization = req.body.profile.organization;
			}
			if (req.body.profile.email != null) {
				profileObj.email = req.body.profile.email;
			}
			if (req.body.profile.position != null) {
				profileObj.position = req.body.profile.position;
			}
			if (req.body.profile.phone != null) {
				profileObj.phone = req.body.profile.phone;
			}
			if (req.body.profile.phoneMobile != null) {
				profileObj.phoneMobile = req.body.profile.phoneMobile;
			}
			if (req.body.profile != null && req.body.profile.profileQuestions != null) {
				profileObj.profileQuestions = req.body.profile.profileQuestions;
			}
			requestMaker.makeServerRequest(profileUrl, 'POST', req.session.uuid, profileObj, req.headers,
				function (data, statusCode) {
					if (statusCode == 200) {
						reqObj = req.body;
						reqObj.isConfirmed = true; //To mark the registrant as Completed
						requestMaker.makeServerRequest(regUrl, 'POST', req.session.uuid, reqObj, req.headers,
							function (data, statusCode) {
								if (statusCode == 200 && data) {
									var registration = {
										dateModified: moment(data.dateModified).unix(),
										dateCreated: moment(data.dateCreated).unix(),
										registrationCode: data.registrationCode,
										isActive: data.isActive,
										eventCode: data.eventCode,
										accountCode: data.accountCode,
										attendeeTypeCode: data.attendeeTypeCode ? data.attendeeTypeCode : '',
										registrationStatusLabel: data.registrationStatusLabel,
										firstName: data.profile ? data.profile.firstName : '',
										lastName: data.profile ? data.profile.lastName : '',
										pin: data.profile ? data.profile.pin : '',
										email: data.profile ? data.profile.email : '',
										position: data.profile ? data.profile.position : '',
										organization: data.profile ? data.profile.organization : '',
										mobile: data.profile ? data.profile.phoneMobile : '',
										portalId: req.headers.portal_id,
										isLocalModified: 0,
										localDateModified: null,
										syncDate: null
									}
									schema.model('Registration').forge().where({
										eventCode: req.body.eventCode,
										accountCode: req.body.accountCode,
										portalId: req.headers.portal_id,
										registrationCode: registration.registrationCode
									}).query(function (qb) {
										qb.debug(queryDebugMode)
									}).fetch().then(function (reg) {
										if (reg) {
											reg.save(registration, {
												method: 'update',
												patch: true
											}).then(function (result) {
												registration.registrationQuestions = req.body.registrationQuestions;
												registration.profileQuestions = req.body.profile.profileQuestions;
												saveRegistrationAnswers(registration, function (err, response) {
													return res.jsonp({
														"registrationDTO": registration
													});
												})
											}).catch(function (err) {
												logger.error("Error occurred in createNewRegistration API while updating registration for regCode: ", registration.registrationCode, "\\Error Message: ", err)
												return res.status(500).send()

											})
										} else {
											schema.model('Registration').forge().save(registration).then(function (result) {
												registration.registrationQuestions = req.body.registrationQuestions;
												registration.profileQuestions = req.body.profile.profileQuestions;
												saveRegistrationAnswers(registration, function (err, response) {
													return res.jsonp({
														"registrationDTO": registration
													});
												})
											}).catch(function (err) {
												logger.error("Error occurred in createNewRegistraion API while saving registration for regCode: ", registration.registrationCode, "\\Error Message: ", err)
												return res.status(500).send()
											})
										}
									}).catch(function (err) {
										logger.error("Error occurred in createNewRegistration API while fetching registration for regCode: ", registration.registrationCode, "\\Error Message: ", err)
										return res.status(500).send()
									})
								} else {
									logger.error("Error occurred while creating registration on certainApp: " + statusCode + JSON.stringify(data))
									return res.status(404).send("Error occured while creating meeting.")
								}
							})
					} else {
						logger.error("Error occurred while updating profile on certainApp: " + statusCode + JSON.stringify(data))
						return res.status(404).send("Unable to save registration");
					}
				})
		} else {
			regUrl = '/certainExternal/service/v1/Registration/' + req.body.accountCode + '/' + req.body.eventCode
			reqObj = req.body;
			reqObj.isConfirmed = true; //To mark the registrant as Completed
			requestMaker.makeServerRequest(regUrl, 'POST', req.session.uuid, reqObj, req.headers,
				function (data, statusCode) {
					if (statusCode == 200 && data) {
						var registration = {
							dateModified: moment(data.dateModified).unix(),
							dateCreated: moment(data.dateCreated).unix(),
							registrationCode: data.registrationCode,
							isActive: data.isActive,
							eventCode: data.eventCode,
							accountCode: data.accountCode,
							attendeeTypeCode: data.attendeeTypeCode ? data.attendeeTypeCode : '',
							registrationStatusLabel: data.registrationStatusLabel,
							firstName: data.profile ? data.profile.firstName : '',
							lastName: data.profile ? data.profile.lastName : '',
							pin: data.profile ? data.profile.pin : '',
							email: data.profile ? data.profile.email : '',
							position: data.profile ? data.profile.position : '',
							organization: data.profile ? data.profile.organization : '',
							mobile: data.profile ? data.profile.phoneMobile : '',
							portalId: req.headers.portal_id,
							isLocalModified: 0,
							localDateModified: null,
							syncDate: null
						}
						schema.model('Registration').forge().where({
							registrationCode: registration.registrationCode,
							portalId: req.headers.portal_id,
							eventCode: req.body.eventCode,
							accountCode: req.body.accountCode
						}).query(function (qb) {
							qb.debug(queryDebugMode)
						}).fetch().then(function (reg) {
							if (reg) {
								reg.save(registration, {
									method: 'update',
									patch: true
								}).then(function (result) {
									registration.registrationQuestions = req.body.registrationQuestions;
									registration.profileQuestions = req.body.profile.profileQuestions;
									saveRegistrationAnswers(registration, function (err, response) {
										return res.jsonp({
											"registrationDTO": registration
										});
									})
								}).catch(function (err) {
									logger.error("Error occurred in createNewRegistration API while updating registration on localDB for regCode: ", registration.registrationCode, "\\Error Message: ", err)
									return res.status(500).send()
								})
							} else {
								schema.model('Registration').forge().save(registration).then(function (result) {
									registration.registrationQuestions = req.body.registrationQuestions;
									registration.profileQuestions = req.body.profile.profileQuestions;
									saveRegistrationAnswers(registration, function (err, response) {
										return res.jsonp({
											"registrationDTO": registration
										});
									})
								}).catch(function (err) {
									logger.error("Error occurred in createNewRegistration API while saving registration on localDB for regCode: ", registration.registrationCode, "\\Error Message: ", err)
									return res.status(500).send()
								})
							}
						}).catch(function (err) {
							logger.error("Error occurred in createNewRegistration API while fetching registration on localDB for regCode: ", registration.registrationCode, "\\Error Message: ", err)
							return res.status(500).send()
						})
					} else {
						return res.status(404).send("Unable to save registration");
					}
				})
		}

		function saveRegistrationAnswers(registration, callback) {
			schema.model('RegistrationAnswer').forge().query(function (qb) {
				qb.where({
					eventCode: req.body.eventCode,
					accountCode: req.body.accountCode,
					portalId: req.headers.portal_id,
					registrationCode: registration.registrationCode
				}).del().then(function (deletedRegAnswer) {
					async.parallel([
						function (callback1) {
							if (registration.registrationQuestions) {
								async.mapSeries(registration.registrationQuestions.question, function (regQues, cb) {
									var answers = [];
									if (regQues.questionField == 'Text' || regQues.questionField == 'Textarea') {
										async.mapSeries(regQues.answers.answer, function (ans, cb1) {
											var _ans = {
												answerId: ans.answerId,
												answerCode: ans.answerCode,
												value: ans.value,
												questionId: regQues.questionId,
												registrationCode: registration.registrationCode,
												eventCode: registration.eventCode,
												accountCode: registration.accountCode,
												portalId: req.headers.portal_id,
												syncDate: null
											}
											schema.model('RegistrationAnswer').forge().save(_ans).then(function (savedAns) {
												cb1(null, savedAns)
											}).catch(function (err) {
												logger.error("Error occurred in createNewRegistraion while saving registrationAnswers (For Text/TextArea): " + err)
											})
										}, function (err, response1) {
											if (err) cb(err, null);
											else cb(null, response1[0]);
										})
									} else {
										async.mapSeries(regQues.answers.answer, function (ans, cb1) {
											var answers = ans.value.split(',');
											async.mapSeries(answers, function (ans1, cb2) {
												if (ans1 == null || ans1 == '') {
													cb2(null, null)
												} else {
													var _ans = {
														answerId: ans.answerId,
														answerCode: ans1,
														value: null,
														questionId: regQues.questionId,
														registrationCode: registration.registrationCode,
														eventCode: registration.eventCode,
														accountCode: registration.accountCode,
														portalId: req.headers.portal_id,
														syncDate: null
													}
													schema.model('RegistrationAnswer').forge().save(_ans).then(function (savedAns) {
														cb2(null, savedAns.toJSON())
													}).catch(function (err) {
														logger.error("Error occurred in createNewRegistraion while saving registrationAnswers (For Comma seperated values): " + err)
													})
												}
											}, function (err, response2) {
												if (err) cb1(err, null);
												else cb1(null, response2)
											})
										}, function (err, response1) {
											if (err) cb(err, null);
											else cb(null, response1[0]);
										})
									}
								}, function (err, response) {
									if (registration.registrationQuestions) delete registration.registrationQuestions
									if (err) callback1(err, null);
									else callback1(null, registration)
								})
							} else {
								callback1(null, registration)
							}
						},
						function (callback2) {
							if (registration.profileQuestions) {
								async.mapSeries(registration.profileQuestions.question, function (regQues, cb) {
									var answers = [];
									if (regQues.questionField == 'Text' || regQues.questionField == 'Textarea') {
										async.mapSeries(regQues.answers.answer, function (ans, cb1) {
											var _ans = {
												answerId: ans.answerId,
												answerCode: ans.answerCode,
												value: ans.value,
												questionId: regQues.questionId,
												registrationCode: registration.registrationCode,
												eventCode: registration.eventCode,
												accountCode: registration.accountCode,
												portalId: req.headers.portal_id,
												syncDate: null
											}
											schema.model('RegistrationAnswer').forge().save(_ans).then(function (savedAns) {
												cb1(null, savedAns)
											}).catch(function (err) {
												logger.error("Error occurred in createNewRegistraion while saving profileAnswers (For Text/TextArea): " + err)
											})
										}, function (err, response1) {
											if (err) cb(err, null);
											else cb(null, response1[0]);
										})
									} else {
										async.mapSeries(regQues.answers.answer, function (ans, cb1) {
											var answers = ans.value.split(',');
											async.mapSeries(answers, function (ans1, cb2) {
												if (ans1 == null || ans1 == '') {
													cb2(null, null)
												} else {
													var _ans = {
														answerId: ans.answerId,
														answerCode: ans1,
														value: null,
														questionId: regQues.questionId,
														registrationCode: registration.registrationCode,
														eventCode: registration.eventCode,
														accountCode: registration.accountCode,
														portalId: req.headers.portal_id,
														syncDate: null
													}
													schema.model('RegistrationAnswer').forge().save(_ans).then(function (savedAns) {
														cb2(null, savedAns.toJSON())
													}).catch(function (err) {
														logger.error("Error occurred in createNewRegistraion while saving profileAnswers (For Comma seperated values): " + err)
													})
												}
											}, function (err, response2) {
												if (err) cb1(err, null);
												else cb1(null, response2)
											})
										}, function (err, response1) {
											if (err) cb(err, null);
											else cb(null, response1[0]);
										})
									}
								}, function (err, response) {
									if (registration.profileQuestions) delete registration.profileQuestions
									if (err) callback2(err, null);
									else callback2(null, registration)
								})
							} else {
								callback2(null, registration)
							}
						}
					], function (err, response) {
						callback(null, registration)
					})
				}).catch(function (err) {
					res.status(404).send("Error occured while deleting meeting." + err)
				})
			})
		}
	}

	controller.updateSessionStatusOfRegistration = function (req, res, next) {
		schema.model('RegistrationSession').forge().where({
			eventCode: req.body.eventCode,
			accountCode: req.body.accountCode,
			portalId: req.headers.portal_id,
			registrationCode: req.body.regCode
		}).fetch().then(function (regSession) {
			if (regSession) {
				if (regSession.registrationSessionStatus == req.body.status) {
					return res.jsonp(regSession.toJSON())
				} else {
					regSession.save({
						registrationSessionStatus: req.body.status
					}, {
						method: 'update',
						patch: true
					}).then(function (results) {
						return res.jsonp(results.toJSON())
					}).catch(function (err) {
						logger.error('Error occurred in updateSessionStatusOfRegistration API while updating data: ', err)
						return res.status(500).send()
					});
				}
			} else {
				return res.status(404).send("No Registration found for regCode: ", req.body.regCode)
			}
		}).catch(function (err) {
			logger.error('Error occurred in updateSessionStatusOfRegistration API while fetching data: ', err)
			return res.status(500).send()
		});
	}

	controller.updateSessionStatusBySessionId = function (req, res, next) {
		schema.model('RegistrationSession').forge().where({
			eventCode: req.body.eventCode,
			accountCode: req.body.accountCode,
			portalId: req.headers.portal_id,
			sessionId: req.body.sessionId
		}).fetchAll().then(function (regSessions) {
			if (regSessions == null) {
				regSessions = []
			}
			async.mapSeries(regSessions.toJSON(), function (regSession, cb) {
				schema.model('RegistrationSession').forge().where({
					eventCode: req.body.eventCode,
					accountCode: req.body.accountCode,
					portalId: req.headers.portal_id,
					registrationCode: regSession.registrationCode
				}).fetch().then(function (regSess) {
					if (regSess == null) {
						regSessObj = {}
						cb(null, regSessObj)
					} else {
						regSessObj = regSess.toJSON()
						if (regSessObj.registrationSessionStatus == req.body.status) cb(null, regSessObj)
						else {
							regSess.save({
								registrationSessionStatus: req.body.status
							}, {
								method: 'update',
								patch: true
							}).then(function (results) {
								cb(null, results.toJSON())
							}).catch(function (err) {
								logger.error('Error occurred in updateSessionStatusBySessionId API while updating data: ', err)
								cb(err, null)
							});
						}
					}
				}).catch(function (err) {
					logger.error('Error occurred in updateSessionStatusBySessionId API while fetching single regSession data: ', err)
					return res.status(500).send()
				});
			}, function (err, response) {
				if (err) {
					logger.error("Error occurred in updateSessionStatusBySessionId: ", err)
					return res.status(500).send()
				} else {
					return res.jsonp(response)
				}
			})
		}).catch(function (err) {
			logger.error('Error occurred in updateSessionStatusBySessionId API while fetching data: ', err)
			return res.status(500).send()
		});
	}

	controller.getQuestions = function (req, res, next) {
		console.log('session uuid: ', req.session.uuid)
		requestMaker
			.makeServerRequest(
				'/svcs/questions?active=true&eventId=' +
				req.query.eventId +
				'&limit=-1&questionTypeIds=1&questionTypeIds=2&questionTypeIds=4&questionTypeIds=5&questionTypeIds=6&questionTypeIds=7&registrationType=true',
				'GET', req.session.uuid, {}, req.headers,
				function (
					data, statusCode) {
					requestMaker.getRequestResponse(req, res, data,
						statusCode);
				});
	}

	controller.bulkRegistrationUnassignToSession = function (req, res, next) {
		requestMaker
			.makeServerRequest(
				'/svcs/registrations/unassign_bulk_registration_conference_session_instances/' +
				req.body.instanceId + '?accountId=' +
				req.body.accountId + '&eventId=' +
				req.body.eventId + '&userId=' +
				req.body.userId, 'POST', req.session.uuid,
				req.body.regIds, req.headers,
				function (data, statusCode) {
					requestMaker.getRequestResponse(req, res, data,
						statusCode);
				});
	}

	controller.bulkRegistrationAssignToSession = function (req, res, next) {
		console.log('Req Body of Bulk reg assign: ', req.body);
		requestMaker
			.makeServerRequest(
				'/svcs/registrations/assign_bulk_registration_conference_session_instances/' +
				req.body.instanceId + '?accountId=' +
				req.body.accountId + '&eventId=' +
				req.body.eventId + '&userId=' +
				req.body.userId, 'POST', req.session.uuid,
				req.body.regIds, req.headers,
				function (data, statusCode) {
					requestMaker.getRequestResponse(req, res, data,
						statusCode);
				});
	}

	controller.publishSessionForAll = function (req, res, next) {
		console.log(req.body.types)
		requestMaker
			.makeServerRequest('/svcs/conference_sessions/' +
				req.body.instanceId + '/publish_attendee_type',
				'POST', req.session.uuid, req.body.types, req.headers,
				function (data, statusCode) {
					requestMaker.getRequestResponse(req, res, data,
						statusCode);
				});
	}

	controller.getRegistrationByFilter = function (req, res, next) {
		if (req.query.isBulkMode) {
			var queryData = [req.query.bulkNames, req.query.eventCode, req.query.accountCode, req.headers.portal_id, req.query.eventId, req.headers.portal_id];
			var query = 'concat_ws(" ",firstName,lastName) in (?) and eventCode= ? and accountCode = ? and portalId = ? and isActive = 1 and attendeeTypeCode in ' +
				'(select code from attendee_type where eventId = ? and portalId= ? and active = 1 and isAllowed = 1)';
			schema.model('Registration').forge().query(function (qb) {
				qb.whereRaw(query, queryData)
					.debug(queryDebugMode)
			}).fetchAll().then(function (result) {
				if (result == null) {
					result = [];
				}
				return res.jsonp({
					"data": result.toJSON()
				});
			}).catch(function (err) {
				logger.error('Error occurred in getRegistrationByFilter API while doing bulk search : ', err)
				return res.status(500).send();
			});
		} else {
			/* --------- Create Query Object -------------*/
			var queryData = [req.query.eventCode, req.query.accountCode, req.headers.portal_id, req.query.eventId, req.headers.portal_id];
			var query = "eventCode= ? and accountCode = ? and portalId = ? and isActive = 1 and attendeeTypeCode in " +
				"(select code from attendee_type where eventId = ? and portalId= ? and active = 1 and isAllowed = 1) and (";
			if (req.query.searchTerm != null) {
				var searchTerm = JSON.parse(req.query.searchTerm);
				if (searchTerm.firstName != null && searchTerm.firstName != '') {
					query = query + "firstName like ? and";
					queryData.push(searchTerm.firstName + '%')
				}
				if (searchTerm.lastName != null && searchTerm.lastName != '') {
					query = query + " lastName like ? and";
					queryData.push(searchTerm.lastName + '%')
				}
				if (searchTerm.organization != null && searchTerm.organization != '') {
					query = query + " organization like ? ";
					queryData.push(searchTerm.organization + '%')
				}
				if (query.endsWith("and")) {
					query = query.substring(0, query.lastIndexOf("and"));
				}
				if (query.endsWith(" and (")) {
					query = query.substring(0, query.lastIndexOf("and"));
				} else {
					query = query + ")";
				}
				if (searchTerm.regCode != null) {
					schema.model('Registration').forge().where({
						eventCode: req.query.eventCode,
						accountCode: req.query.accountCode,
						portalId: req.headers.portal_id,
						registrationCode: searchTerm.regCode,
						isActive: 1
					}).fetchAll().then(function (result) {
						if (result) {
							return res.jsonp({
								"data": result.toJSON()
							});
						} else {
							return res.status(404).send("No registration found with regCode : " + searchTerm.regCode);
						}
					}).catch(function (err) {
						logger.error('Error occurred in getRegistrationByFilter API while searching with regCode: ', err)
						return res.status(500).send();
					});
				} else {
					schema.model('Registration').forge().query(function (qb) {
						qb.whereRaw(query, queryData)
							.orderBy('firstName', 'asc')
							.orderBy('lastName', 'asc')
							.debug(queryDebugMode)
					}).fetchAll().then(function (result) {
						if (result == null) {
							result = [];
						}
						return res.jsonp({
							"data": result.toJSON()
						});
					}).catch(function (err) {
						logger.error('Error occurred in getRegistrationByFilter API while searching on searchTerms(FirstName/LastName/Organization): ', err)
						return res.status(500).send();
					});
				}
			} else {
				return res.status(404).send("No search filter found in the query");
			}
		}
	}

	controller.getAttendeesList = function (req, res, next) {
		schema.model('RegistrationSession').forge().where({
			eventId: req.body.eventId,
			portalId: req.headers.portal_id,
			sessionId: req.body.sessionId
		}).fetchAll().then(function (attendees) {
			if (attendees == null) {
				attendees = []
			}
			return res.jsonp(attendees.toJSON())
		}).catch(function (err) {
			logger.error('Error occurred in getAttendeesList API: ', err)
			return res.status(500).send()
		});
	}

	controller.getEventById = function (req, res, next) {
		schema.model('Event').forge().where({
			eventCode: req.query.eventCode,
			accountCode: req.query.accountCode,
			portalId: req.headers.portal_id
		}).fetch().then(function (event) {
			if (event) {
				return res.jsonp({
					"eventDTO": event
				});
			} else {
				return res.status(400).send("Not Found");
			}
		}).catch(function (err) {
			logger.error('Error occurred in getEventById API: ', err)
			return res.status(500).send()
		});
	}

	controller.getRegistrationByCode = function (req, res, next) {
		var questionsData = [];
		schema.model('Registration').forge().where({
			eventCode: req.query.eventCode,
			accountCode: req.query.accountCode,
			portalId: req.headers.portal_id,
			registrationCode: req.query.registrationCode
		}).query(function (qb) {
			qb.debug(queryDebugMode)
		}).fetch().then(function (registration) {
			if (registration) {
				return res.jsonp({
					"registrationDTO": registration
				});
			} else {
				// Search at certain app, if reg code exist or not
				requestMaker.makeServerRequest('/certainExternal/service/v1/Registration/' + req.query.accountCode + '/' + req.query.eventCode + '/' + req.query.registrationCode + '?includeList=profile_questions,registration_questions',
					'GET', req.session.uuid, {}, req.headers,
					function (data, statusCode) {
						if (statusCode == 200 && data) {
							//Saving data to local DB
							var _registration = {
								dateCreated: data.dateCreated ? moment(data.dateCreated).unix() : now,
								dateModified: data.dateModified ? moment(data.dateModified).unix() : now,
								registrationCode: data.registrationCode,
								isActive: data.isActive,
								eventCode: data.eventCode,
								accountCode: data.accountCode,
								attendeeTypeCode: data.attendeeTypeCode,
								registrationStatusLabel: data.registrationStatusLabel,
								firstName: data.profile.firstName,
								lastName: data.profile.lastName,
								pin: data.profile.pin,
								email: data.profile.email,
								position: data.profile.position,
								organization: data.organization,
								mobile: data.profile.phoneMobile,
								portalId: req.headers.portal_id,
								isLocalModified: 0,
								localDateModified: null,
								syncDate: null
							}

							schema.model('Registration').forge().save(_registration).then(function (insertedRegistration) {
								schema.obj
								async.series([
									function (callback) {
										schema.model('Question').forge().where({
											eventId: req.query.eventId,
											portalId: req.headers.portal_id
										}).fetchAll({
											columns: ['questionId', 'questionTypeId']
										}).then(function (questions) {
											if (questions == null) {
												questions = []
											}
											questionData = questions.toJSON()
											callback(null, questionData)
										}).catch(function (err) {
											if (err) {
												logger.error("Error occurred in getRegistrationByCode API while fetching question details: ", err)
												callback(err, null)
											}
										})
									},
									function (savedRegQuesAnswers) {
										if (data.registrationQuestions && data.registrationQuestions.question) {
											saveRegistrationAnswers(data.registrationCode, data.registrationQuestions.question, function (err, result) {
												if (err) {
													logger.error("Error occurred in getRegistrationByCode API while saving registration answers: ", err)
													savedRegQuesAnswers(err, null)
												} else {
													savedRegQuesAnswers(null, data)
												}
											})
										} else savedRegQuesAnswers(null, data)
									},
									function (savedProfileQuesAnswers) {
										if (data.profile && data.profile.profileQuestions && data.profile.profileQuestions.question) {
											saveRegistrationAnswers(data.registrationCode, data.profile.profileQuestions.question, function (err, result) {
												if (err) {
													logger.error("Error occurred in getRegistrationByCode API while saving profile answers: ", err)
													savedProfileQuesAnswers(err, null)
												} else {
													savedProfileQuesAnswers(null, data)
												}
											})
										} else {
											savedProfileQuesAnswers(null, data)
										}
									}
								], function (err, response) {
									if (err) {
										logger.error("Error occurred in getRegistrationByCode API: ", err)
										return res.status(500).send(err.message)
									} else {
										return res.jsonp({
											"registrationDTO": insertedRegistration.toJSON()
										})
									}
								})
							}).catch(function (err) {
								logger.error("Error occurred in getRegistrationByCode API while saving registration to local DB: ", err)
								return res.status(500).send(err.message)
							})
						} else {
							logger.error("Error occurred in getRegistrationByCode API, while fetching registration details from certain app, Status Code: ", statusCode, " data: ", JSON.stringify(data))
							return res.status(400).send("Not Found")
						}
					})
			}
		}).catch(function (err) {
			logger.error('Error occurred in getRegistrationByCode API: ', err)
			return res.status(500).send()
		});

		//Saving Registration Answers for fetched registrant from certain app
		function saveRegistrationAnswers(registrationCode, questionArr, callback) {
			async.mapSeries(questionArr, function (ques, cb) {
				var questionTypeId = _.filter(questionsData, function (q) {
					return q.questionId == ques.questionId
				}).questionTypeId;
				var answerArr = [];
				if (questionTypeId == 1 || questionTypeId == 2) {
					answerArr = ques.answers.answer;
				} else {
					if (ques.answers.answer && ques.answers.answer.length > 0 && ques.answers.answer[0].value) {
						ansValueArr = ques.answers.answer[0].value.split(',');
						async.mapSeries(ansValueArr, function (av, cb2) {
							var answerObj = {
								answerId: ques.answers.answer[0].answerId,
								answerCode: av,
								value: av
							}
							answerArr.push(answerObj);
							cb2(null, answerObj)
						}, function (err, response) {
							if (err) {
								logger.error("Error occurred while saving multiple type answer: ", ques.questionId)
								cb(err, null)
							} else {
								async.mapSeries(answerArr, function (ans, cb1) {
									schema.model('RegistrationAnswer').forge().save({
										answerId: ans.answerId,
										answerCode: ans.answerCode,
										value: ans.value,
										questionId: ques.questionId,
										registrationCode: registrationCode,
										eventCode: req.query.eventCode,
										accountCode: req.query.accountCode,
										portalId: req.headers.portal_id,
										syncDate: null
									}).then(function (insertedRegAnswer) {
										cb1(null, insertedRegAnswer.toJSON())
									}).catch(function (err) {
										logger.error("Error occurred while saving answer: ", ans, "\\Error: ", err)
										cb1(err, null)
									})
								}, function (err, response) {
									if (err) {
										logger.error("Error occurred while saving answer for question Id: ", ques.questionId, "\\Error: ", err)
										cb(err, null)
									} else cb(null, ques)
								})
							}
						})
					} else cb(null, ques)
				}
			}, function (err, response) {
				if (err) {
					logger.error("Error occurred while saving registration code: ", registrationCode, "\\ Error: ", err)
					callback(err, null)
				} else callback(null, questionArr)
			})
		}
	}

	controller.getEventByEventId = function (req, res, next) {
		schema.model('Event').forge()
			.where({
				eventId: req.query.eventId,
				portalId: req.headers.portal_id
			}).fetch().then(function (event) {
				if (event == null) {
					event = {}
				}
				return res.jsonp({
					"eventDTO": event
				});
			}).catch(function (err) {
				logger.error('Error occurred in getEventByEventId API: ', err)
				return res.status(500).send()
			});
	}

	controller.saveEvent = function (req, res, next) {
		async.waterfall([
			function (callback) {
				requestMaker.makeServerRequest('/certainExternal/service/v1/Event/' + req.body.accountCode + '/' + req.body.eventCode, 'GET', req.session.uuid, {}, req.headers, function (data, statusCode) {
					if (statusCode == 200 && data) {
						requestMaker.makeServerRequest('/certainExternal/service/v1/Account/' + data.accountCode, 'GET', req.session.uuid, {}, req.headers, function (account, accountStatusCode) {
							if (accountStatusCode == 200 && account) {
								data.accountId = account.accounts[0].accountId
								callback(null, data)
							} else return res.status(404).send(data)
						})
					} else return res.status(404).send(data)
				})
			},
			function (data, callback) {
				if (data) {
					schema.model('Event').forge().where({
						eventCode: data.eventCode,
						eventId: data.eventId,
						accountCode: data.accountCode,
						accountId: data.accountId,
						portalId: req.headers.portal_id
					}).fetch().then(function (_event) {
						if (_event) {
							return res.status(400).send("You can not add more than one Event using same Event code and Account ode combination!!");
						} else {
							var _event = {
								eventId: data.eventId,
								accountId: data.accountId,
								portalId: req.headers.portal_id,
								eventName: data.eventName,
								eventCode: data.eventCode,
								startDate: data.startDate ? moment(data.startDate).unix() * 1000 : 0,
								endDate: data.endDate ? moment(data.endDate).unix() * 1000 : 0,
								dateCreated: data.dateCreated ? moment(data.dateCreated).unix() * 1000 : 0,
								dateModified: data.dateModified ? moment(data.dateModified).unix() * 1000 : 0,
								accountCode: data.accountCode,
								isActive: data.isActive,
								syncDate: null,
								notes: data.notes,
								timezone: data.timezone,
								isDefault: false
							}
							schema.model('Event').forge().save(_event).then(function (savedEvent) {
								callback(null, savedEvent.toJSON());
							}).catch(function (err) {
								logger.error('Error occurred in saveEvent API: ', err)
								return res.status(500).send();
							});
						}
					}).catch(function (err) {
						logger.error("Error occurred in saveEvent API while fetching data", err)
						return res.status(500).send();
					})
				} else return res.status(404).send("No Record Found!!");
			}
		], function (err, done) {
			if (err) {
				logger.error("Error occurred in saveEvent API: ", err)
				return res.status(500).send()
			} else {
				return res.jsonp({
					"eventDTO": done
				});
			}
		});
	}

	controller.deleteEventById = function (req, res, next) {
		var queries = [
			"delete from track where eventId = " + req.body.eventId + " and portalId = " + req.headers.portal_id,
			"delete from session_type where eventId = " + req.body.eventId + " and portalId = " + req.headers.portal_id,
			"delete from session_location where eventId = " + req.body.eventId + " and portalId = " + req.headers.portal_id,
			"delete from session_level where eventCode = '" + req.body.eventCode + "' and portalId = " + req.headers.portal_id + " and accountCode = '" + req.body.accountCode + "'",
			"delete from registration_session where eventCode = '" + req.body.eventCode + "' and portalId = " + req.headers.portal_id + " and accountCode = '" + req.body.accountCode + "'",
			"delete from session where eventId = " + req.body.eventId + " and portalId = " + req.headers.portal_id,
			"delete from registration_answer where eventCode = '" + req.body.eventCode + "' and portalId = " + req.headers.portal_id + " and accountCode = '" + req.body.accountCode + "'",
			"delete from registration where eventCode = '" + req.body.eventCode + "' and portalId = " + req.headers.portal_id + " and accountCode = '" + req.body.accountCode + "'",
			"delete from answer where eventId = " + req.body.eventId + " and portalId = " + req.headers.portal_id,
			"delete from question where eventId = " + req.body.eventId + " and portalId = " + req.headers.portal_id,
			"delete from meeting_info_config where eventId = " + req.body.eventId + " and portalId = " + req.headers.portal_id,
			"delete from attendee_type where eventId = " + req.body.eventId + " and portalId = " + req.headers.portal_id,
			"delete from config where eventId = " + req.body.eventId + " and portalId = " + req.headers.portal_id,
			"delete from event where eventId = " + req.body.eventId + " and portalId = " + req.headers.portal_id
		];

		async.mapSeries(queries, function (query, cb1) {
			uniqueCode = "MA9099MA9099";
			requestMaker.makeDBRequest(query, uniqueCode, function (error, response) {
				if (error) {
					cb1(error, query)
				} else {
					cb1(null, query)
				}
			});
		}, function (err, response) {
			if (err) {
				logger.error(err);
				res.status(404).send("Error Occured while Deleting");
			} else {
				res.send("Deleted Successfully");
			}
		})
	}

	controller.getStatuses = function (req, res, next) {
		requestMaker
			.makeServerRequest('/svcs/conference_session_statuses', 'GET',
				req.session.uuid, {}, req.headers,
				function (data,
					statusCode) {
					requestMaker.getRequestResponse(req, res, data,
						statusCode);
				});
	}

	controller.getSessionLevels = function (req, res, next) {
		schema.model('SessionLevel').forge().where({
				eventCode: req.query.eventCode,
				accountCode: req.query.accountCode,
				portalId: req.headers.portal_id
			}).query(function (qb) {
				qb.debug(queryDebugMode)
			})
			.fetchAll().then(function (sessionLevels) {
				if (sessionLevels == null) {
					sessionLevels = []
				}
				return res.jsonp(sessionLevels.toJSON())
			}).catch(function (err) {
				logger.error('Error occurred in getSessionLevels API: ', err)
				return res.status(500).send()
			});
	}

	controller.getTracksByEvent = function (req, res, next) {
		schema.model('Track').forge().where({
			eventId: req.query.eventId,
			portalId: req.headers.portal_id
		}).query(function (qb) {
			qb.debug(queryDebugMode)
		}).fetchAll().then(function (tracks) {
			if (tracks == null) {
				tracks = [];
			}
			res.jsonp(tracks.toJSON())
		}).catch(function (err) {
			logger.error("Error occurred in getTracksByEvent API: ", err)
			return res.status(500).send()
		})
	}

	controller.getAllSessions = function (req, res, next) {
		//---------- Data Fetching from Local DB ------------//
		schema.model('Session').forge().where({
			eventId: req.query.eventId,
			portalId: req.headers.portal_id
		}).fetchAll().then(function (sessions) {
			if (sessions == null) {
				sessions = []
			}
			return res.jsonp({
				"sessions": sessions.toJSON()
			});
		}).catch(function (err) {
			logger.error('Error occurred in getAllSessions API: ', err)
			return res.status(500).send()
		});
	}

	controller.authenticate = function (req, res, next) {
		requestMaker
			.makeServerRequest('/svcs/user_authentication/checkineasy',
				'POST', req.session.uuid, req.body.types, req.headers,
				function (data, statusCode) {
					requestMaker.getRequestResponse(req, res, data,
						statusCode);
				});
	}

	controller.updateEvent = function (req, res, next) {
		//---------- Updating Data on Local DB ------------//
		async.waterfall([
			function (callback) {
				schema.model('SessionLocation').forge().where({
					eventId: req.body.eventId,
					portalId: req.headers.portal_id,
					locationId: req.body.resource
				}).fetch().then(function (location) {
					callback(null, location.toJSON().locationCode);
				}).catch(function (err) {
					logger.error('Error occurred in updateEvent API while fetching sessionLocation: ', err)
					callback(err, null)
				});
			},
			function (locationCode, callback) {
				schema.model('Session').forge().where({
					eventId: req.body.eventId,
					portalId: req.headers.portal_id,
					id: req.body.id
				}).fetch().then(function (session) {
					if (session) {
						session.save({
							eventId: req.body.eventId,
							startTime: req.body.startDate,
							endTime: req.body.endDate,
							locationCode: locationCode
						}, {
							method: 'update',
							patch: true
						}).then(function (result) {
							return res.jsonp({
								"gridSessionInstanceDTO": result.toJSON()
							})
						}).catch(function (err) {
							logger.error('Error occurred in updateEvent API while updating data: ', err)
							return res.status(500).send();
						});
					} else {
						return res.status(404).send("No Session Found.")
					}
				}).catch(function (err) {
					logger.error('Error occurred in updateEvent API while fetching session data: ', err)
					return res.status(500).send();
				});
			}
		], function (err, results) {
			if (err) {
				logger.error("Error occurred in updateEvent API: ", err)
				return res.status(500).send()
			} else {
				return res.jsonp(results)
			}
		});
	}

	controller.settings = function (req, res, next) {
		fileHeader = "concurApp.factory('GlobalVariableService', function($location) {return ";
		fileFooter = "});"
		var appDir = path.dirname(require.main.filename);
		appDir = appDir.substring(0, appDir.lastIndexOf("/"));
		appDir = appDir +
			'/web/app/assets/angular/js/services/commonUtils/GlobalVariableService.js'
		console.log(appDir)
		var obj = JSON.stringify(req.body)
		try {
			fs.writeFile(appDir, fileHeader + obj + fileFooter, function (err) {
				if (err) {
					return console.log(err);
				}
				console.log("The file was saved!");
				return res.status(200).send();
			});
		} catch (ex) {
			console.log(ex)
			return res.status(404).send();
		}

	}

	controller.createUpdateMeeting = function (req, res, next) {
		var meetingObject = req.body.meetingObject;
		var reqSessionId = req.body.sessionId;
		var queryObject = req.body.queryObject;
		var regCode = meetingObject.registrationCode;
		meetingObject.portalId = req.headers.portal_id;

		if (meetingObject.confSessionLevel) delete meetingObject.confSessionLevel;
		if (meetingObject.registrationCode) delete meetingObject.registrationCode;
		meetingObject.isLocalModified = 1;
		meetingObject.localDateModified = moment().unix();

		if (reqSessionId) {
			schema.model('Session').forge().where({
				eventId: meetingObject.eventId,
				portalId: req.headers.portal_id,
				id: reqSessionId
			}).query(function (qb) {
				qb.debug(queryDebugMode)
			}).fetch().then(function (session) {
				var isEqual = _.isEqual(session.toJSON(), meetingObject);
				if (session && !isEqual) {
					session.save(meetingObject, {
						method: 'update',
						patch: true
					}).then(function (result) {
						if (result == null) {
							result = {}
						}
						publishUnpublishAttendees(session.get('id'), function (err, publishedUnpublishedAttendees) {
							var returnObj = result.toJSON();
							returnObj.sessionId = result.get('id');
							return res.jsonp({
								"gridSessionInstanceDTO": returnObj
							})
						})
					}).catch(function (err) {
						logger.error('Error occurred in createUpdateMeeting API while updating session data: ', err)
						return res.status(500).send()
					});
				} else {
					publishUnpublishAttendees(session.get('id'), function (err, publishedUnpublishedAttendees) {
						var returnObj = session.toJSON();
						returnObj.sessionId = session.get('id');
						return res.jsonp({
							"gridSessionInstanceDTO": returnObj
						})
					})
				}
			}).catch(function (err) {
				logger.error('Error occurred in createUpdateMeeting API while fetching session data: ', err)
				return res.status(500).send()
			});
		} else {
			// if (meetingObject.trackName == null || meetingObject.trackName == '') {
			// 	console.log('Fetching track name: ', meetingObject.eventId, meetingObject.portalId)
			schema.model('Track').forge().where({
				eventId: meetingObject.eventId,
				portalId: meetingObject.portalId
			}).query(function (qb) {
				qb.debug(queryDebugMode)
			}).fetch().then(function (track) {
				if (track) {
					meetingObject.trackName = track.toJSON().trackName
					meetingObject.instanceId = null;
					schema.model('Session').forge().save(meetingObject).then(function (result) {
						console.log("----------------", result.get('id'), result.toJSON())
						sessionId = result.get('id');
						regCodesToPublish = req.body.regCodesToPublish;
						publishUnpublishAttendees(sessionId, function (err, publishedUnpublishedAttendees) {
							var returnObj = result.toJSON();
							returnObj.sessionId = result.get('id');
							return res.jsonp({
								"gridSessionInstanceDTO": returnObj
							})
						})
					}).catch(function (err) {
						logger.error('Error occurred in createUpdateMeeting API while saving session data: ', err)
						return res.status(500).send()
					});
					// }).catch(function (err) {
					// 	logger.error('Error occurred in createUpdateMeeting API while fetching session row count: ', err)
					// });
				} else {
					logger.error('Error occurred in createUpdateMeeting API, No track found for this event. And without track meeting cant be saved: ', err)
					return res.status(500).send()
					//Show error that without track name meeting can't be saved, and no need of rest code here
					// console.log('meetingObject.trackName: ', meetingObject.trackName)
					// //schema.model('Session').forge().count('instanceId').then(function (rowCount) {
					// meetingObject.instanceId = null;
					// schema.model('Session').forge().save(meetingObject).then(function (result) {
					// 	console.log("----------------", result.get('id'), result.toJSON())
					// 	sessionId = result.get('id');
					// 	console.log(req.body.regCodesToPublish)
					// 	regCodesToPublish = req.body.regCodesToPublish;
					// 	publishUnpublishAttendees(sessionId, function (err, publishedUnpublishedAttendees) {
					// 		var returnObj = result.toJSON();
					// 		returnObj.sessionId = result.get('id');
					// 		return res.jsonp({
					// 			"gridSessionInstanceDTO": returnObj
					// 		})
					// 	})
					// }).catch(function (err) {
					// 	logger.error('Error occurred in createUpdateMeeting API while saving session data: ', err)
					// });
					// // }).catch(function (err) {
					// // 	logger.error('Error occurred in createUpdateMeeting API while fetching session row count: ', err)
					// // });
				}
			}).catch(function (err) {
				logger.error('Error occurred in createUpdateMeeting API while fetching track data: ', err)
				return res.status(500).send()
			});
			//}
			// else{
			// 	//show error when track is not there
			// }
		}

		function publishUnpublishAttendees(sessionId, publishedUnpublishedAttendees) {
			async.parallel([
				function (callback) {
					async.mapSeries(req.body.regCodesToPublish, function (regCodeToPublish, cb) {
						schema.model('RegistrationSession').forge().where({
							eventCode: queryObject.eventCode,
							accountCode: queryObject.accountCode,
							sessionId: sessionId,
							registrationCode: regCodeToPublish
						}).query(function (qb) {
							qb.debug(queryDebugMode)
						}).fetch().then(function (regSession) {
							if (regSession) {
								if (regSession.isPublished == 1 && regSession.isLocalModified == 1 && localDateModified == moment().unix()) {
									logger.info("Data already updated in RegistrationSession for regCode: " + regSession.registrationCode + " and sessionId: " + regSession.sessionId)
									cb(null, regSession.toJSON())
								} else {
									regSession.save({
										isPublished: 1,
										isLocalModified: 1,
										localDateModified: moment().unix()
									}, {
										method: 'update',
										patch: true
									}).then(function (result) {
										cb(null, regSession.toJSON());
									}).catch(function (err) {
										logger.error('Error occurred in publishUnpublishAttendees API while updating data: ', err)
										cb(null, regSession.toJSON())
									});
								}
							} else {
								schema.model('RegistrationSession').forge().save({
									sessionId: sessionId,
									eventCode: queryObject.eventCode,
									portalId: req.headers.portal_id,
									registrationCode: regCodeToPublish,
									isLocalModified: 1,
									localDateModified: moment().unix(),
									syncDate: null,
									accountCode: queryObject.accountCode,
									registrationSessionStatus: 'Registered',
									isPublished: 1
								}).then(function (savedRegSession) {
									if (savedRegSession == null) {
										savedRegSession = {}
									}
									cb(null, savedRegSession.toJSON());
								}).catch(function (err) {
									logger.error('Error occurred in publishUnpublishAttendees API while saving data: ', err)
									cb(err, null)
								});
							}
						}).catch(function (err) {
							logger.error('Error occurred in publishUnpublishAttendees API while fetching data: ', err)
							callback(err, null)
						});
					}, function (err, response) {
						if (err) {
							callback(err, null);
						} else {
							callback(null, response);
						}
					})
				},
				function (callback1) {
					async.mapSeries(req.body.regCodesToUnpublish, function (regCodeToUnpublish, cb1) {
						schema.model('RegistrationSession').forge().where({
							eventCode: queryObject.eventCode,
							accountCode: queryObject.accountCode,
							sessionId: sessionId,
							registrationCode: regCodeToUnpublish
						}).query(function (qb) {
							qb.debug(queryDebugMode)
						}).fetch().then(function (regSession) {
							if (regSession) {
								if (regSession.isPublished == 0 && isLocalModified == 1 && localDateModified == moment().unix()) {
									logger.info("Data already updated in RegistrationSession for regCode: " + regSession.registrationCode + " and sessionId: " + regSession.sessionId)
									cb1(null, regSession.toJSON())
								} else {
									regSession.save({
										isPublished: 0,
										isLocalModified: 1,
										localDateModified: moment().unix()
									}, {
										method: 'update',
										patch: true
									}).then(function (updatedRegSession) {
										if (updatedRegSession == null) {
											updatedRegSession = {}
										}
										cb1(null, updatedRegSession.toJSON());
									}).catch(function (err) {
										logger.error('Error occurred in publishUnpublishAttendees API while updating data: ', err)
										cb1(err, null)
									});
								}
							} else {
								cb1(null, regSession.toJSON())
							}
						}).catch(function (err) {
							logger.error('Error occurred in publishUnpublishAttendees API while fetching data: ', err)
							callback1(err, null)
						});
					}, function (err, response1) {
						if (err) {
							callback1(err, null);
						} else {
							callback1(null, response1);
						}
					})
				}
			], function (err, response2) {
				if (err) {
					logger.error('Error occurred in publishUnpublishAttendees API: ', err)
					publishedUnpublishedAttendees(err, null)
				} else {
					publishedUnpublishedAttendees(null, response2[0])
				}
			})
		}
	}

	controller.getMeetingInfoData = function (req, res, next) {
		var whereClause = {};
		if (req.query.sessionId) {
			whereClause = {
				'session.eventId': req.query.eventId,
				'session.portalId': req.headers.portal_id,
				'session.id': req.query.sessionId
			}
		} else {
			whereClause = {
				'session.eventId': req.query.eventId,
				'session.portalId': req.headers.portal_id
			}
		}

		schema.model('Session').forge().query(function (qb) {
			qb.leftJoin('session_location', function () {
					this.on('session.locationCode', '=', 'session_location.locationCode').onIn('session_location.eventId', [req.query.eventId]).onIn('session_location.portalId', [req.headers.portal_id])
				})
				.leftJoin('registration_session', function () {
					this.on('registration_session.sessionId', '=', 'session.id').onIn('registration_session.isPublished', [1]).onIn('registration_session.eventCode', [req.query.eventCode])
						.onIn('registration_session.accountCode', [req.query.accountCode]).onIn('registration_session.portalId', [req.headers.portal_id])
				})
				.leftJoin('registration', function () {
					this.on('registration.registrationCode', '=', 'registration_session.registrationCode').onIn('registration.eventCode', [req.query.eventCode])
						.onIn('registration.accountCode', [req.query.accountCode]).onIn('registration.portalId', [req.headers.portal_id])
				})
				.column('session.instanceId', 'session.id as sessionId', 'session.typeName', 'session.abstractDesc', 'session.sessionTitle', 'session.sessionCode', 'session.capacity', 'session.noOfInstances',
					'session.duration', 'session.trackName', 'session.notes', 'session.level', 'session.status', 'session.startTime', 'session.endTime', 'session.locationCode', 'session.portalId',
					'session.session_dateCreated', 'session.session_dateModified', 'session.eventId', 'session.id as sessionId', 'session_location.locationName', 'session_location.locationId', 'session_location.venue',
					'registration.registrationCode', 'registration.attendeeTypeCode', 'registration.registrationStatusLabel', 'registration.firstName', 'registration.lastName', 'registration.pin',
					'registration.email', 'registration.organization')
				.where(whereClause)
				.debug(queryDebugMode)
		}).fetchAll().then(function (results) {
			var sessions = results.toJSON();
			var uniqSessions = _.uniqBy(sessions, 'sessionId');
			var regSessionWithAttendee = [];
			async.mapSeries(uniqSessions, function (_session, cb) {
				var regSessions = _.filter(sessions, {
					sessionId: _session.sessionId
				});
				_session.start = _session.startTime ? moment(_session.startTime).format() : moment().unix();
				_session.end = _session.endTime ? moment(_session.endTime).format() : moment().unix();
				_session.startDate = _session.startTime ? moment(_session.startTime).format() : moment().unix();
				_session.endDate = _session.endTime ? moment(_session.endTime).format() : moment().unix();
				_session.id = _session.sessionId;
				_session.title = _session.sessionTitle;
				_session.resourceId = _session.locationId;
				_session.regAttendees = [];
				async.mapSeries(regSessions, function (regSession, cb1) {
					if (regSession.firstName && regSession.lastName) {
						var _regAttendee = {
							firstName: regSession.firstName ? regSession.firstName : '',
							lastName: regSession.lastName ? regSession.lastName : '',
							pin: regSession.pin ? regSession.pin : '',
							organization: regSession.organization ? regSession.organization : '',
							email: regSession.email ? regSession.email : '',
							status: regSession.registrationStatusLabel ? regSession.registrationStatusLabel : '',
							code: regSession.attendeeTypeCode ? regSession.attendeeTypeCode : '',
							regCode: regSession.registrationCode ? regSession.registrationCode : ''
						}
						_session.regAttendees.push(_regAttendee);
					}
					setImmediate(function () {
						cb1(null, _session);
					})
				}, function (err, registrationSessions) {
					if (!err) cb(null, registrationSessions[0]);
					else {
						logger.error("Error in getMeetingInfoData API: ", err)
						cb(err, null);
					}
				})
			}, function (err, response) {
				if (err) {
					logger.error("Error in getMeetingInfoData API: ", err)
					return res.status(500).send()
				} else {
					return res.jsonp(response);
				}
			})
		}).catch(function (err) {
			logger.error('Error occurred in getMeetingInfoData API: ', err)
			return res.status(500).send()
		});
	}

	controller.getPortalById = function (req, res, next) {
		schema.model('Portal').forge().where({
			id: req.query.portalId,
			active: 1
		}).fetch().then(function (result) {
			if (result) {
				var portal = {
					label: result.toJSON().label,
					domain: result.toJSON().domain,
					serverUrl: result.toJSON().serverUrl
				}
				return res.jsonp(portal);
			} else return res.status(404).send("No Active Portal Found!!")
		}).catch(function (err) {
			logger.error('Error occurred in getPortalById API: ', err)
			return res.status(500).send()
		});
	}

	controller.getPortalByDomain = function (req, res, next) {
		schema.model('Portal').forge().where({
			domain: req.query.domain,
			active: 1
		}).fetch().then(function (result) {
			if (result) {
				var portal = {
					label: result.toJSON().label,
					domain: result.toJSON().domain,
					serverUrl: result.toJSON().serverUrl
				}
				return res.jsonp(portal);
			} else {
				return res.status(403).send("No Active Portal Found!!")
			}
		}).catch(function (err) {
			logger.error('Error occurred in getPortalByDomain API: ', err)
			return res.status(500).send()
		});
	}

	controller.getQuestionsByEventId = function (req, res, next) {
		schema.model('Question').forge().query(function (qb) {
			qb.leftJoin('answer', function () {
					this.on('question.questionId', '=', 'answer.questionId').onIn('answer.eventId', [req.query.eventId]).onIn('answer.portalId', [req.headers.portal_id])
				})
				.where('question.eventId', req.query.eventId)
				.andWhere('question.portalId', req.headers.portal_id)
				.column('question.eventId', 'question.questionId', 'question.questionName', 'question.questionLabel', 'question.questionCode',
					'question.questionType', 'question.portalId', 'question.questionTypeId', 'answer.answerName', 'answer.answerLabel', 'answer.answerCode')
				.debug(queryDebugMode)
		}).fetchAll().then(function (results) {
			results = results.toJSON();
			var uniqQuestions = _.uniqBy(results, 'questionId');
			async.mapSeries(uniqQuestions, function (_question, cb) {
				var quesAnswers = _.filter(results, {
					questionId: _question.questionId
				});

				_question.answers = [];

				async.mapSeries(quesAnswers, function (quesAnswer, cb1) {
					if (quesAnswer.answerName || quesAnswer.answerLabel || quesAnswer.answerCode) {
						var _quesAnswer = {
							answerName: quesAnswer.answerName ? quesAnswer.answerName : '',
							answerLabel: quesAnswer.answerLabel ? quesAnswer.answerLabel : '',
							answerCode: quesAnswer.answerCode ? quesAnswer.answerCode : ''
						}

						_question.answers.push(_quesAnswer);
					}
					cb1(null, _question);
				}, function (err, questionsWithAnswers) {
					delete _question.answerCode;
					delete _question.answerLabel;
					delete _question.answerName;
					if (!err) {
						cb(null, questionsWithAnswers[0]);
					} else {
						cb(err, null);
					}
				})
			}, function (err, response) {
				if (err) {
					logger.error('Error occurred in getQuestionsByEventId API: ', err)
					return res.status(500).send()
				} else {
					return res.jsonp(response);
				}
			})
		}).catch(function (err) {
			logger.error('Error occurred in getQuestionsByEventId API: ', err)
			return res.status(500).send()
		});
	}

	controller.getLocationSessionByEventId = function (req, res, next) {
		schema.model('SessionLocation').forge().query(function (qb) {
			qb.leftJoin('session', function () {
					this.on('session_location.locationCode', '=', 'session.locationCode').onIn('session.eventId', [req.query.eventId])
						.onIn('session.portalId', [req.headers.portal_id])
				})
				.leftJoin('registration_session', function () {
					this.on('registration_session.sessionId', '=', 'session.id').onIn('registration_session.isPublished', [1])
						.onIn('registration_session.eventCode', [req.query.eventCode]).onIn('registration_session.accountCode', [req.query.accountCode])
						.onIn('registration_session.portalId', [req.headers.portal_id])
				})
				.leftJoin('registration', function () {
					this.on('registration.registrationCode', '=', 'registration_session.registrationCode').onIn('registration.eventCode', [req.query.eventCode])
						.onIn('registration.accountCode', [req.query.accountCode]).onIn('registration.portalId', [req.headers.portal_id])
				})
				.where({
					'session_location.eventId': req.query.eventId,
					'session_location.portalId': req.headers.portal_id
				})
				.whereBetween('session.startTime', [req.query.startDate + ' 00:00:00', req.query.startDate + ' 23:59:59'])
				.whereBetween('session.endTime', [req.query.endDate + ' 00:00:00', req.query.endDate + ' 23:59:59'])
				.column('session_location.locationId', 'session_location.eventId', 'session_location.capacity', 'session_location.active',
					'session_location.locationCode', 'session_location.locationName', 'session_location.venue', 'session_location.portalId as portal_id', 'session.id as sessionId', 'session.instanceId',
					'session.typeName', 'session.abstractDesc', 'session.sessionTitle', 'session.sessionCode', 'session.capacity', 'session.noOfInstances',
					'session.duration', 'session.trackName', 'session.notes', 'session.level', 'session.status', 'session.startTime', 'session.endTime',
					'session.session_dateCreated', 'session.session_dateModified', 'registration.registrationCode', 'registration.isActive', 'registration.attendeeTypeCode',
					'registration.registrationStatusLabel', 'registration.firstName', 'registration.lastName', 'registration.pin', 'registration.email',
					'registration.organization', 'registration_session.registrationSessionStatus')
				.orderBy('session.startTime', 'asc')
				.orderBy('registration.firstName', 'asc')
				.orderBy('registration.lastName', 'asc')
				.debug(queryDebugMode);
		}).fetchAll().then(function (results) {
			if (results == null) {
				results = []
			}
			results = results.toJSON();
			var locations = [];
			var uniqLocations = _.uniqBy(results, 'locationCode')
			async.mapSeries(uniqLocations, function (location, cb) {
				var locationSession = _.filter(results, {
					locationCode: location.locationCode
				})
				var _location = {
					locationId: location.locationId,
					eventId: location.eventId,
					capacity: location.capacity,
					active: location.active,
					locationCode: location.locationCode,
					locationName: location.locationName,
					venue: location.venue,
					portalId: location.portal_id,
					sessions: []
				}
				var uniqSessions = _.uniqBy(locationSession, 'instanceId');
				async.mapSeries(uniqSessions, function (session, cb1) {
					if (session.instanceId) {
						var _session = {
							sessionId: session.sessionId,
							instanceId: session.instanceId,
							typeName: session.typeName,
							abstractDesc: session.abstractDesc,
							sessionTitle: session.sessionTitle,
							sessionCode: session.sessionCode,
							capacity: session.capacity,
							noOfInstances: session.noOfInstances,
							duration: session.duration,
							trackName: session.trackName,
							notes: session.notes,
							level: session.level,
							status: session.status,
							startTime: session.startTime,
							endTime: session.endTime,
							session_dateCreated: session.session_dateCreated,
							session_dateModified: session.session_dateModified,
							regAttendees: []
						}

						var regs = _.filter(locationSession, {
							instanceId: session.instanceId
						})

						async.mapSeries(regs, function (reg, cb2) {
							if (reg.registrationCode) {
								var _reg = {
									registrationCode: reg.registrationCode,
									isActive: reg.isActive,
									attendeeTypeCode: reg.attendeeTypeCode,
									registrationStatusLabel: reg.registrationStatusLabel,
									registrationSessionStatus: reg.registrationSessionStatus,
									firstName: reg.firstName,
									lastName: reg.lastName,
									pin: reg.pin,
									email: reg.email,
									organization: reg.organization
								}

								_session.regAttendees.push(_reg);
								cb2(null, _session);
							} else {
								cb2(null, _session)
							}
						}, function (err, response2) {
							if (err) {
								logger.error("Error occurred in getLocationSessionByEventId API: ", err)
								cb1(err, null)
							} else {
								_location.sessions.push(_session);
								cb1(null, _location)
							}
						})
					} else {
						cb1(null, _location)
					}
				}, function (err, response1) {
					if (err) {
						logger.error("Error occurred in getLocationSessionByEventId API: ", err)
						cb(err, null)
					} else {
						cb(null, response1[0]);
					}
				})
			}, function (err, response) {
				if (err) {
					logger.error("Error occurred in getLocationSessionByEventId API: ", err)
					return res.status(500).send()
				} else {
					return res.jsonp(response)
				}
			})
		}).catch(function (err) {
			logger.error('Error occurred in getLocationSessionByEventId API: ', err)
			return res.status(500).send()
		});
	}

	controller.getRegistrationAnswersByRegCode = function (req, res, next) {
		schema.model('Registration').forge().query(function (qb) {
			qb.leftJoin('registration_answer', function () {
					this.on('registration.registrationCode', '=', 'registration_answer.registrationCode').onIn('registration_answer.eventCode', [req.query.eventCode])
						.onIn('registration_answer.accountCode', [req.query.accountCode]).onIn('registration_answer.portalId', [req.headers.portal_id])
				})
				.where({
					'registration.registrationCode': req.query.regCode,
					'registration.eventCode': req.query.eventCode,
					'registration.accountCode': req.query.accountCode,
					'registration.portalId': req.headers.portal_id
				})
				.column('registration.*', 'registration_answer.*')
				.debug(queryDebugMode)
		}).fetchAll().then(function (results) {
			if (results == null) {
				results = []
			}
			results = results.toJSON();
			if (results == null || results.length <= 0) {
				return res.status(404).send("No Registration found with given code");
			}
			var regDetails = {
				dateCreated: results[0].dateCreated,
				dateModified: results[0].dateModified,
				registrationCode: req.query.regCode,
				isActive: results[0].isActive,
				eventCode: req.query.eventCode,
				accountCode: req.query.accountCode,
				attendeeTypeCode: results[0].attendeeTypeCode,
				registrationStatusLabel: results[0].registrationStatusLabel,
				firstName: results[0].firstName,
				lastName: results[0].lastName,
				pin: results[0].pin,
				email: results[0].email,
				position: results[0].position,
				organization: results[0].organization,
				phoneMobile: results[0].mobile,
				portalId: req.headers.portal_id,
				questions: []
			}
			var uniqQuestions = _.uniqBy(results, 'questionId');
			async.mapSeries(uniqQuestions, function (_question, cb) {
				_question.answers = [];
				var regAnswers = _.filter(results, {
					questionId: _question.questionId
				});
				async.mapSeries(regAnswers, function (regAns, cb1) {
					_answer = {
						answerId: regAns.answerId,
						answerCode: regAns.answerCode,
						value: regAns.value
					}
					_question.answers.push(_answer);
					cb1(null, _question);
				}, function (err, registrationAnswers) {
					regDetails.questions.push({
						"questionId": _question.questionId,
						"answers": registrationAnswers[0].answers
					});
					if (err) {
						cb(err, null);
					} else {
						cb(null, registrationAnswers[0])
					}
				})
			}, function (err, response) {
				if (err) {
					logger.error("Error occurred in getRegistrationAnswersByRegCode API: ", err)
					return res.status(500).send()
				} else {
					return res.jsonp(regDetails);
				}
			})

		}).catch(function (err) {
			logger.error('Error occurred in getRegistrationAnswersByRegCode API: ', err)
			return res.status(500).send()
		});
	}

	controller.makeSQLRequest = function (req, res, next) {
		requestMaker.makeDBRequest(req.body.query, req.body.password, function (error, response) {
			if (error) {
				return res.status(404).send();
			} else {
				return res.jsonp(response);
			}
		});
	}

	controller.getSessionTracks = function (req, res, next) {
		schema.model('Track').forge().where({
			eventId: req.query.eventId,
			portalId: req.headers.portal_id
		}).query(function (qb) {
			qb.debug(queryDebugMode)
		}).fetchAll().then(function (track) {
			if (track) {
				res.jsonp(track.toJSON());
			} else {
				res.status(404).send("No Track Exists for this Event");
			}

		}).catch(function (err) {
			res.status(404).send("No Track Exists for this Event");
			logger.error('Error occurred in  API: ', err)
		});
	}

	function getAPIErrorMsg(errors) {
		var error = "";
		try {
			errors = JSON.parse(errors)
			if (errors != null && errors.errorResponse != null && errors.errorResponse.errors != null) {
				var error = errors.errorResponse.errors.toString();
			} else if (errors != null && errors.errorApiResponse != null && errors.errorApiResponse.message != null) {
				var error = errors.errorApiResponse.message;
				if (error.indexOf('valid session level') > 0) {
					error = "Invalid Meeting Status. Please configure it before use."
				}
			}
		} catch (ex) {
			if (errors.exception && errors.exception == 'Your Certain Session Is Expired') {
				error = "Your Certain Session Is Expired";
			} else {
				error = "Unknown Error Occured."
			}
		}
		return error;
	}

	controller.createMeeting = function (req, res, next) {
		var sessionObjectResponse = null;
		var duration = commonUtils.getMinuteDifferenceBetweenDates(new Date(req.body.sessionInstance.startDate), new Date(req.body.sessionInstance.endDate));
		var regStatus = 'Scheduled - ' + req.body.meetingObject.typeName;
		if (req.body.meetingObject.instanceId == null) {
			var meetingPostObject = {
				createSource: "API",
				sessionLevel: req.body.meetingObject.level,
				sessionType: req.body.meetingObject.typeName,
				abstractDes: req.body.meetingObject.abstractDesc ? req.body.meetingObject.abstractDesc : "CMM Meeting",
				name: req.body.meetingObject.sessionTitle,
				sessionCode: req.body.meetingObject.sessionCode,
				capacity: req.body.meetingObject.capacity,
				noOfInstances: req.body.meetingObject.noOfInstances,
				duration: duration,
				notes: req.body.meetingObject.notes ? req.body.meetingObject.notes : "",
				status: req.body.meetingObject.status ? req.body.meetingObject.status : "Qualified",
				eventTrack: req.body.meetingObject.trackName,
				description: req.body.meetingObject.sessionDescription
			}
			requestMaker.makeServerRequest('/svcs/api/3.0/accounts/' + req.body.accountCode + '/events/' + req.body.eventCode + '/sessions', 'POST', req.session.uuid, meetingPostObject, req.headers, function (data, statusCode) {
				if (statusCode == 200) {
					var encoded_url = encodeURI('/svcs/api/3.0/accounts/' + req.body.accountCode + '/events/' + req.body.eventCode + '/sessions/list?sessionCode=' + meetingPostObject.sessionCode);
					requestMaker.makeServerRequest(encoded_url, 'GET', req.session.uuid, {}, req.headers, function (sessionData, statusCode) {
						if (sessionData == null || sessionData.sessions == null || sessionData.sessions.length <= 0) {
							res.status(404).send("Error occured : <br/>" + getAPIErrorMsg(sessionData));
						} else {
							sessionObjectResponse = sessionData.sessions[0];
							/*------------Schedule Session Instance to location-------------*/
							var obj = {
								"locationCode": req.body.meetingObject.locationCode,
								"startDate": req.body.sessionInstance.startDate
							}
							encoded_url = encodeURI('/svcs/api/3.0/accounts/' + req.body.accountCode + '/events/' + req.body.eventCode + '/locations/' + req.body.meetingObject.locationCode + '/sessions/' + sessionObjectResponse.instanceId);
							requestMaker.makeServerRequest(encoded_url, 'POST', req.session.uuid, obj, req.headers, function (locationData, statusCode) {
								if (statusCode != 200) {
									res.status(404).send("Error occured : <br/>" + getAPIErrorMsg(locationData));
								} else {
									/*--------Publish Session For All-----------*/
									var obj = {
										"attendeetypes": "all"
									}
									encoded_url = encodeURI('/svcs/api/3.0/accounts/' + req.body.accountCode + '/events/' + req.body.eventCode + '/sessions/' + sessionObjectResponse.sessionCode + '/publish');
									requestMaker.makeServerRequest(encoded_url, 'PUT', req.session.uuid, obj, req.headers, function (publishData, statusCode) {
										if (statusCode != 200 && statusCode != 404) {
											res.status(404).send("Error occured : <br/>" + getAPIErrorMsg(publishData));
										} else {
											var encoded_url = encodeURI('/svcs/api/3.0/accounts/' + req.body.accountCode + '/events/' + req.body.eventCode + '/sessions/list?sessionCode=' + meetingPostObject.sessionCode);
											requestMaker.makeServerRequest(encoded_url, 'GET', req.session.uuid, {}, req.headers, function (sessionDataById, statusCode) {
												sessionObjectResponse = sessionDataById.sessions[0];
												if ((req.body.regCodesToPublish && req.body.regCodesToPublish.length > 0) || (req.body.regCodesToUnpublish && req.body.regCodesToUnpublish.length > 0)) {
													mappings = getRegistrationToSessionMapping(req.body.regCodesToPublish, req.body.regCodesToUnpublish, "Registered", "Cancelled");
													var encoded_url = encodeURI('/svcs/api/3.0/accounts/' + req.body.accountCode + '/events/' + req.body.eventCode + '/sessions/' + sessionObjectResponse.instanceId + "/registrations/bulkAssign");
													requestMaker.makeServerRequest(encoded_url, 'POST', req.session.uuid, mappings, req.headers, function (regSessions, statusCode) {
														if (statusCode != 200) {
															saveSessionToLocalDB(true, sessionObjectResponse, duration, req, res, null)
															res.status(404).send("Error occured while assigning attendee to meeting. Your meeting has been created with errors : <br/>" + getAPIErrorMsg(regSessions) + "<br/>   Please reload the page.");
														} else {
															async.waterfall([
																function (callback) {
																	saveSessionToLocalDB(true, sessionObjectResponse, duration, req, res, function (err, session) {
																		callback(null, session) // this should be called after the response of saveSessionToLocalDB
																	});
																},
																function (session, callback1) {
																	saveRegistrationSessionToLocalDB(regSessions, req, res, session.sessionId, function (err, regSession) {
																		callback1(null, session) // this should be called after the response of saveRegistrationSessionToLocalDB
																	});
																}
															], function (err, response) {
																if (err) {
																	logger.error(err)
																} else {
																	res.jsonp({
																		"gridSessionInstanceDTO": response
																	})
																}
															})
														}
													});
												} else {
													saveSessionToLocalDB(true, sessionObjectResponse, duration, req, res, null);
												}
											});
										}
									});
								}
							});
						}
					});
				} else {
					res.status(404).send("Error occured while creating meeting : " + getAPIErrorMsg(data));
				}
			}, function (error) {
				res.status(404).send("Error occured while creating meeting");
			});
		} else {
			var meetingPostObject = {
				sessionLevel: req.body.meetingObject.level,
				sessionType: req.body.meetingObject.typeName,
				abstractDes: req.body.meetingObject.abstractDesc ? req.body.meetingObject.abstractDesc : "CMM Meeting",
				name: req.body.meetingObject.sessionTitle,
				capacity: req.body.meetingObject.capacity,
				duration: duration,
				notes: req.body.meetingObject.notes ? req.body.meetingObject.notes : "",
				status: req.body.meetingObject.status ? req.body.meetingObject.status : "Qualified",
				eventTrack: req.body.meetingObject.trackName,
				description: req.body.meetingObject.sessionDescription
			}
			var encoded_url = encodeURI('/svcs/api/3.0/accounts/' + req.body.accountCode + '/events/' + req.body.eventCode + '/sessions/' + req.body.meetingObject.sessionCode);
			requestMaker.makeServerRequest(encoded_url, 'PUT', req.session.uuid, meetingPostObject, req.headers, function (sessiondata, statusCode) {
				if (statusCode != 200) {
					res.status(404).send("Error occured : <br/>" + getAPIErrorMsg(sessiondata));
				} else {
					var obj = {
						"locationCode": req.body.meetingObject.locationCode,
						"startDate": req.body.sessionInstance.startDate
					}
					encoded_url = encodeURI('/svcs/api/3.0/accounts/' + req.body.accountCode + '/events/' + req.body.eventCode + '/locations/' + req.body.meetingObject.locationCode + '/sessions/' + req.body.meetingObject.instanceId);
					/*------------------Schedule Session Update-------------------*/
					requestMaker.makeServerRequest(encoded_url, 'PUT', req.session.uuid, obj, req.headers, function (locationData, statusCode) {
						if (statusCode != 200) {
							res.status(404).send("Error occured : <br/>" + getAPIErrorMsg(locationData));
						} else {
							/*--------------Publish Session For All--------------*/
							var obj = {
								"attendeetypes": "all"
							}
							encoded_url = encodeURI('/svcs/api/3.0/accounts/' + req.body.accountCode + '/events/' + req.body.eventCode + '/sessions/' + req.body.meetingObject.sessionCode + '/publish');
							requestMaker.makeServerRequest(encoded_url, 'PUT', req.session.uuid, obj, req.headers, function (publishData, statusCode) {
								if (statusCode != 200 && statusCode != 404) {
									res.status(404).send("Error occured : <br/>" + getAPIErrorMsg(publishData));
								} else {
									/*--------Avoiding error if it comes with a message that is is already published---------------*/
									if (statusCode == 404 && getAPIErrorMsg(publishData).indexOf('is already published') < 0) {
										res.status(404).send("Error occured : <br/>" + getAPIErrorMsg(publishData));
									} else {
										var encoded_url = encodeURI('/svcs/api/3.0/accounts/' + req.body.accountCode + '/events/' + req.body.eventCode + '/sessions/list?sessionCode=' + req.body.meetingObject.sessionCode);
										requestMaker.makeServerRequest(encoded_url, 'GET', req.session.uuid, {}, req.headers, function (sessionDataById, statusCode) {
											sessionObjectResponse = sessionDataById.sessions[0];
											if ((req.body.regCodesToPublish && req.body.regCodesToPublish.length > 0) || (req.body.regCodesToUnpublish && req.body.regCodesToUnpublish.length > 0)) {
												mappings = getRegistrationToSessionMapping(req.body.regCodesToPublish, req.body.regCodesToUnpublish, "Registered", "Cancelled");
												var encoded_url = encodeURI('/svcs/api/3.0/accounts/' + req.body.accountCode + '/events/' + req.body.eventCode + '/sessions/' + sessionObjectResponse.instanceId + "/registrations/bulkAssign");
												requestMaker.makeServerRequest(encoded_url, 'POST', req.session.uuid, mappings, req.headers, function (regSessions, statusCode) {
													if (statusCode != 200) {
														saveSessionToLocalDB(false, sessionObjectResponse, duration, req, res, null);
														res.status(404).send("Error occured while assigning attendee to meeting. Your meeting has been created with errors : <br/>" + getAPIErrorMsg(regSessions) + "<br/>   Please reload the page.");
													} else {
														async.waterfall([
															function (callback) {
																saveSessionToLocalDB(false, sessionObjectResponse, duration, req, res, function (err, session) {
																	callback(null, session)
																});
															},
															function (session, callback1) {
																saveRegistrationSessionToLocalDB(regSessions, req, res, session.sessionId, function (err, regSession) {
																	callback1(null, session)
																});
															}
														], function (err, response) {
															if (err) {
																logger.error(err)
															} else {
																res.jsonp({
																	"gridSessionInstanceDTO": response
																})
															}
														})
													}
												});
											} else {
												saveSessionToLocalDB(false, sessionObjectResponse, duration, req, res, null);
											}
										});
									}
								}
							});
						}
					});
				}
			});
		}
	}

	function saveRegistrationSessionToLocalDB(regSessions, req, res, sessionId, cb) {
		async.mapSeries(regSessions, function (regSession, cb1) {
			regCode = regSession.registrationCode;
			schema.model('RegistrationSession').forge().where({
				eventCode: req.body.eventCode,
				accountCode: req.body.accountCode,
				sessionId: sessionId,
				registrationCode: regCode,
				isPublished: 1
			}).fetch().then(function (rs) {
				if (regSession.status != "Cancelled" && regSession.successApiResponse.status == "200") {
					if (rs) {
						rs.save({
							registrationSessionStatus: regSession.status,
							isLocalModified: 0,
							isPublished: 1
						}, {
							method: 'update',
							patch: true,
							require: false
						}).then(function (result) {
							cb1(null, result);
						}).catch(function (err) {
							logger.error(err);
							cb(err, null)
						})
					} else {
						schema.model('RegistrationSession').forge().save({
							sessionId: sessionId,
							eventCode: req.body.eventCode,
							portalId: req.headers.portal_id,
							registrationCode: regCode,
							isLocalModified: 0,
							localDateModified: null,
							syncDate: null,
							accountCode: req.body.accountCode,
							registrationSessionStatus: regSession.status,
							isPublished: 1
						}).then(function (result) {
							cb1(null, result)
						}).catch(function (err) {
							logger.error(err);
							cb(err, null)
						})
					}
				} else {
					if (rs) {
						rs.save({
							registrationSessionStatus: regSession.status,
							isLocalModified: 0,
							isPublished: 0
						}, {
							method: 'update',
							patch: true,
							require: false
						}).then(function (result) {
							cb1(null, result)
						})
					} else {
						cb1(null, null)
					}
				}
			}).catch(function (err) {
				logger.error('Error occurred in getAllSessions API: ', err)
				cb(err, null)
			});
		}, function (err, response) {
			if (err) {
				logger.error(err);
				cb(null, regSessions)
			} else {
				cb(null, regSessions)
			}
		})
	}

	function getRegistrationToSessionMapping(regCodeToPublish, regCodeToUnPublish, status, cancellStatus) {
		var regSessionMapping = [];
		if (regCodeToPublish != null) {
			for (regCode in regCodeToPublish) {
				var item = {};
				item.registrationCode = regCodeToPublish[regCode];
				item.status = status;
				regSessionMapping.push(item);
			}
		}
		if (regCodeToUnPublish != null) {
			for (regCode in regCodeToUnPublish) {
				var item = {};
				item.registrationCode = regCodeToUnPublish[regCode];
				item.status = cancellStatus;
				regSessionMapping.push(item);
			}
		}

		return regSessionMapping;
	}

	function updateRegistrationStatusLabel(registrationCode, status, req, res, callback) {
		var reqObj = {};
		if (registrationCode == null || registrationCode == '' || registrationCode == 'CMM Meeting') {
			if (callback) {
				return callback(null, null)
			} else return;
		}
		schema.model('Registration').forge().where({
			eventCode: req.body.eventCode,
			accountCode: req.body.accountCode,
			portalId: req.headers.portal_id,
			registrationCode: registrationCode
		}).fetch().then(function (_registration) {
			if (_registration) {
				_registration = _registration.toJSON()
				reqObj.profile = {
					firstName: _registration.firstName,
					lastName: _registration.lastName,
					pin: _registration.pin
				}
				reqObj.registrationStatusLabel = status;
				requestMaker.makeServerRequest('/certainExternal/service/v1/Registration/' + req.body.accountCode + '/' + req.body.eventCode + '/' + registrationCode,
					'POST', req.session.uuid, reqObj, req.headers,
					function (data, statusCode) {
						if (statusCode == 200 && data) {
							schema.model('Registration').forge().where({
								eventCode: req.body.eventCode,
								accountCode: req.body.accountCode,
								portalId: req.headers.portal_id,
								registrationCode: registrationCode
							}).save({
								registrationStatusLabel: status
							}, {
								method: 'update',
								patch: true,
								require: false
							}).then(function (result) {
								callback(null, result)
							}).catch(function (err) {
								logger.error("Error occurred while updating registration status label at local db: ", err)
								callback(err, null)
							})
						} else {
							logger.error("Error occurred while update registration status: ", "\\ Error: ", statusCode, " data: ", JSON.stringify(data))
							callback(JSON.stringify(data), null)
						}
					},
					function (error) {
						logger.error("Error occurred while updating registration status: ", error);
						callback(error, null)
					})
			} else {
				callback(null, null)
			}
		}).catch(function (err) {
			logger.error("Error occurred while updating registration status")
			callback(err, null)
		})
	}
	//Function Definition: 
	// function saveSessionToLocalDB(isNew, sessionObj, duration, req, res, cb){
	// 	//after everything is done where right now we are sending res.jsonp/res.send, there will be cb
	// 	cb(null, data) //first parameter is err, second is data to send(i.e, session)
	// }

	function saveSessionToLocalDB(isNew, sessionObj, duration, req, res, cb) {
		if (isNew) {
			var regStatus = 'Scheduled - ' + sessionObj.typeName;
			var obj = {};
			obj.instanceId = sessionObj.instanceId;
			obj.typeName = sessionObj.typeName;
			obj.abstractDesc = sessionObj.abstractDesc;
			obj.sessionTitle = sessionObj.sessionTitle;
			obj.sessionCode = sessionObj.sessionCode;
			obj.capacity = sessionObj.capacity;
			obj.noOfInstances = 1; //As we will create only one instance everytime for new meeting
			obj.duration = duration;
			obj.trackName = sessionObj.trackName;
			obj.notes = sessionObj.notes;
			obj.level = sessionObj.level;
			obj.status = "Published"; // We will only get published session on success full call execution
			obj.startTime = sessionObj.startTime
			obj.endTime = sessionObj.endTime;
			obj.locationCode = sessionObj.locationCode;
			obj.portalId = req.headers.portal_id;
			obj.session_dateCreated = sessionObj.session_dateCreated;
			obj.session_dateModified = sessionObj.session_dateModified;
			obj.isLocalModified = 0;
			obj.eventId = req.body.eventId;
			obj.localDateModified = moment().unix();
			obj.syncDate = null;
			obj.sessionDescription = sessionObj.sessionDescription;
			schema.model('Session').forge().save(obj).then(function (session) {
				id = session
				var dbInstance = session.toJSON();
				dbInstance.sessionId = session.get('id');
				if (cb) {
					updateRegistrationStatusLabel(sessionObj.abstractDesc, regStatus, req, res, function (err, response) {
						cb(null, dbInstance)
					})
				} else {
					updateRegistrationStatusLabel(sessionObj.abstractDesc, regStatus, req, res, function (err, response) {
						return res.jsonp({
							"gridSessionInstanceDTO": dbInstance
						})
					})
				}
			}).catch(function (err) {
				logger.log('error', err)
				return res.status(404).send(err);
			})
		} else {
			schema.model('Session').forge().where({
				eventId: req.body.eventId,
				portalId: req.headers.portal_id,
				instanceId: sessionObj.instanceId
			}).fetch().then(function (session) {
				if (session) {
					session.save({
						typeName: sessionObj.typeName,
						abstractDesc: sessionObj.abstractDesc,
						sessionTitle: sessionObj.sessionTitle,
						capacity: sessionObj.capacity,
						duration: duration,
						trackName: sessionObj.trackName,
						notes: sessionObj.notes,
						level: sessionObj.level,
						status: (req.body.meetingObject && req.body.meetingObject.status) ? req.body.meetingObject.status : 'Published',
						startTime: sessionObj.startTime,
						endTime: sessionObj.endTime,
						locationCode: sessionObj.locationCode,
						portalId: req.headers.portal_id,
						session_dateCreated: sessionObj.session_dateCreated,
						session_dateModified: sessionObj.session_dateModified,
						isLocalModified: 0,
						localDateModified: moment().unix(),
						syncDate: null,
						sessionDescription: sessionObj.sessionDescription
					}, {
						method: 'update',
						patch: true
					}).then(function (result) {
						var dbInstance = result.toJSON();
						dbInstance.sessionId = result.get('id');
						if (cb) {
							cb(null, dbInstance);
						} else {
							res.jsonp({
								"gridSessionInstanceDTO": dbInstance
							})
						}
					})
				}
			}).catch(function (err) {
				logger.error('Error occurred in getAllSessions API: ', err)
			});
		}
	}


	controller.deleteMeetingByInstanceId = function (req, res, next) {
		var encoded_url = encodeURI('/svcs/api/3.0/accounts/' + req.body.accountCode + '/events/' + req.body.eventCode + '/sessions/' + req.body.meetingObject.sessionCode);
		requestMaker.makeServerRequest(encoded_url, 'DELETE', req.session.uuid, {}, req.headers, function (cancelledSession, statusCode) {
			if (statusCode != 200) {
				return res.status(404).send("Error occured : <br/>" + getAPIErrorMsg(cancelledSession));
			} else {
				var status = 'Cancelled - ' + req.body.meetingObject.typeName;
				updateRegistrationStatusLabel(req.body.meetingObject.abstractDesc, status, req, res, function (err, response) {})
				schema.model('RegistrationSession').forge().query(function (qb) {
					qb.where({
						eventCode: req.body.eventCode,
						accountCode: req.body.accountCode,
						portalId: req.headers.portal_id,
						sessionId: req.body.localSessionId
					}).del().then(function (deletedRegSession) {
						schema.model('Session').forge().query(function (qb) {
							qb.where({
								eventId: req.body.eventId,
								portalId: req.headers.portal_id,
								id: req.body.localSessionId
							}).del().then(function (delSession) {
								res.send("Successfully Deleted");
							}).catch(function (err) {
								res.status(404).send("Error occured while deleting meeting." + err);
							})
						})
					}).catch(function (err) {
						res.status(404).send("Error occured while deleting meeting." + err)
					})
				})
			}
		});
	}

	controller.updateMeetingOnDragAndDrop = function (req, res, next) {
		schema.model('SessionLocation').forge({
			locationId: req.body.resource,
			eventId: req.body.eventId
		}).fetch().then(function (location) {
			var locationCode = location.toJSON().locationCode;
			var duration = commonUtils.getMinuteDifferenceBetweenDates(new Date(req.body.startDate), new Date(req.body.endDate));
			var meetingPostObject = {
				duration: duration,
			}
			var encoded_url = encodeURI('/svcs/api/3.0/accounts/' + req.body.accountCode + '/events/' + req.body.eventCode + '/sessions/' + req.body.sessionCode);
			requestMaker.makeServerRequest(encoded_url, 'PUT', req.session.uuid, meetingPostObject, req.headers, function (sessiondata, statusCode) {
				if (statusCode != 200) {
					res.status(404).send("Error occured while updating meeting." + getAPIErrorMsg(sessiondata));
				} else {
					var obj = {
						"locationCode": locationCode,
						"startDate": req.body.startDate
					}
					encoded_url = encodeURI('/svcs/api/3.0/accounts/' + req.body.accountCode + '/events/' + req.body.eventCode + '/locations/' + locationCode + '/sessions/' + req.body.instanceId);
					/*------------------Schedule Session Update-------------------*/
					requestMaker.makeServerRequest(encoded_url, 'PUT', req.session.uuid, obj, req.headers, function (locationData, statusCode) {
						if (statusCode != 200) {
							res.status(404).send("Error occured : <br/>" + getAPIErrorMsg(locationData));
						} else {
							var encoded_url = encodeURI('/svcs/api/3.0/accounts/' + req.body.accountCode + '/events/' + req.body.eventCode + '/sessions/' + req.body.instanceId);
							requestMaker.makeServerRequest(encoded_url, 'GET', req.session.uuid, {}, req.headers, function (sessionDataById, statusCode) {
								sessionObjectResponse = sessionDataById;
								saveSessionToLocalDB(false, sessionObjectResponse, duration, req, res)
							});
						}
					});
				}
			});
		}).catch(function (err) {
			logger.error('Error occurred in update meeting on drag and drop', err);
			res.status(404).send("Error occurred in update meeting on drag and drop");
		});
	}

	controller.changeDefaultEvent = function (req, res, next) {
		schema.model('Event').forge().where({
			portalId: req.headers.portal_id
		}).save({
			'isDefault': false
		}, {
			patch: true,
			method: 'update'
		}).then(function (x) {
			schema.model('Event').forge().where({
				portalId: req.headers.portal_id,
				eventId: req.body.eventId
			}).save({
				'isDefault': true
			}, {
				patch: true,
				method: 'update'
			}).then(function (x) {
				return res.send();
			});
		}).catch(function (err) {
			schema.model('Event').forge().where({
				portalId: req.headers.portal_id,
				eventId: req.body.eventId
			}).save({
				'isDefault': true
			}, {
				patch: true,
				method: 'update'
			}).then(function (x) {
				return res.send();
			});
		});;
	}


	controller.checkInAttendees = function (req, res, next) {
		mapping = {
			"registrationCode": req.body.regCode,
			"status": req.body.status
		};
		var encoded_url = encodeURI('/svcs/api/3.0/accounts/' + req.body.accountCode + '/events/' + req.body.eventCode + '/sessions/' + req.body.instanceId + "/registrations");
		requestMaker.makeServerRequest(encoded_url, 'POST', req.session.uuid, mapping, req.headers, function (regSessions, statusCode) {
			if (statusCode != 200) {
				return res.status(404).send("Error occured while CheckIn registration to meeting. : <br/>" + getAPIErrorMsg(regSessions) + "<br/>");
			} else {
				regCode = req.body.regCode;
				schema.model('RegistrationSession').forge().where({
					eventCode: req.body.eventCode,
					accountCode: req.body.accountCode,
					sessionId: req.body.sessionId,
					registrationCode: regCode,
					isPublished: 1
				}).fetch().then(function (rs) {
					if (regSessions.status != "Cancelled") {
						if (rs) {
							rs.save({
								registrationSessionStatus: req.body.status,
								isLocalModified: 0,
								isPublished: 1
							}, {
								method: 'update',
								patch: true
							}).then(function (result) {
								return res.send("Successfully Checked In")
							})
						} else {
							return res.send("Successfully Checked In")
						}
					} else {
						return res.send("Successfully Checked In")
					}
				}).catch(function (err) {
					logger.error('Error Occured in Chechin Reg to local DB', err)
					return res.status(500).send("Internal Server error Occurred")
				});
			}
		});
	}

	controller.getAllowedAttendeeTypes = function (req, res, next) {
		schema.model('AttendeeType').forge().where({
			eventId: req.query.eventId,
			portalId: req.headers.portal_id,
			active: 1,
			isAllowed: 1
		}).query(function (qb) {
			qb.debug(queryDebugMode)
		}).fetchAll().then(function (results) {
			if (results == null) {
				results = []
			}
			return res.jsonp(results.toJSON())
		}).catch(function (err) {
			logger.error("Error occurred in getAllowedAttendeeTypes API: ", err)
			return res.status(500).send(err.message)
		})
	}

	controller.getAttendeeTypes = function (req, res, next) {
		schema.model('AttendeeType').forge().where({
			eventId: req.query.eventId,
			portalId: req.headers.portal_id,
			active: 1
		}).query(function (qb) {
			qb.debug(queryDebugMode)
		}).fetchAll().then(function (results) {
			if (results == null) {
				results = []
			}
			return res.jsonp(results.toJSON())
		}).catch(function (err) {
			logger.error("Error occurred in getAttendeeTypes API: ", err)
			return res.status(500).send(err.message)
		})
	}

	controller.saveAllowedAttendeeTypes = function (req, res, next) {
		async.series([
			function (disAllowedAllAttendeeType) {
				schema.model('AttendeeType').forge().where({
					eventId: req.body.eventId,
					portalId: req.headers.portal_id,
					active: 1
				}).fetchAll().then(function (attendeeTypes) {
					if (attendeeTypes == null) {
						attendeeTypes = [];
					}
					async.mapSeries(attendeeTypes.toJSON(), function (at, cb) {
						schema.model('AttendeeType').forge().where({
							eventId: req.body.eventId,
							portalId: req.headers.portal_id,
							active: 1,
							code: at.code
						}).fetch().then(function (result) {
							if (result) {
								result.save({
									isAllowed: 0
								}, {
									method: 'update',
									patch: true,
									require: false
								}).then(function (result) {
									cb(null, at)
								}).catch(function (err) {
									logger.error("Error occurred in saveAllowedAttendeeTypes API, when updating data: ", err)
									cb(err, null)
								})
							} else {
								logger.error("Error occurred in saveAllowedAttendeeTypes API, No attendee type found!!")
								cb(null, null)
							}
						}).catch(function (err) {
							logger.error("Error occurred in saveAllowedAttendeeTypes API, when fetching data: ", err)
							cb(err, null)
						})
					}, function (err, response) {
						if (err) {
							logger.error("Error occurred in saveAllowedAttendeeTypes API: ", err)
							disAllowedAllAttendeeType(err, null)
						} else {
							disAllowedAllAttendeeType(null, attendeeTypes)
						}
					})
				}).catch(function (err) {
					logger.error("Error occurred in saveAllowedAttendeeTypes API, when fetching all attendee types: ", err)
					disAllowedAllAttendeeType(err, null)
				})
			},
			function (updatedAllowedAttendeeType) {
				async.mapSeries(req.body.allowedAttendeeTypes, function (attendeeType, cb) {
					schema.model('AttendeeType').forge().where({
						eventId: req.body.eventId,
						portalId: req.headers.portal_id,
						active: 1,
						code: attendeeType.code
					}).fetch().then(function (attendeeType) {
						if (attendeeType) {
							var _isDefault = 0;
							if (attendeeType.toJSON().code == req.body.defaultAttendeeType.code) {
								_isDefault = 1;
							}
							attendeeType.save({
								isAllowed: 1,
								isDefaultAttendeeType: _isDefault
							}, {
								method: 'update',
								patch: true,
								require: false
							}).then(function (updatedAttendeeType) {
								cb(null, attendeeType.toJSON())
							}).catch(function (err) {
								logger.error("Error occurred in saveAllowedAttendeeTypes API, when updating attendee type: ", err)
								cb(err, null)
							})
						} else {
							logger.error("Error occurred in saveAllowedAttendeeTypes API, No attendee type found: ")
							cb(null, null)
						}
					}).catch(function (err) {
						logger.error("Error occurred in saveAllowedAttendeeTypes API, when fetching attendee type: ", err)
						cb(err, null)
					})
				}, function (err, response) {
					if (err) {
						logger.error("Error occurred in saveAllowedAttendeeTypes API: ", err)
						updatedAllowedAttendeeType(err, null)
					} else {
						updatedAllowedAttendeeType(null, response)
					}
				})
			}
		], function (err, response) {
			if (err) {
				logger.error("Error occurred in saveAllowedAttendeeTypes API: ", err)
				return res.status(500).send(err.message)
			} else {
				return res.jsonp(req.body.allowedAttendeeTypes)
			}
		})
	}

	controller.getDefaultAttendeeType = function (req, res, next) {
		schema.model('AttendeeType').forge().where({
			eventId: req.query.eventId,
			portalId: req.headers.portal_id,
			active: 1,
			isAllowed: 1,
			isDefaultAttendeeType: 1
		}).query(function (qb) {
			qb.debug(queryDebugMode)
		}).fetch().then(function (result) {
			if (result == null) {
				result = {}
			}
			return res.jsonp(result)
		}).catch(function (err) {
			logger.error("Error occurred in getDefaultAttendeeType API: ", err)
			return res.status(500).send(err.message)
		})
	}

	controller.validateUserAgainstEmail = function (req, res, next) {
		var encoded_url = encodeURI('/certainExternal/service/v1/Registration/' + req.body.accountCode + '/' + req.body.eventCode + '?isActive=true&email=' + req.body.email);
		requestMaker.makeServerRequest(encoded_url, 'GET', req.session.uuid, {}, req.headers, function (data, statusCode) {
			if (statusCode == 200) {
				if (data) {
					res.jsonp(data);
				} else {
					return res.status(404).send("No Data Found");
				}
			} else {
				if (statusCode == 403) {
					return res.status(403).send();
				} else {
					return res.status(404).send("No Data Found");
				}
			}
		});
	}

	controller.bulkAssignRegistrationToSession = function (req, res, next) {
		var encoded_url = encodeURI('/svcs/api/3.0/accounts/' + req.body.accountCode + '/events/' + req.body.eventCode + '/sessions/' + req.body.instanceId + "/registrations/bulkAssign");
		requestMaker.makeServerRequest(encoded_url, 'POST', req.session.uuid, req.body.regSessions, req.headers, function (regSessions, statusCode) {
			if (statusCode != 200) {
				res.status(404).send("Error occured while assigning attendee to meeting." + getAPIErrorMsg(regSessions));
			} else {
				saveRegistrationSessionToLocalDB(regSessions, req, res, req.body.sessionId, function (err, regSession) {
					res.status(200).send("Successfully Done.")
				});
			}
		});
	}

	controller.getVersionData = function (req, res, next) {
		svn_update.setSVNRevisionData();
		setTimeout(function () {
			var versiondata = svn_update.getSVNRevisionData();
			res.send(versiondata);
		}, 1000)
	}

	controller.saveDefaultMeetingType = function (req, res, next) {
		schema.model('SessionType').forge().where({
			eventId: req.body.eventId,
			portalId: req.headers.portal_id,
			isDefault: 1
		}).query(function (qb) {
			qb.debug(queryDebugMode)
		}).save({
			isDefault: 0
		}, {
			update: true,
			patch: true,
			require: false
		}).then(function (result) {
			if (req.body.typeId) {
				schema.model('SessionType').forge().where({
					eventId: req.body.eventId,
					portalId: req.headers.portal_id,
					typeId: req.body.typeId
				}).query(function (qb1) {
					qb1.debug(queryDebugMode)
				}).save({
					isDefault: 1
				}, {
					update: true,
					patch: true,
					require: false
				}).then(function (defaultSessionType) {
					return res.jsonp(defaultSessionType.toJSON())
				}).catch(function (err) {
					logger.error("Error occurred in saveDefaultMeetingType while setting default meeting type: ", err)
					return res.status(500).send(err.message)
				})
			} else {
				return res.jsonp("No default meeting type selected.")
			}
		}).catch(function (err) {
			logger.error("Error occurred in saveDefaultMeetingType while removing previous default meeting type: ", err)
			return res.status(500).send(err.message);
		})
	}

	controller.getAttendeeBySessionId = function (req, res, next) {
		schema.model('Registration').forge().query(function (qb) {
			qb.join('registration_session', function () {
				this.on('registration.registrationCode', '=', 'registration_session.registrationCode')
					.onIn('registration_session.eventCode', [req.query.eventCode])
					.onIn('registration_session.accountCode', [req.query.accountCode])
					.onIn('registration_session.portalId', [req.headers.portal_id])
					.onIn('registration_session.isPublished', [1])
			}).join('session', function () {
				this.on('registration_session.sessionId', '=', 'session.id')
					.onIn('session.eventId', [req.query.eventId])
					.onIn('session.portalId', [req.headers.portal_id])
					.onIn('session.id', [req.query.sessionId])
			}).where({
				'registration.eventCode': req.query.eventCode,
				'registration.accountCode': req.query.accountCode,
				'registration.portalId': req.headers.portal_id
			}).debug(queryDebugMode)
		}).fetchAll({
			columns: ['registration.firstName', 'registration.lastName', 'registration.organization',
				'registration.position', 'registration.registrationCode', 'registration_session.registrationSessionStatus'
			]
		}).then(function (results) {
			if (results == null || results == undefined) {
				results = []
			}
			return res.jsonp(results.toJSON())
		}).catch(function (err) {
			logger.error("Error occurred in getAttendeeBySessionId API: ", err)
			return res.status(500).send(err.message)
		})
	}

	controller.getSessionsData = function (req, res, next) {
		requestMaker.makeServerRequest('/svcs/api/3.0/accounts/' + req.query.accountCode + '/events/' + req.query.eventCode + '/sessions', 'GET', req.session.uuid, {}, req.headers, function (sessionData, statusCode) {
			if (statusCode == 401 || statusCode == 403) {
				res.status(statusCode).send("Error occurred while getting sessions data: " + getAPIErrorMsg(sessionData));
			} else {
				res.jsonp("Certain Session is Active")
			}
		})
	}

	return controller;
}