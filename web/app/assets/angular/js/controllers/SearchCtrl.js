var SearchCtrl = concurApp.controller('SearchCtrl', ['$scope', '$rootScope', '$state', '$modal', 'SessionFactory', 'GlobalVariableService', 'notificationService', '$filter', '$stateParams', 'GlobalMethodService', 'MeetingInfoFctry', function ($scope, $rootScope, $state, $modal, SessionFactory, GlobalVariableService, notificationService, $filter, $stateParams, GlobalMethodService, MeetingInfoFctry) {
    $scope.registrations = [];
    $scope.orgRegistrationData = [];
    $scope.loading = false;
    $scope.eventId = $stateParams.eventId;

    if ($scope.eventId == null || angular.isUndefined($scope.eventId) || $scope.eventId == '') {
        $state.go('event');
    }

    $scope.getEventById = function () {
        req = {
            'eventId': $scope.eventId
        }
        SessionFactory.getEventByEventId(req).then(function (data) {
            if (data != null) {
                $scope.eventObj = data.eventDTO;
            } else {
                $state.go('event')
            }
        })
    }
    $scope.getEventById();

    $scope.searchObject = {
        'firstName': '',
        'lastName': '',
        'organization': ''
    };
    $scope.sessionDetailOfRegistration = [];
    $scope.isMeetingDetail = false;
    $scope.checkInStatus = 'Attended';

    $scope.init = function () {
        $scope.loading = true;
        $scope.isMeetingDetail = false;
        $scope.sessionDetailOfRegistration = [];
        $scope.detailLoading = false;
        var requestObject = {
            eventId: $scope.eventObj.accountCode
        }
        SessionFactory.getRegistrationByFilter(requestObject).then(function (data) {
            $scope.registrations = data.data;
            $scope.orgRegistrationData = angular.copy($scope.registrations);
            $scope.loading = false;
        }, function () {
            $scope.loading = false;
        })

        $scope.getAllowedAttendeeType();
        $scope.getOnSiteConfigData();
    }

    $scope.getMeetingDetails = function (registration) {
        $scope.selectedRegistration = registration;
        $scope.isMeetingDetail = true;
        $scope.sessionDetailOfRegistration = [];
        $scope.detailLoading = true;
        var requestObject = {
            eventId: $scope.eventObj.eventId,
            eventCode: $scope.eventObj.eventCode,
            accountCode: $scope.eventObj.accountCode,
            regCode: $scope.selectedRegistration.registrationCode
        }
        SessionFactory.getSessionsInstanceByRegCode(requestObject).then(function (data) {
            $scope.sessionDetailOfRegistration = data;
            $scope.detailLoading = false;
        }, function () {
            $scope.detailLoading = false;
        })
    }

    $scope.clearSearchFilter = function () {
        $scope.searchObject = {
            firstName: "",
            lastName: "",
            organization: ""
        };
        $scope.registrations = [];
    }

    //Attendee Search Modal
    $scope.openAttendeeSearchModal = function () {
        var modalInstance = $modal.open({
            templateUrl: '/app/assets/angular/views/attendeeSearchModal.html',
            controller: 'AttendeeSearchCtrl',
            size: 'md',
        });
        modalInstance.result.then(
            function (result) {
                if (result != null) {
                    $rootScope.lookUpObject = result;
                    $scope.backToScheduler();
                }
            }
        );
    }

    $scope.updateSessionStatusOfRegistration = function (sessionInstance) {
        $scope.checkInLoading = true;
        var requestObject = {
            eventId: $scope.eventObj.eventId,
            eventCode: $scope.eventObj.eventCode,
            accountCode: $scope.eventObj.accountCode,
            regCode: $scope.selectedRegistration.registrationCode,
            status: $scope.checkInStatus,
            instanceId: sessionInstance.instanceId,
            sessionId: sessionInstance.sessionId
        }
        SessionFactory.checkInAttendees(requestObject).then(function (data) {
            $scope.checkInLoading = false;
            notificationService.success($scope.selectedRegistration.firstName + ' ' + $scope.selectedRegistration.lastName + ' successfully Checked In to meeting ' + sessionInstance.sessionTitle + '.');
            $scope.getMeetingDetails($scope.selectedRegistration);
        }, function () {
            $scope.checkInLoading = false;
        })
    }

    $scope.getRegistrationData = function () {
        if ($scope.searchObject.firstName == '' && $scope.searchObject.lastName == '' && $scope.searchObject.organization == '') {
            $scope.clearSearchFilter();
            notificationService.info("Please enter FirstName | LastName | Company to search.")
            $scope.loading = false;
            return;
        }
        $scope.sessionDetailOfRegistration = [];
        $scope.registrations = [];
        $scope.loading = true;
        $scope.isMeetingDetail = false;
        var requestObject = {
            eventId: $scope.eventObj.eventId,
            eventCode: $scope.eventObj.eventCode,
            accountCode: $scope.eventObj.accountCode,
            searchTerm: $scope.searchObject
        }
        SessionFactory.getRegistrationByFilter(requestObject).then(function (data) {
            $scope.registrations = data.data;
            if ($scope.registrations != null && $scope.registrations.length == 1) {
                $scope.getMeetingDetails($scope.registrations[0]);
            }
            $scope.loading = false;
        }, function () {
            $scope.loading = false;
        })
        $scope.getOnSiteConfigData()
    }

    $scope.backToScheduler = function (registration) {
        if (registration != null) {
            $state.go('calendar', {
                eventId: $scope.eventId,
                mode: 'scheduleMeeting',
                regCode: registration.registrationCode
            })
        } else {
            $state.go('calendar', {
                eventId: $scope.eventId
            })
        }
    }

    $scope.getAllowedAttendeeType = function () {
        SessionFactory.getAllowedAttendeeTypes({
            "eventId": $scope.eventObj.eventId
        }).then(function (data) {
            $scope.allowedAttendeeType = data;
            $scope.allowedAttendeeTypeNames = [];
            angular.forEach($scope.allowedAttendeeType, function (v, k) {
                if (v.name != null && v.name != '' && $scope.allowedAttendeeTypeNames.indexOf(v.name) < 0) {
                    $scope.allowedAttendeeTypeNames.push(v.name);
                }
            })
        })
    }

    //This is a modal controller for New Attendee
    $scope.openNewAttendeeModal = function (typeId) {
        $scope.modalInstance = $modal.open({
            templateUrl: 'addAttendeeModal.html',
            controller: function ($scope, $modalInstance, SessionFactory) {
                $scope.selectedStatusAndType = {};
                $scope.selectedAttendee = {};
                $scope.savingRegistration = false;

                $scope.getAllowedAttendeeType();

                $scope.newAttendee = {
                    isActive: 1,
                    eventId: $scope.eventId,
                    dateModifiedRegStatus: (new Date().getTime()),
                    dateModified: (new Date().getTime()),
                    profile: {

                    }
                };

                $scope.close = function (result) {
                    $modalInstance.close(result);
                }

                $scope.validate = function () {
                    if (($scope.newAttendee.profile == null || !(GlobalMethodService.validateRequiredFields($scope.newAttendee.profile.firstName)))) {
                        notificationService.error("First Name is required.");
                        return false;
                    }
                    if (($scope.newAttendee.profile == null || !(GlobalMethodService.validateRequiredFields($scope.newAttendee.profile.lastName)))) {
                        notificationService.error("Last Name is required.");
                        return false;
                    }
                    if (($scope.newAttendee.profile == null || !(GlobalMethodService.validateRequiredFields($scope.newAttendee.profile.email)))) {
                        notificationService.error("Email is required.");
                        return false;
                    }
                    if (!GlobalMethodService.validateEmail($scope.newAttendee.profile.email)) {
                        notificationService.error("Invalid Email.");
                        return;
                    }
                    if ($scope.newAttendee.attendeeType == null || $scope.newAttendee.attendeeType == {}) {
                        notificationService.error("Attendee Type is required.")
                        return false;
                    }
                    return true;
                }

                $scope.validateUserAgainstEmail = function (email) {
                    if ($scope.validate()) {
                        $scope.savingRegistration = true;
                        req = {
                            email: ($scope.newAttendee.profile.email).toLowerCase(),
                            eventCode: $scope.eventObj.eventCode,
                            accountCode: $scope.eventObj.accountCode
                        }
                        SessionFactory.validateUserAgainstEmail(req).then(function (data) {
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
                                $scope.savingRegistration = false;
                                notificationService.error("Attendee with a given email already exists.")
                            } else {
                                $scope.saveRegistration();
                            }
                        }, function (error) {
                            $scope.saveRegistration();
                        })
                    }
                }

                $scope.saveRegistration = function () {
                    $scope.loading = true;
                    $scope.savingRegistration = true;
                    $scope.newAttendee1 = {
                        registrationCode: null,
                        eventCode: $scope.eventObj.eventCode,
                        accountCode: $scope.eventObj.accountCode,
                        eventId: $scope.eventObj.eventId,
                        profile: {
                            firstName: $scope.newAttendee.profile.firstName,
                            lastName: $scope.newAttendee.profile.lastName,
                            pin: $scope.eventObj.accountCode + parseInt((Math.random() * 1000 * 1000)),
                            email: $scope.newAttendee.profile.email,
                            position: $scope.newAttendee.profile.position,
                            organization: $scope.newAttendee.profile.organization,
                        },
                        attendeeTypeCode: $scope.newAttendee.attendeeType.code
                    }
                    SessionFactory.createNewRegistration($scope.newAttendee1).then(function (data) {
                        $scope.savingRegistration = false;
                        notificationService.success(data.registrationDTO.firstName + ' ' + data.registrationDTO.lastName + ' successfully created.');
                        $scope.close(data.registrationDTO);
                    }, function (error) {
                        $scope.savingRegistration = false;
                        if (error.status == 409) {
                            notificationService.error(error.data)
                        } else {
                            notificationService.error("Error Occured while creating.");
                        }
                    })
                }
            },
            size: 'md',
            scope: $scope,
            backdrop: 'static',
            keyboard: false,
            resolve: {

            }
        });

        $scope.modalInstance.result.then(
            function (result) {
                if (result != null) {
                    $scope.registrations = [];
                    $scope.registrations.push(result);
                    $scope.getMeetingDetails(result);
                }
            }
        );
    }

    $scope.getAllAttendeesBySessionId = function (sessionInstance) {
        var modalInstance = $modal.open({
            templateUrl: 'checkInAllAttendees.html',
            controller: function ($scope, $modalInstance, SessionFactory) {
                $scope.getAllAttendees = function () {
                    var reqObj = {
                        eventCode: $scope.eventObj.eventCode,
                        accountCode: $scope.eventObj.accountCode,
                        eventId: $scope.eventObj.eventId,
                        sessionId: sessionInstance.sessionId
                    }
                    SessionFactory.getAttendeeBySessionId(reqObj).then(function (data) {
                        $scope.attendeesForMeeting = data;
                    })
                }

                $scope.getAllAttendees();

                $scope.close = function (result) {
                    if (result != null) {
                        $scope.getMeetingDetails(result);
                    }
                    $modalInstance.close(result);
                }

                $scope.checkInAttendee = function (attendee) {
                    $scope.checkInLoading = true;
                    var requestObject = {
                        eventId: $scope.eventObj.eventId,
                        eventCode: $scope.eventObj.eventCode,
                        accountCode: $scope.eventObj.accountCode,
                        regCode: attendee.registrationCode,
                        status: $scope.checkInStatus,
                        instanceId: sessionInstance.instanceId,
                        sessionId: sessionInstance.sessionId
                    }
                    SessionFactory.checkInAttendees(requestObject).then(function (data) {
                        $scope.checkInLoading = false;
                        notificationService.success(attendee.firstName + ' ' + attendee.lastName + ' successfully Checked In to meeting ' + sessionInstance.sessionTitle + '.');
                        $scope.getAllAttendees();
                    }, function () {
                        $scope.checkInLoading = false;
                    })
                }

                $scope.checkInAllAttendees = function () {
                    $scope.checkInLoading = true;
                    if ($scope.attendeesForMeeting && $scope.attendeesForMeeting.length > 0) {
                        var attendeeSessionArray = [];
                        angular.forEach($scope.attendeesForMeeting, function (v, k) {
                            var attendeeSessionObj = {
                                status: $scope.checkInStatus,
                                registrationCode: v.registrationCode
                            }
                            attendeeSessionArray.push(attendeeSessionObj);
                        })
                        var reqObj = {
                            eventId: $scope.eventObj.eventId,
                            eventCode: $scope.eventObj.eventCode,
                            accountCode: $scope.eventObj.accountCode,
                            instanceId: sessionInstance.instanceId,
                            sessionId: sessionInstance.sessionId,
                            regSessions: attendeeSessionArray
                        }
                        SessionFactory.bulkAssignRegistrationToSession(reqObj).then(function (data) {
                            notificationService.success("All attendees successfully Checked In to meeting " + sessionInstance.sessionTitle + ".");
                            $scope.getAllAttendees();
                            $scope.close($scope.selectedRegistration)
                        }, function (error) {
                            $scope.checkInLoading = false;
                        })
                    } else {
                        checkInLoading = false;
                    }
                }
            },
            size: 'md',
            scope: $scope,
            backdrop: 'static',
            keyboard: false,
            resolve: {

            }
        });

        $scope.modalInstance.result.then(
            function (result) {
                if (result != null) {
                    $scope.registrations = [];
                    $scope.registrations.push(result);
                    $scope.getMeetingDetails(result);
                }
            }
        );
    }

    $scope.getOnSiteConfigData = function () {
        var reqObj = {
            eventId: $scope.eventObj.eventId
        }
        MeetingInfoFctry.getOnSiteSettingConfigData(reqObj).then(function (data) {
            if (data && data.data && data.data.showCheckInAllOnUpdateMeeting) {
                $scope.showCheckInAll = data.data.showCheckInAllOnUpdateMeeting;
            }
        }, function (error) {
            notificationService.error("Error occurred while fetching on-site setting config data." + error.data)
        })
    }

}])