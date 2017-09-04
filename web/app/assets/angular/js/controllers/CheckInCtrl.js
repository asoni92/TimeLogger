var CheckInCtrl = concurApp.controller('CheckInCtrl', ['$scope', '$rootScope', 'CalendarFctry', '$modalInstance', 'meetingEvent', '$filter', 'GlobalMethodService', 'GlobalVariableService', 'SessionFactory', 'locations', 'notificationService', '$http', 'MeetingInfoFctry', 'event', 'meetingTypes', 'isBlockedEvent', 'tracks', 'eachSeries', '$q', '$timeout', function ($scope, $rootScope, CalendarFctry, $modalInstance, meetingEvent, $filter, GlobalMethodService, GlobalVariableService, SessionFactory, locations, notificationService, $http, MeetingInfoFctry, event, meetingTypes, isBlockedEvent, tracks, eachSeries, $q, $timeout) {
    $scope.isBlockedEvent = isBlockedEvent;
    $scope.tracks = tracks;
    $scope.event = event;
    $scope.statuses = [];
    $scope.meetingTypes = meetingTypes;
    $scope.meetingType = {}

    var defaultMeeting = $filter("filter")($scope.meetingTypes, {
        isDefault: 1
    })

    if (defaultMeeting && defaultMeeting.length > 0) {
        $scope.meetingType.id = defaultMeeting[0].typeId
    } else {
        $scope.meetingType.id = $scope.meetingTypes[0].typeId;
    }

    $scope.meetingEvent = meetingEvent;
    $scope.isUpdate = false;
    $scope.dateTimeFormat = 'MM/dd/yyyy h:mm a';
    $scope.locations = locations;
    $scope.registeredAttendees = [];

    $scope.initialRegCodes = [];
    $scope.regCodesToPublish = [];
    $scope.regCodesToUnPublish = [];

    $scope.deletedAttendeeItems = [];

    $scope.meetingObject = {};
    $scope.sessionTimeHandler = {};
    $scope.attendeesBySearch = [];
    $scope.loading = true;
    $scope.loadCount = 0;
    $scope.regDetail = {};
    $scope.attendeeSearchObject = {};

    if ($scope.meetingEvent.id != null) {
        $scope.isUpdate = true;
    } else {
        $scope.isUpdate = false;
    }

    $scope.updateDuration = function (duration) {
        var endTime = $scope.sessionTimeHandler.startTime + (duration * 3600);
        $scope.sessionTimeHandler.endTime = endTime;
    }

    $scope.getSessionLevels = function () {
        var requestObject = {
            eventId: $scope.event.eventId,
            eventCode: $scope.event.eventCode,
            accountCode: $scope.event.accountCode
        }
        $scope.sessionLevels = [];
        SessionFactory.getSessionLevels(requestObject).then(function (data) {
            $scope.sessionLevels = data;
        });
    }

    $scope.getSessionLevels();

    $scope.unAssignSession = function () {
        var tempRegisteredAttendees = []
        var tempRegisteredAttendeesCodes = []
        angular.forEach($scope.registeredAttendees, function (v, k) {
            if ($scope.deletedAttendeeItems.indexOf(v.regCode) < 0) {
                tempRegisteredAttendeesCodes.push(v.regCode);
                tempRegisteredAttendees.push(v);
            } else {
                $scope.regCodesToUnPublish.push(v.regCode);
            }
        })
        $scope.deletedAttendeeItems = [];
        $scope.registeredAttendees = tempRegisteredAttendees;
        $scope.regCodesToPublish = [];
        angular.forEach($scope.registeredAttendees, function (v, k) {
            $scope.regCodesToPublish.push(v.regCode);
        })
    }

    $scope.addToDeleteList = function (regCode) {
        if ($scope.deletedAttendeeItems.indexOf(regCode) < 0) {
            $scope.deletedAttendeeItems.push(regCode);
        } else {
            $scope.deletedAttendeeItems.splice($scope.deletedAttendeeItems.indexOf(regCode), 1);
        }

    }
    $scope.addRegistrationToRegisteredAttendees = function (reg) {
        if ($scope.regCodesToPublish.indexOf(reg.registrationCode) >= 0) {
            return;
        }
        reg.regCode = reg.registrationCode;
        $scope.registeredAttendees.push(reg);
        $scope.regCodesToPublish.push(reg.registrationCode);
    }

    $scope.setCustomStartAndEndTime = function () {
        now = new Date();
        if ($scope.meetingEvent.id == null) {
            var utcTimeStamp = (new Date(meetingEvent.startTime).getTime() + now.getTimezoneOffset() * 60000);
            $scope.sessionTimeHandler.startTime = utcTimeStamp;
            var utcTimeStamp = (new Date(meetingEvent.endTime).getTime() + now.getTimezoneOffset() * 60000);
            $scope.sessionTimeHandler.endTime = utcTimeStamp;
        } else {
            var utcTimeStamp = meetingEvent.startDate.substring(0, 19).replace("T", " ");
            $scope.sessionTimeHandler.startTime = new Date(utcTimeStamp);
            var utcTimeStamp = meetingEvent.endDate.substring(0, 19).replace("T", " ");
            $scope.sessionTimeHandler.endTime = new Date(utcTimeStamp);
        }

    }

    $scope.setCustomStartAndEndTime();


    $scope.getRegistrationByFilter = function () {
        if (GlobalMethodService.validateRequiredFields($scope.attendeeSearchObject.firstName) || (GlobalMethodService.validateRequiredFields($scope.attendeeSearchObject.lastName))) {

            if ($scope.attendeeSearchObject.firstName == null || $scope.attendeeSearchObject.firstName == '') {
                searchTerm = $scope.attendeeSearchObject.lastName;
            } else {
                searchTerm = $scope.attendeeSearchObject.firstName;
            }
            var requestObject = {
                eventId: $scope.event.eventId,
                eventCode: $scope.event.eventCode,
                accountCode: $scope.event.accountCode,
                searchTerm: $scope.attendeeSearchObject
            }
            SessionFactory.getRegistrationByFilter(requestObject).then(function (data) {
                $scope.registrations = data.data;
                $scope.showSearch = true;
            }, function () {
                $scope.showSearch = false;
            })
        } else {
            notificationService.info("Please enter either first or last name to search for an attendee.")
            $scope.showSearch = false;
        }
    }


    // Time Picker Initializatio
    $scope.initializeTimeOptions = function () {
        $scope.hstep = 1;
        $scope.mstep = 5;
        $scope.ismeridian = true;
    }
    $scope.initializeTimeOptions();

    $scope.getAnswerNameByCode = function (answerCode, answers) {
        var name = "";
        angular.forEach(answers, function (v, k) {
            if (v.answerCode == answerCode) {
                name = v.answerName;
            }
        })
        return name;
    }

    $scope.getAnswerLabelByCode = function (answerCode, answers) {
        var label = "";
        angular.forEach(answers, function (v, k) {
            if (v.answerCode == answerCode) {
                label = v.answerLabel;
            }
        })
        return label;
    }


    $scope.setMeetingInvitor = function (registrationCode) {
        $scope.regDetail = {};
        $scope.questionAnswerMapping2 = {};
        if (registrationCode != null) {
            var requestObject = {
                regCode: registrationCode,
                eventCode: $scope.event.eventCode,
                accountCode: $scope.event.accountCode
            }
            SessionFactory.getRegistrationAnswersByRegCode(requestObject).then(function (data) {
                $scope.meetingInviter = data;
                $scope.regDetail.firstName = data.firstName;
                $scope.regDetail.lastName = data.lastName;
                $scope.regDetail.email = data.email;
                $scope.regDetail.position = data.position;
                $scope.regDetail.phone = data.phone;
                $scope.regDetail.organization = data.organization;
                $scope.regDetail.mobile = data.phoneMobile
                angular.forEach(data.questions, function (v, k) {
                    questionId = v.questionId;
                    var questionObj = $scope.getQuestionDataById(questionId);
                    if (questionObj.questionTypeId == 1 || questionObj.questionTypeId == 2) {
                        value = null;
                        angular.forEach(v.answers, function (vv, kk) {
                            value = vv.value;
                        })
                        $scope.questionAnswerMapping2[questionId] = value;
                    } else if (questionObj.questionTypeId == 4 || questionObj.questionTypeId == 6) {
                        var obj = [];
                        angular.forEach(v.answers, function (vv, kk) {
                            obj.push(vv.answerCode);
                        })
                        $scope.questionAnswerMapping2[questionId] = obj;
                    } else if (questionObj.questionTypeId == 5 || questionObj.questionTypeId == 7) {
                        var obj = [];
                        angular.forEach(v.answers, function (vv, kk) {
                            var temp = {};
                            temp.answerName = $scope.getAnswerNameByCode(vv.answerCode, questionObj.answers);
                            temp.answerLabel = $scope.getAnswerLabelByCode(vv.answerCode, questionObj.answers);
                            temp.answerCode = vv.answerCode;
                            obj.push(temp);
                        })
                        $scope.questionAnswerMapping2[questionId] = obj;
                    }
                    $scope.isInitialized = true;
                })
                $scope.isInitialized = true;
                $scope.loading = false;
            }, function () {
                $scope.loading = false;
            })
        } else {
            $scope.loading = false;
        }
    }

    $scope.removeHtml = function (html) {
        html = html.replace(/&nbsp;/gi, '');
        var regex = /(<([^>]+)>)|(&lt;([^>]+)&gt;)/ig;
        return html.replace(regex, "");
    }

    $scope.getSessionObjectById = function (session) {
        var requestObject = {
            "sessionId": session.id,
            "eventId": $scope.event.eventId
        };
        SessionFactory.getSessionById(requestObject).then(function (data) {
            $scope.meetingObject = data;
            if ($scope.meetingObject.level == 'Blocked') {
                $scope.isBlockedEvent = true;
            }
            if ($scope.meetingObject.notes != null) {
                $scope.meetingType = {
                    id: parseInt($scope.meetingObject.notes)
                };
                if (!isNaN($scope.meetingType.id)) {
                    $scope.getConfigData();
                }
            } else {
                $scope.meetingType = {
                    id: $scope.meetingTypes[0].typeId
                };
            }
            $scope.setMeetingInvitor($scope.meetingObject.abstractDesc);
            $scope.loading = false;
            $scope.isInitialized = true;
        });
    }

    $scope.updateDuration = function (duration) {
        var endTime = moment($scope.sessionTimeHandler.startTime).add('m', duration).unix() * 1000;
        $scope.sessionTimeHandler.endTime = endTime;
        $scope.meetingObject.startTime = moment($scope.sessionTimeHandler.startTime).format("MM/DD/YYYY hh:mm a");
        $scope.meetingObject.endTime = moment($scope.sessionTimeHandler.endTime).format("MM/DD/YYYY hh:mm a");
    }


    $scope.init = function () {
        $scope.loading = true;
        var reqObj = {
            eventCode: $scope.event.eventCode,
            accountCode: $scope.event.accountCode
        }
        SessionFactory.getSessionsData(reqObj).then(function (data) {
            if (data) {
                $scope.getAllowedAttendeeType();
                $scope.getOnSiteConfigData()
                $scope.questionAnswerMapping2 = {};
                if ($scope.meetingEvent.id != null) {
                    $scope.isUpdate = true;
                    $scope.getSessionObjectById($scope.meetingEvent);
                    $scope.$watch('allowedAttendeeTypeNames', function (value) {
                        if (value) {
                            $scope.getAttendeesList($scope.meetingEvent);
                        }
                    })
                } else {
                    $scope.isUpdate = false;
                    $scope.meetingObject = {
                        instanceId: null,
                        typeName: 'Breakout Sessions',
                        abstractDesc: null,
                        sessionTitle: $scope.meetingObject.sessionTitle,
                        sessionCode: GlobalMethodService.getUniqueCode(20),
                        capacity: 100,
                        noOfInstances: 1,
                        duration: $scope.meetingObject.duration,
                        trackName: null,
                        notes: $scope.meetingTypes[0].typeId,
                        level: 'Scheduled',
                        status: 'Qualified',
                        startTime: $scope.meetingObject.startTime,
                        endTime: $scope.meetingObject.endTime,
                        locationCode: $scope.meetingEvent.resource.locationCode,
                        session_dateCreated: (new Date().getTime()),
                        session_dateModified: (new Date().getTime()),
                        isLocalModified: 1,
                        eventId: $scope.event.eventId,
                        localDateModified: (new Date().getTime()),
                        syncDate: null
                    }
                    $scope.regDetail = {};
                    if ($scope.isBlockedEvent) {
                        $scope.meetingObject.sessionTitle = "Blocked";
                    }
                    if ($rootScope.scheduledMeetingUser != null) {
                        $scope.setMeetingInvitor($rootScope.scheduledMeetingUser.registrationCode);
                    } else {
                        $scope.loading = false;
                    }
                }
            }
        }, function (error) {
            $scope.loading = false;
            notificationService.error("Error occurred: " + error.data)
        })
    }

    $scope.getAttendeesList = function (session) {
        $scope.initialRegCodes = [];
        $scope.regCodesToPublish = [];
        $scope.registeredAttendees = angular.copy(session.regAttendees);
        if ($scope.isUpdate) {
            $scope.registeredAttendees = [];
            angular.forEach(session.regAttendees, function (v, k) {
                if ($scope.allowedAttendeeTypeNames.indexOf(v.code) > -1) {
                    $scope.registeredAttendees.push(v);
                }
            })
        }
        angular.forEach($scope.registeredAttendees, function (v, k) {
            $scope.initialRegCodes.push(v.regCode);
            $scope.regCodesToPublish.push(v.regCode);
        })
        $scope.isInitialized = true;
    }

    $scope.createSessionInstanceToPublish = function () {
        var sessionInstance = {};
        sessionInstance.endDate = GlobalMethodService.getDateOrTimeByFormat($scope.sessionTimeHandler.endTime, $scope.dateTimeFormat);
        sessionInstance.startDate = GlobalMethodService.getDateOrTimeByFormat($scope.sessionTimeHandler.startTime, $scope.dateTimeFormat);
        sessionInstance.eventId = $scope.event.eventId;
        sessionInstance.resource = $scope.isUpdate ? $scope.meetingEvent.resourceId : $scope.meetingEvent.resource.id;
        sessionInstance.id = $scope.meetingEvent.id;
        return sessionInstance;
    }

    $scope.updateMeetingTime = function () {
        $scope.meetingObject.endTime = GlobalMethodService.getDateOrTimeByFormat($scope.sessionTimeHandler.endTime, $scope.dateTimeFormat);
        $scope.meetingObject.startTime = GlobalMethodService.getDateOrTimeByFormat($scope.sessionTimeHandler.startTime, $scope.dateTimeFormat);
    }

    $scope.addUpdateMeeting = function (registrationCode, oldRegCode) {
        if ($scope.isBlockedEvent) {
            $scope.meetingObject.level = 'Blocked';
            $scope.meetingObject.capacity = 1;
            $scope.meetingObject.abstractDesc = '';
        }
        if ($scope.meetingObject.trackName == null || $scope.meetingObject.trackName == '') {
            if ($scope.tracks == null || $scope.tracks.length <= 0) {
                notificationService.error("No track exists.");
                return;
            } else {
                $scope.meetingObject.trackName = $scope.tracks[0].trackName;
            }
        }
        $scope.loading = true;
        $scope.updateMeetingTime();
        var data = {};
        data.meetingObject = $scope.meetingObject;
        data.meetingObject.abstractDesc = oldRegCode ? oldRegCode : registrationCode;
        data.meetingObject.notes = $scope.meetingType.id;
        data.sessionInstance = $scope.createSessionInstanceToPublish();
        data.accountCode = $scope.event.accountCode;
        data.eventCode = $scope.event.eventCode;
        data.eventId = $scope.event.eventId;
        if (!$scope.isUpdate && !$scope.isBlockedEvent) {
            if (oldRegCode) {
                $scope.regCodesToPublish.push(oldRegCode)
            }
            $scope.regCodesToPublish.push(registrationCode);
        }
        data.regCodesToPublish = $scope.regCodesToPublish;
        data.regCodesToUnpublish = $scope.regCodesToUnPublish;
        data.queryObject = {
            "eventCode": $scope.event.eventCode,
            "accountCode": $scope.event.accountCode
        }
        data.sessionId = $scope.meetingEvent.sessionId;

        if ($scope.isBlockedEvent) {
            data.meetingObject.level = 'Blocked';
            data.meetingObject.capacity = 1;
            data.meetingObject.abstractDesc = '';
        }

        var sessionType = $filter("filter")($scope.meetingTypes, {
            typeId: $scope.meetingType.id
        })[0].sessionType;
        $scope.meetingObject.typeName = sessionType;
        SessionFactory.createUpdateMeeting(data).then(function (resp) {
            notificationService.success("Meeting Detail Updated Successfully.");
            if (!$scope.isUpdate && !$scope.isBlockedEvent) {
                $scope.createAndRegisterParticipants(resp.gridSessionInstanceDTO.sessionId, resp.gridSessionInstanceDTO.instanceId)
            } else {
                $scope.updateMeetingToCalendar(resp.gridSessionInstanceDTO.sessionId);
            }
        }, function (error) {
            $scope.loading = false;
            if (!$scope.isUpdate) {
                data.meetingObject.sessionCode = GlobalMethodService.getUniqueCode(20);
            }
            notificationService.error(error.data);
        })

    }

    $scope.getLocationName = function (id) {
        var locationName = "";
        angular.forEach($scope.locations, function (v, k) {
            if (v.id == id) {
                locationName = v.venue;
            }
        })
        return locationName;
    }
    $scope.getLocationName();

    $scope.customQuestionAnswer = {};

    $scope.validateRegData = function () {
        if (($scope.meetingObject == null || !(GlobalMethodService.validateRequiredFields($scope.meetingObject.sessionTitle)))) {
            notificationService.error("Meeting Name is required.");
            return;
        }
        if (!$scope.isBlockedEvent && !(GlobalMethodService.validateRequiredFields($scope.regDetail.firstName))) {
            notificationService.error("First Name is required.");
            return;
        }
        if (!$scope.isBlockedEvent && !(GlobalMethodService.validateRequiredFields($scope.regDetail.lastName))) {
            notificationService.error("Last Name is required.");
            return;
        }
        if (!$scope.isBlockedEvent && !(GlobalMethodService.validateRequiredFields($scope.regDetail.email))) {
            notificationService.error("Email is required.");
            return;
        }
        if (!$scope.isBlockedEvent && !GlobalMethodService.validateEmail($scope.regDetail.email)) {
            notificationService.error("Invalid Email.");
            return;
        }
        if ((new Date($scope.sessionTimeHandler.startTime).getTime()) > (new Date($scope.sessionTimeHandler.endTime).getTime())) {
            notificationService.error("Start Time cannot be greater than end time.");
            return;
        }
        var duration = GlobalMethodService.getMinuteDifferenceBetweenDates($scope.sessionTimeHandler.startTime, $scope.sessionTimeHandler.endTime);
        if (duration > 660) {
            notificationService.error("Duration can be of maximum 11 hrs.");
            return;
        }
        $scope.populateUnassignAndAssignData();
        if ($scope.isBlockedEvent) {
            $scope.addUpdateMeeting()
        } else if ($scope.isUpdate && $scope.meetingInviter != null && $scope.meetingInviter.registrationCode != null) {
            $scope.createRegistration();
        } else {
            $scope.validateRegCodeAgainstEmail();
        }
    }

    $scope.validateRegCodeAgainstEmail = function () {
        $scope.loading = true;
        req = {
            email: ($scope.regDetail.email).toLowerCase(),
            eventCode: $scope.event.eventCode,
            accountCode: $scope.event.accountCode
        }
        SessionFactory.validateUserAgainstEmail(req).then(function (data) {
            if ($rootScope.scheduledMeetingUser == null) {
                var exists = false;
                if (data != null && data.registrations != null) {
                    angular.forEach(data.registrations, function (v, k) {
                        if (v.attendeeType != null && v.attendeeType != '') {
                            if ($scope.allowedAttendeeTypeNames.indexOf(v.attendeeType) >= 0) {
                                exists = true;
                            }
                        }
                    })
                }
                if (exists) {
                    $scope.loading = false;
                    notificationService.error("Attendee with a given email already exists.");
                    return;
                } else {
                    $scope.createRegistration();
                }
            } else {
                var exists = false;
                var reg = null;
                if (data != null && data.registrations != null) {
                    angular.forEach(data.registrations, function (v, k) {
                        if (v.attendeeType != null && v.attendeeType != '') {
                            if ($scope.allowedAttendeeTypeNames.indexOf(v.attendeeType) >= 0) {
                                reg = v;
                                exists = true;
                            }
                        }
                    })
                }
                if (exists) {
                    $scope.createRegistration(reg);
                } else {
                    $scope.createNewAttendee();
                    $scope.createRegistration($rootScope.scheduledMeetingUser);
                }
            }
        }, function (error) {
            $scope.createRegistration();
        })
    }

    $scope.populateUnassignAndAssignData = function () {
        var unpublishCodes = [];
        var publishCodes = [];
        angular.forEach($scope.regCodesToUnPublish, function (v, k) {
            if ($scope.initialRegCodes.indexOf(v) >= 0 && $scope.regCodesToPublish.indexOf(v) < 0) {
                if (unpublishCodes.indexOf(v) < 0 && v != null && v != '') {
                    unpublishCodes.push(v);
                }
            }
        })
        angular.forEach($scope.regCodesToPublish, function (v, k) {
            if ($scope.initialRegCodes.indexOf(v) < 0) {
                if (publishCodes.indexOf(v) < 0 && v != null && v != '') {
                    publishCodes.push(v);
                }
            }
        })
        $scope.regCodesToUnPublish = unpublishCodes;
        $scope.regCodesToPublish = publishCodes;
    }

    $scope.getRegistrationCode = function (reqRegistration) {
        if ($scope.isUpdate && $scope.meetingInviter != null && $scope.meetingInviter.registrationCode != null) {
            return $scope.meetingInviter.registrationCode;
        } else if (reqRegistration != null) {
            return reqRegistration.registrationCode;
        } else {
            return null;
        }
    }

    $scope.getProfilePinOfAttendee = function (reqRegistration) {
        if ($scope.isUpdate && $scope.meetingInviter != null && $scope.meetingInviter.registrationCode != null) {
            return $scope.meetingInviter.pin;
        }
        if (reqRegistration != null) {
            return reqRegistration.profile != null && reqRegistration.profile.pin != null ? reqRegistration.profile.pin : reqRegistration.pin;
        } else {
            return $scope.event.accountCode + parseInt((Math.random() * 1000 * 1000));
        }
    }

    $scope.getAttendeeTypeName = function (code) {
        var name = "";
        angular.forEach($scope.allowedAttendeeType, function (v, k) {
            if (v.code == code) {
                name = v.name;
            }
        })
        return name;
    }

    $scope.getAttendeeType = function (reqRegistration, isByName) {
        if ($scope.isUpdate && $scope.meetingInviter != null && $scope.meetingInviter.registrationCode != null) {
            if (isByName) {
                return ($scope.meetingInviter.attendeeType != null && $scope.meetingInviter.attendeeType != '') ? $scope.meetingInviter.attendeeType : $scope.defaultAttendeeType.name;
            } else {
                return ($scope.meetingInviter.attendeeTypeCode != null && $scope.meetingInviter.attendeeTypeCode != '') ? $scope.meetingInviter.attendeeTypeCode : $scope.defaultAttendeeType.code;
            }
        }
        if (reqRegistration != null) {
            if (isByName) {
                return (reqRegistration.attendeeTypeCode != null && reqRegistration.attendeeTypeCode != '') ? $scope.getAttendeeTypeName(reqRegistration.attendeeTypeCode) : $scope.defaultAttendeeType.name;
            } else {
                return (reqRegistration.attendeeTypeCode != null && reqRegistration.attendeeTypeCode != '') ? reqRegistration.attendeeTypeCode : $scope.defaultAttendeeType.code;
            }
        } else {
            if (isByName) {
                return $scope.defaultAttendeeType.name;
            } else {
                return $scope.defaultAttendeeType.code;
            }
        }
    }

    $scope.createRegistration = function (reqRegistration) {
        $scope.loading = true;
        $scope.newAttendee = {
            registrationCode: $scope.getRegistrationCode(reqRegistration),
            eventCode: $scope.event.eventCode,
            accountCode: $scope.event.accountCode,
            eventId: $scope.event.eventId,
            profile: {
                firstName: $scope.regDetail.firstName,
                lastName: $scope.regDetail.lastName,
                pin: $scope.getProfilePinOfAttendee(reqRegistration),
                email: $scope.regDetail.email,
                position: $scope.regDetail.position,
                organization: $scope.regDetail.organization,
                phoneMobile: $scope.regDetail.mobile
            },
            attendeeType: $scope.getAttendeeType(reqRegistration, true), //True to getAttendeTypeName
            attendeeTypeCode: $scope.getAttendeeType(reqRegistration, false) // False to get AttendeeTypeCode
        }

        if ($scope.regDetail.id != null) {
            $scope.newAttendee.id = $scope.regDetail.id;
        }
        registrationQuestionAnswerData = [];
        profileQuestionAnswerData = [];
        angular.forEach($scope.questionAnswerMapping2, function (v, k) {
            if (v != null && !angular.isUndefined(v) && k != 'undefined') {
                var question = $scope.getQuestionDataById(k);
                var quesObj = {};
                quesObj.questionId = k;
                quesObj.questionCode = question.questionCode;
                quesObj.questionName = question.questionName;
                quesObj.questionField = $scope.getquestionFieldType(question.questionTypeId);
                var answerObj = [];
                var obj = {};
                obj.answerId = null;
                obj.answerCode = null;
                if (question.questionTypeId == 1 || question.questionTypeId == 2) {
                    if (v instanceof Array) {
                        obj.value = "";
                    } else {
                        obj.value = v != null ? v : "";
                    }
                } else if (question.questionTypeId == 5 || question.questionTypeId == 7) {
                    if (v != null && v.length > 0) {
                        obj.value = '';
                        angular.forEach(v, function (vv, kk) {
                            obj.value = obj.value + vv.answerCode + ",";
                        })
                    } else {
                        obj.value = "";
                    }
                    if (obj.value != null && obj.value.endsWith(',')) {
                        obj.value = obj.value.substring(0, obj.value.length - 1)
                    }
                } else if (question.questionTypeId == 4 || question.questionTypeId == 6) {
                    if (v != null && v instanceof Array && v[0] != null) {
                        obj.value = v[0];
                    } else if (v != null && (v instanceof String || typeof v === 'string')) {
                        obj.value = v;
                    } else {
                        obj.value = "";
                    }
                }
                answerObj.push(obj);
                quesObj.answers = {
                    "answer": answerObj
                }
                if (quesObj.questionField && question.questionType.startsWith('Reg')) {
                    registrationQuestionAnswerData.push(quesObj)
                } else if (quesObj.questionField) {
                    profileQuestionAnswerData.push(quesObj);
                }
            }
        })

        if (registrationQuestionAnswerData.length > 0) {
            $scope.newAttendee["registrationQuestions"] = {
                "question": registrationQuestionAnswerData
            };
        }
        if (profileQuestionAnswerData.length > 0) {
            $scope.newAttendee.profile["profileQuestions"] = {
                "question": profileQuestionAnswerData
            };
        }
        $scope.saveRegistration();
    }

    $scope.createNewAttendee = function (reqRegistration) {
        $scope.loading = true;
        $scope.newAttendee1 = {
            registrationCode: $scope.getRegistrationCode(reqRegistration),
            eventCode: $scope.event.eventCode,
            accountCode: $scope.event.accountCode,
            eventId: $scope.event.eventId,
            profile: {
                firstName: $scope.regDetail.firstName,
                lastName: $scope.regDetail.lastName,
                pin: $scope.getProfilePinOfAttendee(reqRegistration),
                email: $scope.regDetail.email,
                position: $scope.regDetail.position,
                organization: $scope.regDetail.organization,
                phoneMobile: $scope.regDetail.mobile
            },
            attendeeType: $scope.getAttendeeType(reqRegistration, true), //True to getAttendeTypeName
            attendeeTypeCode: $scope.getAttendeeType(reqRegistration, false) // False to get AttendeeTypeCode
        }

        if ($scope.regDetail.id != null) {
            $scope.newAttendee1.id = $scope.regDetail.id;
        }
        SessionFactory.createNewRegistration($scope.newAttendee1).then(function (data) {
            $scope.regCodesToPublish.push(data.registrationDTO.registrationCode)
        })
    }

    $scope.getquestionFieldType = function (typeId) {
        if (typeId == 1) {
            return 'Text';
        } else if (typeId == 2) {
            return 'Textarea';
        } else if (typeId == 4) {
            return 'Radio';
        } else if (typeId == 5) {
            return 'Checkbox';
        } else if (typeId == 6) {
            return 'Select';
        } else if (typeId == 7) {
            return 'Select multiple';
        }

    }

    $scope.saveRegistration = function () {
        $scope.loading = true;
        $scope.registeredAttendees.push($scope.newAttendee)
        SessionFactory.createNewRegistration($scope.newAttendee).then(function (data) {
            notificationService.success("Requestor Created/Updated Successfully.");
            if ($scope.scheduledMeetingUser != null && $scope.newAttendee != null && data.registrationDTO.registrationCode != null ) {
                $scope.getMicrosoftExecutives($scope.newAttendee.registrationQuestions, data.registrationDTO.registrationCode, $scope.scheduledMeetingUser.registrationCode)
            } else {
                $scope.getMicrosoftExecutives($scope.newAttendee.registrationQuestions, data.registrationDTO.registrationCode)
            }
        }, function (error) {
            $scope.registeredAttendees.pop();
            $scope.loading = false;
            if (error.status == 409) {
                notificationService.error("Email already exist.");
            } else {
                notificationService.error("Error Occured while creating.");
            }
        })
    }

    $scope.getQuestionByRegField = function (regField) {
        var found = false;
        var answer;
        angular.forEach($scope.questionData, function (v, k) {
            if (v.questionAssignment.fieldName == regField && !found) {
                answer = v.answers;
                found = true;
            }
        })
        return answer;
    }

    $scope.close = function (params) {
        $modalInstance.close();
    }

    $scope.getQuestions = function () {
        $scope.questionData = [];
        $scope.questionAnswerMapping = {};
        var requestObject = {
            "eventId": $scope.event.eventId
        };
        SessionFactory.getQuestionsByEventId(requestObject).then(function (data) {
            if (data != null) {
                $scope.questionData = data;
            }
            $scope.init();
        })
    }

    $scope.getQuestions();

    $scope.getQuestionDataById = function (questionId) {
        obj = {};
        found = false;
        angular.forEach($scope.questionData, function (v, k) {
            if (!found && v.questionId == questionId) {
                obj = v;
                found = true;
            }
        })
        return obj;
    }

    $scope.getConfigData = function () {
        if ($scope.scheduledMeetingUser != null && !$scope.isUpdate) {
            var meetingTypeName = $filter("filter")($scope.meetingTypes, {
                typeId: $scope.meetingType.id
            })[0].sessionType;
            $scope.meetingObject.sessionTitle = meetingTypeName + ' - ' + $scope.scheduledMeetingUser.registrationCode
        }
        obj = {
            eventId: $scope.event.eventId,
            sessionTypeId: $scope.meetingType.id
        }
        MeetingInfoFctry.getConfig(obj).then(function (data) {
            $scope.configData = data.id == null ? null : data;
            $scope.configElements = data.id == null ? [] : JSON.parse(data.config);
            $scope.questionIds = [];
            angular.forEach($scope.configElements, function(v,k) {
            	if(v.id == 5) {
                    $scope.questionIds.push(v.value);
            	}
            })
        }, function () {
            $scope.configPageLoading = false;
        })
    }

    $scope.getConfigData();

    $scope.deleteMeeting = function (meetingObject) {
        swal({
            title: "Are you sure you want to cancel this meeting?",
            text: $scope.isBlockedEvent ? "" : "All attendees assigned to this meeting will be removed from the meeting.",
            type: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it!",
            closeOnConfirm: true
        }, function () {
            $scope.loading = true;
            var req = {};
            req.accountCode = $scope.event.accountCode;
            req.eventCode = $scope.event.eventCode;
            req.meetingObject = meetingObject;
            req.eventId = $scope.event.eventId;
            req.localSessionId = $scope.meetingEvent.id;
            SessionFactory.deleteMeetingByInstanceId(req).then(function (resp) {
                notificationService.success("Meeting Deleted Successfully.")
                $modalInstance.close({
                    deleteId: $scope.meetingEvent.id
                });
            }, function () {
                $scope.loading = false;
                notificationService.error($filter('translate')('meetingApp.messages.errorMsg'));
            })
        })
    }

    $scope.updateAnswerToRegistration = function (question, answerCode) {
        var mapping = $scope.questionAnswerMapping2[question.questionId];
        if (mapping == null) {
            var obj = [];
            obj.push(answerCode);
            $scope.questionAnswerMapping2[question.questionId] = obj;
        } else {
            if (mapping.indexOf(answerCode) < 0) {
                mapping.push(answerCode);
                $scope.questionAnswerMapping2[question.questionId] = mapping;
            } else {
                var index = mapping.indexOf(answerCode);
                if (index > -1) {
                    mapping.splice(index, 1);
                }
                if (mapping.length > 0) {
                    $scope.questionAnswerMapping2[question.questionId] = mapping;
                } else {
                    delete $scope.questionAnswerMapping2[question.questionId];
                }

            }
        }
    }

    $scope.getAllowedAttendeeType = function () {
        SessionFactory.getAllowedAttendeeTypes({
            "eventId": $scope.event.eventId
        }).then(function (data) {
            $scope.allowedAttendeeType = data;
            $scope.allowedAttendeeTypeNames = [];
            angular.forEach($scope.allowedAttendeeType, function (v, k) {
                if (v.isDefaultAttendeeType == 1) {
                    $scope.defaultAttendeeType = v;
                }
                if (v.name != null && v.name != '' && $scope.allowedAttendeeTypeNames.indexOf(v.name) < 0) {
                    $scope.allowedAttendeeTypeNames.push(v.name);
                }
            })
            if ($scope.defaultAttendeeType == null || $scope.defaultAttendeeType.name == null) {
                notificationService.error("No default attendee type is set. Meeting creation is not allowed.")
                $scope.close();
            }
        }, function () {
            notificationService.error("No default attendee type is set. Meeting creation is not allowed.")
            $scope.close();
        })
    }

    $scope.getMicrosoftExecutives = function (questions, requesterRegCode, scheduledMeetingUserRegCode) {
        if (questions) {
            questions = questions.question;
            var found = false;
            var questionObj = {};
            angular.forEach(questions, function (v, k) {
                if (!found && v.questionCode == 'BG- Requested Executive Checkbox List' && v.questionName == 'Requested Executive(s)' && v.questionField == 'Checkbox') {
                    questionObj = v;
                    found = true;
                }
            })

            if (found) {
                var namesArray = [];
                angular.forEach(questionObj.answers.answer, function (v, k) {
                    if (v.value != null && v.value != "") {
                        namesArray = v.value.split(",");
                    }
                })
                if (namesArray.length > 0) {
                    $scope.getMicrosoftExecutiveRegCodes(namesArray, requesterRegCode, scheduledMeetingUserRegCode)
                } else {
                    if ($scope.meetingObject.sessionDescription != null && $scope.meetingObject.sessionDescription != undefined && $scope.meetingObject.sessionDescription != '') {
                        var registeredMicrosoftExecutiveAttendeeRegCodes = $scope.meetingObject.sessionDescription.split('|');
                        if (registeredMicrosoftExecutiveAttendeeRegCodes && registeredMicrosoftExecutiveAttendeeRegCodes.length > 0) {
                            angular.forEach(registeredMicrosoftExecutiveAttendeeRegCodes, function (v, k) {
                                $scope.regCodesToUnPublish.push(v);
                            })
                            $scope.meetingObject.sessionDescription = '';
                        }
                    }
                    if ($scope.scheduledMeetingUser != null && $scope.newAttendee != null && requesterRegCode != null) {
                        $scope.addUpdateMeeting(requesterRegCode, scheduledMeetingUserRegCode);
                    } else {
                        $scope.addUpdateMeeting(requesterRegCode);
                    }
                }
            } else {
                if ($scope.scheduledMeetingUser != null && $scope.newAttendee != null && requesterRegCode != null) {
                    $scope.addUpdateMeeting(requesterRegCode, scheduledMeetingUserRegCode);
                } else {
                    $scope.addUpdateMeeting(requesterRegCode);
                }
            }
        } else {
            if ($scope.scheduledMeetingUser != null && $scope.newAttendee != null && requesterRegCode != null) {
                $scope.addUpdateMeeting(requesterRegCode, scheduledMeetingUserRegCode);
            } else {
                $scope.addUpdateMeeting(requesterRegCode);
            }
        }
    }

    $scope.getMicrosoftExecutiveAttendees = function (questions, sessionId, instanceId) {
        if (questions) {
            questions = questions.question;
            var found = false;
            var questionObj = {};
            angular.forEach(questions, function (v, k) {
                if (!found && v.questionCode == 'BG- Requested Executive Checkbox List' && v.questionName == 'Requested Executive(s)' && v.questionField == 'Checkbox') {
                    questionObj = v;
                    found = true;
                }
            })

            if (found) {
                var namesArray = [];
                angular.forEach(questionObj.answers.answer, function (v, k) {
                    if (v.value != null && v.value != "") {
                        namesArray = v.value.split(",");
                    }
                })
                if (namesArray.length > 0) {
                    $scope.assignMicrosoftExecutives(namesArray, sessionId, instanceId)
                } else {
                    $scope.createAndRegisterParticipants(sessionId, instanceId)
                }
            } else {
                $scope.createAndRegisterParticipants(sessionId, instanceId)
            }
        } else {
            $scope.createAndRegisterParticipants(sessionId, instanceId)
        }
    }

    $scope.updateMeetingToCalendar = function (sessionId) {
        var requestObject = {
            'eventId': $scope.event.eventId,
            'eventCode': $scope.event.eventCode,
            'accountCode': $scope.event.accountCode,
            'sessionId': sessionId
        }
        SessionFactory.getSessionLightInstances(requestObject).then(function (resp) {
            notificationService.success($filter('translate')('meetingApp.messages.successMsg'));
            $modalInstance.close(resp);
        });
    }

    $scope.assignMicrosoftExecutives = function (namesArray, sessionId, instanceId) {
        var requestObject = {
            eventId: $scope.event.eventId,
            eventCode: $scope.event.eventCode,
            accountCode: $scope.event.accountCode,
            isBulkMode: true,
            bulkNames: namesArray
        }
        SessionFactory.getRegistrationByFilter(requestObject).then(function (data) {
            var registrations = data.data;
            if (registrations && registrations.length > 0) {
                var regSessionArray = [];
                angular.forEach(registrations, function (v, k) {
                    var regSessObj = {};
                    regSessObj.status = "Registered";
                    regSessObj.registrationCode = v.registrationCode;
                    regSessionArray.push(regSessObj);
                })
                var req = {
                    eventId: $scope.event.eventId,
                    eventCode: $scope.event.eventCode,
                    accountCode: $scope.event.accountCode,
                    instanceId: instanceId,
                    sessionId: sessionId,
                    regSessions: regSessionArray
                };
                SessionFactory.bulkAssignRegistrationToSession(req).then(function (data) {
                    $scope.createAndRegisterParticipants(req.sessionId, req.instanceId);
                    notificationService.success("Requested Executive(s) Added To Meeting Successfully.")
                    //$scope.updateMeetingToCalendar(sessionId);
                }, function () {
                    $scope.updateMeetingToCalendar(sessionId);
                    notificationService.error("Error Occured While Assigning Requested Executive(s) To Meeting.");
                })
            } else {
                $scope.updateMeetingToCalendar(sessionId);
            }
        }, function () {

        })
    }

    $scope.getMicrosoftExecutiveRegCodes = function (namesArray, requesterRegCode, scheduledMeetingUserRegCode) {
        var requestObject = {
            eventId: $scope.event.eventId,
            eventCode: $scope.event.eventCode,
            accountCode: $scope.event.accountCode,
            isBulkMode: true,
            bulkNames: namesArray
        }
        var registeredMicrosoftExecutiveAttendeeRegCodes = [];
        if ($scope.meetingObject.sessionDescription != null && $scope.meetingObject.sessionDescription != undefined && $scope.meetingObject.sessionDescription != '') {
            registeredMicrosoftExecutiveAttendeeRegCodes = $scope.meetingObject.sessionDescription.split('|');
        }
        SessionFactory.getRegistrationByFilter(requestObject).then(function (data) {
            var registrations = data.data;
            $scope.meetingObject.sessionDescription = '';
            var tempExecutiveRegCodes = [];
            if (registrations && registrations.length > 0) {
                angular.forEach(registrations, function (v, k) {
                    if ($scope.regCodesToPublish.indexOf(v.registrationCode) == -1) {
                        $scope.regCodesToPublish.push(v.registrationCode);
                    }
                    tempExecutiveRegCodes.push(v.registrationCode);
                })
                if (tempExecutiveRegCodes && tempExecutiveRegCodes.length > 0) {
                    $scope.meetingObject.sessionDescription = tempExecutiveRegCodes.join("|")
                }
            }
            if (registeredMicrosoftExecutiveAttendeeRegCodes && registeredMicrosoftExecutiveAttendeeRegCodes.length > 0) {
                angular.forEach(registeredMicrosoftExecutiveAttendeeRegCodes, function (v, k) {
                    if (tempExecutiveRegCodes.indexOf(v) == -1) {
                        $scope.regCodesToUnPublish.push(v);
                    }
                })
            }

            if ($scope.scheduledMeetingUser != null && $scope.newAttendee != null && requesterRegCode != null) {
                $scope.addUpdateMeeting(requesterRegCode, scheduledMeetingUserRegCode);
            } else {
                $scope.addUpdateMeeting(requesterRegCode);
            }
        }, function () {
            if ($scope.scheduledMeetingUser != null && $scope.newAttendee != null && requesterRegCode != null) {
                $scope.addUpdateMeeting(requesterRegCode, scheduledMeetingUserRegCode);
            } else {
                $scope.addUpdateMeeting(requesterRegCode);
            }
        })
    }

    $scope.assignParticipantsToMeeting = function (codesArray, sessionId, instanceId) {
        if (codesArray && codesArray.length > 0) {
            var regSessionArray = [];
            angular.forEach(codesArray, function (v, k) {
                var regSessObj = {};
                regSessObj.status = "Registered";
                regSessObj.registrationCode = v;
                regSessionArray.push(regSessObj);
            })
            var req = {
                eventId: $scope.event.eventId,
                eventCode: $scope.event.eventCode,
                accountCode: $scope.event.accountCode,
                instanceId: instanceId,
                sessionId: sessionId,
                regSessions: regSessionArray
            };
            SessionFactory.bulkAssignRegistrationToSession(req).then(function (data) {
                notificationService.success("Participants Added To Meeting Successfully.")
                $scope.updateMeetingToCalendar(sessionId);
            }, function () {
                $scope.updateMeetingToCalendar(sessionId);
                notificationService.error("Error Occured While Assigning Participants To The Meeting.");
            })
        } else {
            $scope.updateMeetingToCalendar(sessionId);
        }
    }

    $scope.createParticipants = function (participants, sessionId, instanceId, codeArray) {
        if (participants && participants.length > 0) {
            eachSeries(participants, function (item) {
                return SessionFactory.createNewRegistration(item).then(function (data) {
                    if (data && data.registrationDTO) {
                        codeArray.push(data.registrationDTO.registrationCode);
                    }
                    return;
                }, function (error) {
                    //Error Occured While Creating Registration;
                    return;
                })
            }).then(function () {
                $scope.assignParticipantsToMeeting(codeArray, sessionId, instanceId);
            });
        } else if (codeArray && codeArray.length > 0) {
            $scope.assignParticipantsToMeeting(codeArray, sessionId, instanceId);
        } else {
            $scope.updateMeetingToCalendar(sessionId);
        }
    }

    $scope.createAndRegisterParticipants = function (sessionId, instanceId) {
        $scope.participants = [];
        MeetingInfoFctry.getRequesterConfig({
            eventId: $scope.event.eventId
        }).then(function (data) {
            if (data) {
                $scope.questionParticipantsMapping = data.data;
                if ($scope.questionParticipantsMapping.msftAMDetails) {
                    $scope.addRequesterParticipant($scope.questionParticipantsMapping.msftAMDetails)
                }
                if ($scope.questionParticipantsMapping.msftHostDetails) {
                    $scope.addRequesterParticipant($scope.questionParticipantsMapping.msftHostDetails)
                }
                if ($scope.questionParticipantsMapping.msftAdditionalParticipantsDetails1) {
                    $scope.addRequesterParticipant($scope.questionParticipantsMapping.msftAdditionalParticipantsDetails1);
                }
                if ($scope.questionParticipantsMapping.msftAdditionalParticipantsDetails2) {
                    $scope.addRequesterParticipant($scope.questionParticipantsMapping.msftAdditionalParticipantsDetails2);
                }
                if ($scope.questionParticipantsMapping.msftAdditionalParticipantsDetails3) {
                    $scope.addRequesterParticipant($scope.questionParticipantsMapping.msftAdditionalParticipantsDetails3);
                }
                if ($scope.questionParticipantsMapping.msftAdditionalParticipantsDetails4) {
                    $scope.addRequesterParticipant($scope.questionParticipantsMapping.msftAdditionalParticipantsDetails4);
                }
                if ($scope.questionParticipantsMapping.msftAdditionalParticipantsDetails5) {
                    $scope.addRequesterParticipant($scope.questionParticipantsMapping.msftAdditionalParticipantsDetails5);
                }
                if ($scope.questionParticipantsMapping.customerPartnerAttendee1) {
                    $scope.addRequesterParticipant($scope.questionParticipantsMapping.customerPartnerAttendee1);
                }
                if ($scope.questionParticipantsMapping.customerPartnerAttendee2) {
                    $scope.addRequesterParticipant($scope.questionParticipantsMapping.customerPartnerAttendee2);
                }
                if ($scope.questionParticipantsMapping.customerPartnerAttendee3) {
                    $scope.addRequesterParticipant($scope.questionParticipantsMapping.customerPartnerAttendee3);
                }
                if ($scope.questionParticipantsMapping.customerPartnerAttendee4) {
                    $scope.addRequesterParticipant($scope.questionParticipantsMapping.customerPartnerAttendee4);
                }
                if ($scope.questionParticipantsMapping.customerPartnerAttendee5) {
                    $scope.addRequesterParticipant($scope.questionParticipantsMapping.customerPartnerAttendee5);
                }
                $scope.validateParticipantsAgainstEmail($scope.participants, sessionId, instanceId)
            } else {
                $scope.updateMeetingToCalendar(sessionId);
            }
        }, function () {
            $scope.updateMeetingToCalendar(sessionId);
        })
    }

    $scope.addRequesterParticipant = function (reqParticipant) {
        var _attendeeTypeName = ''
        var _attendeeTypeCode = $filter("filter")(reqParticipant, {
            field: "email"
        })[0] ? $filter("filter")(reqParticipant, {
            field: "email"
        })[0].attendeeTypeCode : null; // will always read attendee type code from email field
        if (_attendeeTypeCode) {
            _attendeeTypeName = $scope.getAttendeeTypeName(_attendeeTypeCode);
        }
        var participant = {
            registrationCode: null,
            eventCode: $scope.event.eventCode,
            accountCode: $scope.event.accountCode,
            eventId: $scope.event.eventId,
            profile: {
                firstName: $filter("filter")(reqParticipant, {
                    field: "firstName"
                })[0] ? $scope.questionAnswerMapping2[$filter("filter")(reqParticipant, {
                    field: "firstName"
                })[0].questionId] : null,
                lastName: $filter("filter")(reqParticipant, {
                    field: "lastName"
                })[0] ? $scope.questionAnswerMapping2[$filter("filter")(reqParticipant, {
                    field: "lastName"
                })[0].questionId] : null,
                pin: $scope.getProfilePinOfAttendee(),
                email: $filter("filter")(reqParticipant, {
                    field: "email"
                })[0] ? $scope.questionAnswerMapping2[$filter("filter")(reqParticipant, {
                    field: "email"
                })[0].questionId] : null,
                position: ($filter("filter")(reqParticipant, {
                    field: "position"
                })[0] && ($scope.questionAnswerMapping2[$filter("filter")(reqParticipant, {
                    field: "position"
                })[0].questionId]) instanceof String) ? $scope.questionAnswerMapping2[$filter("filter")(reqParticipant, {
                    field: "position"
                })[0].questionId] : null,
                organization: ($filter("filter")(reqParticipant, {
                    field: "organization"
                })[0] && ($scope.questionAnswerMapping2[$filter("filter")(reqParticipant, {
                    field: "organization"
                })[0].questionId]) instanceof String) ? $scope.questionAnswerMapping2[$filter("filter")(reqParticipant, {
                    field: "organization"
                })[0].questionId] : null,
                phoneMobile: ($filter("filter")(reqParticipant, {
                    field: "mobile"
                })[0] && ($scope.questionAnswerMapping2[$filter("filter")(reqParticipant, {
                    field: "mobile"
                })[0].questionId]) instanceof String) ? $scope.questionAnswerMapping2[$filter("filter")(reqParticipant, {
                    field: "mobile"
                })[0].questionId] : null
            },
            attendeeType: _attendeeTypeName,
            attendeeTypeCode: _attendeeTypeName
        }

        if (GlobalMethodService.validateRequiredFields(participant.profile.firstName) && GlobalMethodService.validateRequiredFields(participant.profile.lastName) && GlobalMethodService.validateRequiredFields(participant.profile.email) && GlobalMethodService.validateEmail(participant.profile.email)) {
            if ($scope.participants && $scope.participants.length > 0) {

                var isExist = $scope.participants.filter(function (p) {
                    return p.profile.email == participant.profile.email;
                }) 
                if (isExist && isExist.length == 0) {
                    $scope.participants.push(participant);
                }
            } else if ($scope.participants) {
                $scope.participants.push(participant);
            }
        }
    }

    $scope.validateParticipantsAgainstEmail = function (participants, sessionId, instanceId) {
        var participantRegCodes = [];
        var newParticipants = [];
        if (participants && participants.length > 0) {
            eachSeries(participants, function (item) {
                var reqObj = {
                    email: item.profile.email,
                    accountCode: item.accountCode,
                    eventCode: item.eventCode
                }
                return SessionFactory.validateUserAgainstEmail(reqObj).then(function (data) {
                    if (data && data.registrations) {
                        var found = false;
                        var isExist = data.registrations.filter(function (v) {
                            return ($scope.allowedAttendeeTypeNames.indexOf(v.attendeeType) >= 0)
                        })
                        if (isExist.length > 0) {
                            participantRegCodes.push(isExist[0].registrationCode)
                        } else {
                            newParticipants.push(item)
                        }
                    }
                }, function (error) {
                    newParticipants.push(item);
                })
            }).then(function () {
                $scope.createParticipants(newParticipants, sessionId, instanceId, participantRegCodes)
            })
        } else {
            $scope.updateMeetingToCalendar(sessionId);
        }
    }

    $scope.getOnSiteConfigData = function () {
        var reqObj = {
            eventId: $scope.event.eventId
        }
        MeetingInfoFctry.getOnSiteSettingConfigData(reqObj).then(function (data) {
            if (data && data.data && data.data.showCheckInAllOnUpdateMeeting) {
                $scope.showCheckInAll = data.data.showCheckInAllOnUpdateMeeting;
            }
        }, function (error) {
            notificationService.error("Error occurred while fetching on-site setting config data." + error.data)
        })
    }

    $scope.checkInAllAttendees = function () {
        $scope.loading = true;
        if ($scope.registeredAttendees && $scope.registeredAttendees.length > 0) {
            var attendeeSessionArray = [];
            angular.forEach($scope.registeredAttendees, function (v, k) {
                var attendeeSessionObj = {
                    status: 'Attended',
                    registrationCode: v.regCode
                }
                attendeeSessionArray.push(attendeeSessionObj)
            })
            var reqObj = {
                eventId: $scope.event.eventId,
                eventCode: $scope.event.eventCode,
                accountCode: $scope.event.accountCode,
                instanceId: $scope.meetingEvent.instanceId,
                sessionId: $scope.meetingEvent.sessionId,
                regSessions: attendeeSessionArray
            }
            SessionFactory.bulkAssignRegistrationToSession(reqObj).then(function (data) {
                $scope.loading = false;
                notificationService.success("All attendees successfully Checked In to meeting: " + $scope.meetingEvent.sessionTitle);
                $scope.close();
            }, function (error) {
                notificationService.error("Error occurred while checking-in attendees." + error.data)
                $scope.loading = false;
                $scope.close()
            })
        } else {
            $scope.loading = false;
        }
    }

    $scope.checkUserSession = function () {
        $scope.loading = true;
        var reqObj = {
            eventCode: $scope.event.eventCode,
            accountCode: $scope.event.accountCode
        }
        SessionFactory.getSessionsData(reqObj).then(function (data) {
            debugger;
            if (data) {
                $scope.loading = false;
            }
        }, function (error) {
            console.log('error: ', error)
        })
    }

    // Watching objects...
    $scope.$watch('meetingObject', function (newVal, oldVal) {
        if ($scope.isInitialized) {
            $timeout(function () {
                $scope.isInitialized = false;
            })
        } else {
            if (oldVal != null && oldVal != undefined && JSON.stringify(oldVal) != "{}" && newVal != oldVal) {
                $scope.meetingUpdated = true;
            }
        }
    }, true);

    $scope.$watch('sessionTimeHandler', function (newVal, oldVal) {
        if ($scope.isInitialized) {
            $timeout(function () {
                $scope.isInitialized = false;
            })
        } else {
            if (oldVal != null && oldVal != undefined && JSON.stringify(oldVal) != "{}" && newVal != oldVal) {
                $scope.meetingUpdated = true;
            }
        }
    }, true)
    $scope.$watch('regDetail', function (newVal, oldVal) {
        if ($scope.isInitialized) {
            $timeout(function () {
                $scope.isInitialized = false;
            })
        } else {
            if (oldVal != null && oldVal != undefined && JSON.stringify(oldVal) != "{}" && newVal != oldVal) {
                $scope.meetingUpdated = true;
            }
        }
    }, true)
    $scope.$watch('questionAnswerMapping2', function (newVal, oldVal) {
        if ($scope.isInitialized) {
            $timeout(function () {
                $scope.isInitialized = false;
            })
        } else {
            if (oldVal != null && oldVal != undefined && JSON.stringify(oldVal) != "{}" && newVal != oldVal) {
                $scope.meetingUpdated = true;
            }
        }
    }, true)
    $scope.$watch('registeredAttendees', function (newVal, oldVal) {
        if ($scope.isInitialized) {
            $timeout(function () {
                $scope.isInitialized = false;
            })
        } else {
            if (oldVal != null && oldVal != undefined && JSON.stringify(oldVal) != "{}" && newVal != oldVal) {
                $scope.meetingUpdated = true;
            }
        }
    }, true)
}]);