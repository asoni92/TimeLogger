var EventCtrl = concurApp.controller('EventCtrl', ['$scope', '$state', '$filter', '$rootScope', 'localStorageService', 'GlobalVariableService', 'SessionFactory', '$modal', 'notificationService', 'MeetingInfoFctry', function ($scope, $state, $filter, $rootScope, localStorageService, GlobalVariableService, SessionFactory, $modal, notificationService, MeetingInfoFctry) {
    req = {
        portalId: 10
    }
    $scope.events = [];
    $scope.loading = true;
    $scope.configElementSelector = {
        id: 1,
        profileFieldValue: "firstName",
        questionId: null,
        questionName: ""
    };

    $scope.editMeetingInfoIndex = null;
    $scope.isEditMeetingInfo = false;

    $scope.configElements = [];
    $scope.configInput = {
        value: ""
    };
    $scope.showConfigPage = false;
    $scope.configPageLoading = false;
    $scope.meetingType = {
        id: null
    };
    $scope.eventQuestion = [];
    $scope.pullRefreshing = false;

    $scope.refreshPreview = function () {
        $scope.configElements = [];
    }
    $scope.attendeeTypeData = {
        allowedAttendeeType: [],
        defaultAttendeeType: {}
    };

    $scope.defaultMeetingType = {};

    $scope.getEvents = function () {
        $scope.loading = true;
        SessionFactory.getEventsByPortalId(req).then(function (data) {
            if (data != null) {
                $scope.events = data;
            }
            $scope.loading = false;
        }, function () {
            $scope.loading = false;
        })
    }
    $scope.getEvents();

    $scope.getAllowedAttendeeTypes = function () {
        $scope.configPageLoading = true;
        SessionFactory.getAllowedAttendeeTypes($scope.selectedEvent).then(function (data) {
            $scope.attendeeTypeData.allowedAttendeeType = data;
            angular.forEach(data, function (v, k) {
                if (v.isDefaultAttendeeType == 1) {
                    $scope.attendeeTypeData.defaultAttendeeType = v;
                }
            })
            data.defaultAttendeeType = data.allowedAttendeeType ? data.allowedAttendeeType[0] : {};
            $scope.configPageLoading = false;
        })
    }

    $scope.getAttendeeTypes = function () {
        SessionFactory.getAttendeeTypes($scope.selectedEvent).then(function (data) {
            $scope.attendeeTypes = data;
        })
    }

    $scope.saveAllowedAttendeeTypes = function () {
        if ($scope.attendeeTypeData.defaultAttendeeType.code == null || $scope.attendeeTypeData.defaultAttendeeType.code == '') {
            notificationService.error("Select Default Attendee Type to continue.")
            return;
        }
        var postObj = {
            allowedAttendeeTypes: $scope.attendeeTypeData.allowedAttendeeType,
            defaultAttendeeType: $scope.attendeeTypeData.defaultAttendeeType,
            eventId: $scope.selectedEvent.eventId
        }
        SessionFactory.saveAllowedAttendeeTypes(postObj).then(function (data) {
            notificationService.success("Created Successfully!!")
        }, function (error) {
            notificationService.error(error.data)
        })
    }

    $scope.selectDefaultAttendeeType = function () {
        $scope.data.defaultAttendeeType = $scope.data.allowedAttendeeType ? $scope.data.allowedAttendeeType[0] : null;
    }

    $scope.logout = function () {
        $state.go('logout');
    }

    $scope.goToCalendar = function (eventObj) {
        $rootScope.event = eventObj;
        SessionFactory.getSessionLevels(eventObj).then(function (sessionLevels) {
            if (sessionLevels != null && sessionLevels.length > 0) {
                SessionFactory.getTracksByEvent(eventObj).then(function (tracks) {
                    if (tracks != null && tracks.length > 0) {
                        SessionFactory.getSessionTypes(eventObj).then(function (sessionTypes) {
                            if (sessionTypes != null && sessionTypes.length > 0) {
                                MeetingInfoFctry.getAllMeetingInfoConfigByEventId(eventObj).then(function (meetingInfoConfig) {
                                    if (meetingInfoConfig != null && meetingInfoConfig.length > 0) {
                                        $state.go('calendar', {
                                            eventId: eventObj.eventId
                                        });
                                    } else notificationService.error("This event does not have it's meeting info config. Please configure this event by clicking on the settings icon on the event list.")
                                })
                            } else notificationService.error("This event does not have session type. Please sync this event.")
                        })
                    } else notificationService.error("This event does not have tracks. Please sync this event.")
                })
            } else notificationService.error("This event does not have session levels. Please sync this event.")
        })
    }

    $scope.deleteEventById = function (event) {
        data = {
            eventId: event.eventId,
            eventCode: event.eventCode,
            accountCode: event.accountCode
        }
        SessionFactory.deleteEventById(data).then(function (resp) {
            notificationService.success("Deleted Successfully");
            $scope.getEvents();
        }, function () {
            $scope.loading = false;
            notificationService.error($filter('translate')('meetingApp.messages.errorMsg'));
        })
    }

    $scope.makeDefaultEvent = function (event) {
        SessionFactory.changeDefaultEvent(event).then(function (resp) {
            notificationService.success("Successfully Updated");
            $scope.getEvents();
        }, function () {
            $scope.loading = false;
            notificationService.error($filter('translate')('meetingApp.messages.errorMsg'));
        })
    }

    $scope.addNewEvent = function () {
        var modalInstance = $modal.open({
            templateUrl: 'addEventModal.html',
            controller: function ($scope, $modalInstance, SessionFactory) {
                $scope.addingEvent = false;
                $scope.newEvent = {};
                $scope.close = function () {
                    $scope.addingEvent = false;
                    $modalInstance.close();
                }
                $scope.saveEvent = function () {
                    $scope.addingEvent = true;
                    SessionFactory.saveEvent($scope.newEvent).then(function (resp) {
                        $scope.close()
                        notificationService.success("Created Successfully");
                        $scope.getEvents();
                    }, function (error) {
                        $scope.addingEvent = false;
                        if (error.status == 400) {
                            notificationService.error(error.data)
                        } else {
                            notificationService.error("Event with the given accountCode and eventCode is not found or you don't have the permission to access it.");
                        }
                    })
                }
            },
            size: 'md',
            scope: $scope,
            resolve: {

            }
        });
    }


    $scope.pullToRefreshData = function (event) {
        $scope.pullRefreshing = true;
        SessionFactory.syncEventData(event).then(function (data) {
            $scope.pullRefreshing = false;
            notificationService.success("Event: " + event.eventName + " updated with latest data!!");
        }).catch(function (error) {
            if (error) {
                $scope.pullRefreshing = false;
                if (error.status == 404) {
                    notificationService.error(event.eventName + " Not Found. Please check if you have correct event code and account code.")
                } else {
                    notificationService.error(error.statusText)
                }
            }
        })
    }

    $scope.openEventSettings = function (event) {
        $scope.selectedEvent = event;
        $scope.loadCount = 0;
        $scope.showConfigPage = false;
        $scope.configPageLoading = true;
        $scope.configElementSelector = {
            id: 1,
            profileFieldValue: "firstName"
        };
        $scope.configElements = [];
        $scope.configInput = {
            value: ""
        };
        var req = {
            eventId: event.eventId
        }
        SessionFactory.getSessionTypes(req).then(function (sessionTypes) {
            if (sessionTypes != null && sessionTypes.length > 0) {
                SessionFactory.getSessionTypes(req).then(function (data) {
                    if (data != null && data.length > 0) {
                        $scope.meetingTypes = data;
                        $scope.meetingType.id = $scope.meetingTypes[0].typeId;
                        $scope.defaultMeetingType = $filter("filter")($scope.meetingTypes, {
                            isDefault: 1
                        })[0];
                        if ($scope.defaultMeetingType == undefined || $scope.defaultMeetingType == null) {
                            $scope.defaultMeetingType = {}
                        }
                    }
                    if ($scope.loadCount >= 1) {
                        $scope.getConfigData();
                    }
                    $scope.loadCount++;
                }, function () {
                    $scope.configPageLoading = false;
                })
            } else {
                $scope.configPageLoading = false;
                notificationService.error("This event does not have session types. Please sync this event.")
            }
        })

        SessionFactory.getQuestionsByEventId(req).then(function (data) {
            if (data != null) {
                $scope.eventQuestion = data;
            }
            if ($scope.loadCount >= 1) {
                $scope.getConfigData();
            }
            $scope.loadCount++;
        }, function () {
            $scope.configPageLoading = false;
        })

        $scope.getAttendeeTypes();
        $scope.getAllowedAttendeeTypes();
        $scope.getRequesterConfig();
        $scope.getConfiguredMeetingTypes();
        $scope.getOnSiteConfigData();
    }

    $scope.getConfigData = function () {
        obj = {
            eventId: $scope.selectedEvent.eventId,
            sessionTypeId: $scope.meetingType.id
        }
        MeetingInfoFctry.getConfig(obj).then(function (data) {
            $scope.configData = data.id == null ? null : data;
            $scope.configElements = data.id == null ? [] : JSON.parse(data.config);
            $scope.showConfigPage = true;
            $scope.configPageLoading = false;
            $scope.loadCount++;
        }, function () {
            $scope.configPageLoading = false;
        })
    }

    $scope.addMeetingInfoConfigObj = function (obj) {
        if ($scope.isEditMeetingInfo) {
            $scope.configElements.splice($scope.editMeetingInfoIndex, 1);
            $scope.configElements.splice($scope.editMeetingInfoIndex, 0, obj);
        } else {
            $scope.configElements.push(obj);
        }
        $scope.editMeetingInfoIndex = null;
        $scope.isEditMeetingInfo = false;
    }
    $scope.addConfigElement = function () {
        if ($scope.configElementSelector.id == 3) {
            var obj = {
                id: 3,
                value: "Vertical Bar"
            };
            $scope.addMeetingInfoConfigObj(obj);
        } else if ($scope.configElementSelector.id == 1 || $scope.configElementSelector.id == 2) {
            if ($scope.configInput.value == null || $scope.configInput.value.length == 0) {
                return;
            }
            var obj = {
                id: $scope.configElementSelector.id,
                value: $scope.configInput.value
            };
            $scope.addMeetingInfoConfigObj(obj);
        } else if ($scope.configElementSelector.id == 4) {
            var obj = {
                id: $scope.configElementSelector.id,
                value: $scope.configInput.value,
                fieldName: $scope.configElementSelector.profileFieldValue
            };
            $scope.addMeetingInfoConfigObj(obj);
        } else if ($scope.configElementSelector.id == 5) {
            var obj = {
                id: $scope.configElementSelector.id,
                value: $scope.configElementSelector.questionId,
                fieldName: $scope.configElementSelector.questionName
            };
            $scope.addMeetingInfoConfigObj(obj);
        }
    }

    $scope.saveConfig = function () {
        var obj = {};
        if ($scope.configData != null) {
            obj.id = $scope.configData.id;
        }
        obj.eventId = $scope.selectedEvent.eventId;
        obj.sessionTypeId = $scope.meetingType.id;
        obj.configJson = $scope.configElements;
        MeetingInfoFctry.saveConfig(obj).then(function (resp) {
            notificationService.success("Created Successfully");
            $scope.editMeetingInfoIndex = null;
            $scope.isEditMeetingInfo = false;
        }, function () {
            notificationService.error("Error Occured");
        })
    }

    $scope.updateQuestionConfig = function () {
        var question = $scope.configElementSelector.question;
        $scope.configElementSelector = {
            question: question,
            id: 5,
            profileFieldValue: null,
            questionId: question.questionId,
            questionName: question.questionName
        };
    }

    $scope.makeDefaultAttendeeType = function (item) {
        if (item.code == $scope.attendeeTypeData.defaultAttendeeType.code) {
            $scope.attendeeTypeData.defaultAttendeeType = {};
            return;
        }
        $scope.attendeeTypeData.defaultAttendeeType = item;
    }

    $scope.syncEventData = function (event) {
        alert(JSON.stringify(event));
    }

    $scope.checkForDefaultAttendeeType = function (event) {
        return (function (selected) {
            if (selected) {
                if (selected.code == $scope.attendeeTypeData.defaultAttendeeType.code) {
                    $scope.attendeeTypeData.defaultAttendeeType = {};
                }
            }
        });
    }

    $scope.attendeeTypeDropDownSettings = {
        idProp: 'code',
        displayProp: 'name',
        scrollableHeight: '270px',
        scrollable: true,
        enableSearch: true
    }

    $scope.requesterConfig = {};
    $scope.addReqParticipantConfigElement = function () {
        $scope.requesterConfig[$scope.configElementSelector.section] = ($scope.requesterConfig[$scope.configElementSelector.section] && ($scope.requesterConfig[$scope.configElementSelector.section].length > 0)) ? $scope.requesterConfig[$scope.configElementSelector.section] : [];
        var attendeeType = '';
        if ($scope.configElementSelector && ($scope.configElementSelector.section == 'msftAMDetails' || $scope.configElementSelector.section == 'msftHostDetails' ||
                $scope.configElementSelector.section == 'msftAdditionalParticipantsDetails1' || $scope.configElementSelector.section == 'msftAdditionalParticipantsDetails2' || $scope.configElementSelector.section == 'msftAdditionalParticipantsDetails3' ||
                $scope.configElementSelector.section == 'msftAdditionalParticipantsDetails4' || $scope.configElementSelector.section == 'msftAdditionalParticipantsDetails5')) {
            attendeeType = 'Microsoft Employee'
        } else if ($scope.configElementSelector && ($scope.configElementSelector.section == 'customerPartnerAttendee1' || $scope.configElementSelector.section == 'customerPartnerAttendee2' || $scope.configElementSelector.section == 'customerPartnerAttendee3' ||
                $scope.configElementSelector.section == 'customerPartnerAttendee4' || $scope.configElementSelector.section == 'customerPartnerAttendee5')) {
            attendeeType = 'Customer - Partner Attendee'
        }
        $scope.requesterConfig[$scope.configElementSelector.section].push({
            field: $scope.configElementSelector.profileFieldValue,
            questionId: $scope.configElementSelector.question.questionId,
            questionCode: $scope.configElementSelector.question.questionCode,
            attendeeTypeCode: attendeeType
        })
    }

    $scope.saveRequesterParticipantsConfig = function () {
        var reqObj = {
            eventId: $scope.selectedEvent.eventId,
            requesterConfigData: $scope.requesterConfig
        }
        MeetingInfoFctry.saveRequesterConfig(reqObj).then(function (data) {
            notificationService.success("Configurations saved successfully!!")
        })
    }

    $scope.getRequesterConfig = function () {
        $scope.refreshRequesterConfig()
        MeetingInfoFctry.getRequesterConfig({
            eventId: $scope.selectedEvent.eventId
        }).then(function (data) {
            $scope.requesterConfig = data.data
        })
    }

    $scope.refreshRequesterConfig = function () {
        $scope.requesterConfig = {}
    }

    $scope.removeElementFromConfig = function (index) {
        $scope.editMeetingInfoIndex = null;
        $scope.isEditMeetingInfo = false;
        $scope.configElements.splice(index, 1);
    }

    $scope.enableEditModeForMeetingConfig = function (index) {
        $scope.editMeetingInfoIndex = index;
        $scope.isEditMeetingInfo = true;
    }

    SessionFactory.getVersionData(req).then(function (versionData) {
        $scope.versionDataArr = [];
        angular.forEach(versionData, function (v, k) {
            if (!v.startsWith('Repository Root:') && !v.startsWith('Repository UUID') && !v.startsWith('Node Kind:') && !v.startsWith('Schedule') && !v.startsWith('Relative URL')) {
                $scope.versionDataArr.push({
                    key: v.substring(0, v.indexOf(':')),
                    value: v.substring(v.indexOf(':') + 1)
                })
            }
        })
    })
    $scope.showVersionMessageBox = function (event) {
        $scope.calendarPopOverClass = {
            'border-left': '10px solid black'
        };
        var left = event.pageX;
        var top = event.pageY;
        var theHeight = $('#eventPopOver').height();
        setTimeout(function () {
            $scope.$apply(function () {
                $scope.showVersionMessage = !$scope.showVersionMessage;
            });
        }, 10);
        $('#eventPopOver').css('left', (left - 600) + 'px');
        $('#eventPopOver').css('top', (top - (theHeight / 2) + 20) + 'px');
    }

    $scope.closePopOver = function () {
        setTimeout(function () {
            $scope.$apply(function () {
                $scope.showVersionMessage = !$scope.showVersionMessage;
            });
        }, 10);
    }

    $scope.getConfiguredMeetingTypes = function () {
        var reqObj = {
            eventId: $scope.selectedEvent.eventId
        }
        MeetingInfoFctry.getConfiguredSessionTypes(reqObj).then(function (data) {
            if (data) {
                $scope.configuredMeetingTypes = data;
            } else {
                $scope.configuredMeetingTypes = []
            }
        }, function (error) {
            notificationService.error("Error occurred while fetching configured meeting types.", error.data)
        })
    }

    $scope.makeDefaultMeetingType = function (item) {
        if (item.typeId == $scope.defaultMeetingType.typeId) {
            $scope.defaultMeetingType = {};
            return;
        }
        $scope.defaultMeetingType = item;
    }

    $scope.saveDefaultMeetingType = function () {
        var reqObj = {
            eventId: $scope.selectedEvent.eventId,
            typeId: $scope.defaultMeetingType.typeId
        }
        SessionFactory.saveDefaultMeetingType(reqObj).then(function (data) {
            notificationService.success("Default Meeting Type save successfully.")
        }, function (error) {
            notificationService.error("Error occurred while saving Default Meeting Type: ", error.data)
        })
    }

    $scope.getOnSiteConfigData = function () {
        $scope.onSiteSettingConfigData = {}
        var reqObj = {
            eventId: $scope.selectedEvent.eventId
        }
        MeetingInfoFctry.getOnSiteSettingConfigData(reqObj).then(function (data) {
            if (data && data.data) {
                $scope.onSiteSettingConfigData = data.data;
            } else {
                $scope.onSiteSettingConfigData = {
                    showCheckInAllOnUpdateMeeting: false
                }
            }
        }, function (error) {
            notificationService.error("Error occurred while fetching on-site setting config data." + error.data)
        })
    }

    $scope.saveOnSiteSettings = function () {
        var reqObj = {
            eventId: $scope.selectedEvent.eventId,
            data: $scope.onSiteSettingConfigData
        }
        MeetingInfoFctry.saveOnSiteSettingConfig(reqObj).then(function (data) {
            $scope.onSiteSettingConfigData = data.data;
            notificationService.success("On-Site Setting Config saved successfully.")
        }, function (error) {
            notificationService.error("Error occurred while saving on-site setting config." + error.data)
        })
    }

}]);