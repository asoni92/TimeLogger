var CalendarCtrl = concurApp.controller('CalendarCtrl', ['CalendarFctry', '$scope', '$compile', '$window', '$timeout', '$route', '$state', '$rootScope', '$modal', 'localStorageService', 'notificationService', '$filter', 'SessionFactory', 'GlobalVariableService', '$stateParams', '$location', 'GlobalMethodService', 'MeetingInfoFctry',
    function (CalendarFctry, $scope, $compile, $window, $timeout, $route, $state, $rootScope, $modal, localStorageService, notificationService, $filter, SessionFactory, GlobalVariableService, $stateParams, $location, GlobalMethodService, MeetingInfoFctry) {
        $scope.eventDataLoading = true;
        $scope.colorSchemes = ['#00a85d', '#9b9b9b', '#fa8a3b', '#4a4a4a', '#ffc107', '#bc232f'];
        $scope.eventId = $stateParams.eventId;
        $scope.callCount = 0;
        $scope.gridData = {};
        $scope.isLookUpMode = false;
        $scope.userMeetingSchedularMode = false;
        $scope.eventObj = null;
        $scope.searchedRegCode = null;
        $scope.showDateList = false;

        jQuery('#draggable').draggable({
            revert: true,
            revertDuration: 0,
            start: function (event, ui) {},
            stop: function (event, ui) {}
        });

        if ($scope.eventId == null || angular.isUndefined($scope.eventId) || $scope.eventId == '') {
            $state.go('event');
        }

        $scope.checkForRegCode = function () {
            if ($stateParams.mode != null && $stateParams.regCode != null) {
                $scope.searchedRegCode = $stateParams.regCode;
                if ($stateParams.mode == 'lookup') {
                    $scope.isLookUpMode = true;
                    $scope.userMeetingSchedularMode = false;
                } else if ($stateParams.mode == 'scheduleMeeting') {
                    $scope.isLookUpMode = false;
                    $scope.userMeetingSchedularMode = true;
                } else {
                    $scope.isLookUpMode = false;
                    $scope.userMeetingSchedularMode = false;
                }
            } else {
                $scope.userMeetingSchedularMode = false;
                $rootScope.scheduledMeetingUser = null;
            }
        }

        $scope.checkForRegCode();

        $scope.setInitialCalendarDate = function () {
            $scope.calendar = {};
            $scope.calendar.date = $scope.eventObj.startDate == null ? new Date() : new Date(parseInt($scope.eventObj.startDate));
        }

        $scope.getFormattedDate = function (date, format) {
            date = new Date(date)
            return $filter('date')(date, format)
        }

        $scope.getEventById = function () {
            req = {
                'eventId': $scope.eventId
            }
            SessionFactory.getEventByEventId(req).then(function (data) {
                if (data != null && data.eventDTO != null && data.eventDTO.eventId != null) {
                    $scope.eventObj = data.eventDTO;
                    if ($scope.eventObj.startDate != null && $scope.eventObj.endDate != null) {
                        $scope.allDays = [];
                        currentDate = new Date(parseInt($scope.eventObj.startDate))
                        endDate = new Date(parseInt($scope.eventObj.endDate));
                        while (currentDate <= endDate) {
                            $scope.allDays.push(new Date(currentDate));
                            currentDate.setDate(currentDate.getDate() + 1);
                        }
                    }
                    $scope.setInitialCalendarDate();
                    $scope.getAllSessionData();
                    $scope.getTracks();
                } else {
                    $state.go('event')
                }
            })
        }
        $scope.getEventById();

        $scope.getAllowedAttendeeType = function () {
            SessionFactory.getAllowedAttendeeTypes({
                "eventId": $scope.eventId
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
        $scope.getAllowedAttendeeType()

        $scope.getTracks = function () {
            req = {
                eventId: $scope.eventObj.eventId
            };
            $scope.sessionTracks = [];
            SessionFactory.getSessionTracks(req).then(function (data) {
                if (data != null) {
                    $scope.sessionTracks = data;
                } else {
                    //$state.go('event')
                }
            })
        }

        $scope.getAllSessionData = function (isRefresh) {
            $scope.getCalendarData(isRefresh);
        }

        $scope.disableUserMeetingSchedularMode = function () {
            $scope.userMeetingSchedularMode = false;
            $rootScope.scheduledMeetingUser = null;
            $location.search('');
        }

        $scope.enableModeByType = function () {
            if ($scope.isLookUpMode) {
                $scope.eventDataLoading = true;
                req = {
                    'eventCode': $scope.eventObj.eventCode,
                    'accountCode': $scope.eventObj.accountCode,
                    'eventId': $scope.eventObj.eventId,
                    'registrationCode': $scope.searchedRegCode
                }
                SessionFactory.getRegistrationByCode(req).then(function (data) {
                    if (data != null) {
                        var registration = data.registrationDTO;
                        registration.profile = {
                            firstName: registration.firstName,
                            lastName: registration.lastName
                        }
                        $scope.lookUpForMeeting(registration);
                    }
                }, function () {
                    notificationService.error("No registration found for RegCode : " + $scope.searchedRegCode)
                    $location.search('');
                    $scope.isLookUpMode = false;
                    $scope.lookUpUser = null;
                    $scope.refreshGridData();
                    $scope.searchedRegCode = null;
                })
            } else if ($scope.userMeetingSchedularMode) {
                req = {
                    'eventCode': $scope.eventObj.eventCode,
                    'accountCode': $scope.eventObj.accountCode,
                    'eventId': $scope.eventObj.eventId,
                    'registrationCode': $scope.searchedRegCode
                }
                SessionFactory.getRegistrationByCode(req).then(function (data) {
                    if (data != null) {
                        var registration = data.registrationDTO;
                        registration.profile = {
                            firstName: registration.firstName,
                            lastName: registration.lastName
                        }
                        $rootScope.scheduledMeetingUser = registration;
                        $scope.refreshGridData();
                    }
                }, function () {
                    notificationService.error("No registration found for RegCode : " + $scope.searchedRegCode)
                    $location.search('');
                    $scope.userMeetingSchedularMode = false;
                    $rootScope.scheduledMeetingUser = null;
                    $scope.refreshGridData();
                    $scope.searchedRegCode = null;
                })
            } else {
                $scope.refreshGridData();
            }
        }

        $scope.getCalendarData = function (isRefresh) {
            $scope.callCount = 0;
            $scope.eventDataLoading = true;
            var requestObject = {
                'eventId': $scope.eventObj.eventId,
                'eventCode': $scope.eventObj.eventCode,
                'accountCode': $scope.eventObj.accountCode
            }
            SessionFactory.getSessionLightInstances(requestObject).then(function (data) {
                var eventData = [];
                var colorIndex = 0;
                angular.forEach(data, function (v, k) {
                    var sessiondata = v;
                    if (sessiondata.level != null) {
                        if (sessiondata.level == 'Scheduled') {
                            v.backgroundColor = $scope.colorSchemes[0];
                            v.borderColor = $scope.colorSchemes[0];
                        } else if (sessiondata.level == 'Submitted') {
                            v.backgroundColor = $scope.colorSchemes[1];
                            v.borderColor = $scope.colorSchemes[1];
                        } else if (sessiondata.level == 'Pending') {
                            v.backgroundColor = $scope.colorSchemes[2];
                            v.borderColor = $scope.colorSchemes[2];
                        } else if (sessiondata.level == 'Reserved') {
                            v.backgroundColor = $scope.colorSchemes[3];
                            v.borderColor = $scope.colorSchemes[3];
                        } else if (sessiondata.level == 'Checked In') {
                            v.backgroundColor = $scope.colorSchemes[3];
                            v.backgroundColor = $scope.colorSchemes[3];
                        } else if (sessiondata.level == 'Blocked') {
                            v.backgroundColor = $scope.colorSchemes[5];
                            v.backgroundColor = $scope.colorSchemes[5];
                        } else {
                            v.backgroundColor = $scope.colorSchemes[4];
                            v.borderColor = $scope.colorSchemes[4];
                        }
                    } else {
                        v.backgroundColor = $scope.colorSchemes[4];
                        v.borderColor = $scope.colorSchemes[4];
                    }
                    eventData.push(v);
                })
                $scope.gridData.events = eventData;
                if ($scope.callCount >= 1) {
                    if (isRefresh) {
                        $('#calendar').show();
                        $scope.initializeCalendar();
                        $('#calendar').hide();
                        $scope.enableModeByType();
                    } else {
                        $scope.initializeCalendar();
                        $('#calendar').hide();
                        $scope.enableModeByType();
                    }
                    $('.fc-resource-area').css('width', '200px');
                    $('#calendar').fullCalendar('gotoDate', $scope.calendar.date);
                }
                $scope.callCount++;
            }, function () {
                $scope.gridData.resources = [];
                events: $scope.gridData.events = [];
                $scope.initializeCalendar();
                $scope.refreshGridData();
            });
            SessionFactory.getLocationByEventId(requestObject).then(function (data) {
                $scope.gridData.resources = data.data;
                if ($scope.callCount >= 1) {
                    $scope.initializeCalendar();
                    $('#calendar').hide();
                    $scope.enableModeByType();
                    $('#calendar').fullCalendar('gotoDate', $scope.calendar.date);
                }
                $scope.callCount++;
                $('.fc-resource-area').css('width', '200px');
            })
        }


        $scope.getResourceById = function (id) {
            var obj = null;
            angular.forEach($scope.gridData.resources, function (v, k) {
                if (v.id == id) {
                    obj = v;
                }
            })
            return obj;
        }

        $scope.refreshCalendar = function () {
            $scope.showDateList = false;
            $scope.eventDataLoading = true;
            $scope.checkForRegCode();
            $('#calendar').hide();
            $('#calendar').fullCalendar('destroy');
            $scope.getAllSessionData(true)
        }

        $scope.refreshGridData = function () {
            setTimeout(function () {
                $scope.$apply(function () {
                    $('#calendar').show();
                    $('#calendar').fullCalendar('render');
                    $scope.showDateList = true;
                    $scope.eventDataLoading = false;
                });
            }, 100);
        }

        $scope.dateOptions = {
            class: 'datepicker'
        };

        $scope.goToSelectedDate = function (date) {
            $('#calendar').fullCalendar('changeView', 'timelineDay');
            $('#calendar').fullCalendar('gotoDate', date);
        }

        $scope.isOverlapping = function (event) {
            var startTime = new Date(event.start.format()).getTime();
            var endTime = new Date(event.end.format()).getTime();
            var isExists = false;
            angular.forEach($scope.gridData.events, function (v, k) {
                if (!isExists && event.resourceId == v.resourceId) {
                    mStartTime = (new Date(v.startTime)).getTime();
                    mEndTime = (new Date(v.endTime)).getTime();
                    if ((startTime > mStartTime) && (endTime <= mStartTime)) {
                        isExists = true
                    } else if (startTime <= mStartTime && endTime > mStartTime) {
                        isExists = true
                    } else if (startTime < mEndTime && endTime > mEndTime) {
                        isExists = true
                    } else if (startTime <= mStartTime && endTime > mEndTime) {
                        isExists = true
                    }
                }
            })
            return isExists;
        }

        $scope.calculateHeightOfCalendar = function () {
            $scope.calendarHeight = window.innerHeight - 226;
            if ($scope.calendarHeight < 350) {
                $scope.calendarHeight = 350;
            }
        }

        $scope.calculateHeightOfCalendar();

        $scope.initializeCalendar = function () {
            $scope.eventDataLoading = false;
            $scope.openCalendarViewDatePicker = {
                value: false
            };
            $('#calendar').fullCalendar({
                now: Date.now,
                editable: true,
                selectable: true,
                height: $scope.calendarHeight,
                scrollTime: '00:00',
                titleFormat: {
                    day: 'dddd, MMMM D, YYYY'
                },
                schedulerLicenseKey: '0301122202-fcs-1497984583',
                customButtons: {
                    calendarButton: {
                        text: '',
                        click: function ($event) {
                            $event.preventDefault();
                            $event.stopPropagation();
                            $scope.$apply(function () {
                                $scope.openCalendarViewDatePicker.value = !$scope.openCalendarViewDatePicker.value;
                            });
                            $('.fc-resource-area').css('width', '200px')
                        },
                        icon: 'a glyphicon glyphicon-calendar'
                    },
                    AllDay: {
                        text: 'All Days',
                        click: function ($event) {
                            date = new Date(parseInt($scope.eventObj.startDate));
                            $scope.goToSelectedDate(date);
                            $('.fc-timelineThreeDays-button').click();
                            $('.fc-resource-area').css('width', '200px')
                        }
                    }
                },
                header: {
                    left: 'calendarButton AllDay timelineThreeDays',
                    center: 'title',
                    right: '' //'prev next'
                },
                buttonText: {
                    today: 'Today',
                    month: 'Month',
                    week: 'Week',
                    day: 'Day',
                    days: 'Days',
                    list: 'List',
                    timelineThreeDays: 'All Days'
                },
                eventOverlap: function (stillEvent, movingEvent) {
                    return false;
                },
                minTime: '07:00:00',
                maxTime: '18:00:00',
                droppable: true,
                eventReceive: function (event) {
                    if ($scope.isOverlapping(event)) {
                        $('#calendar').fullCalendar('removeEvents', event._id);
                        notificationService.error("Another meeting is scheduled at the same time.");
                    } else {
                        resourceId = event.resourceId;
                        $('#calendar').fullCalendar('removeEvents', event._id);
                        var modalInstance = $modal.open({
                            templateUrl: '/app/assets/angular/views/checkIn.html',
                            controller: 'CheckInCtrl',
                            size: 'lg',
                            scope: $scope,
                            resolve: {
                                meetingEvent: function () {
                                    return {
                                        "startTime": event.start,
                                        "endTime": event.end,
                                        "eventType": 1,
                                        "resource": $scope.getResourceById(resourceId)
                                    }
                                },
                                locations: function () {
                                    return $scope.gridData.resources;
                                },
                                event: function () {
                                    return $scope.eventObj;
                                },
                                meetingTypes: function () {
                                    return $scope.configuredMeetingTypes;
                                },
                                isBlockedEvent: function () {
                                    return true;
                                },
                                tracks: function () {
                                    return $scope.sessionTracks;
                                }
                            }
                        });
                        modalInstance.result.then(
                            function (result) {
                                if (result != null) {
                                    var event = {};
                                    event.eventId = result[0].eventId;
                                    event.title = result[0].sessionTitle;
                                    event.start = result[0].start;
                                    event.end = result[0].end;
                                    event.startTime = result[0].startTime;
                                    event.endTime = result[0].endTime;
                                    event.startDate = result[0].startDate;
                                    event.endDate = result[0].endDate;
                                    event.regAttendees = result[0].regAttendees;
                                    color = $scope.getColorBasedOnLevel(result[0].level);
                                    event.backgroundColor = color;
                                    event.borderColor = color;
                                    event.resourceId = resourceId;
                                    event.id = result[0].sessionId;
                                    event.sessionId = result[0].sessionId;
                                    event.sessionCode = result[0].sessionCode;
                                    event.instanceId = result[0].instanceId;
                                    event.venue = result[0].venue;
                                    event.locationCode = result[0].locationCode;
                                    $('#calendar').fullCalendar('renderEvent', event, true);
                                }
                            },
                            function (result) {

                            }
                        );
                    }
                },
                eventAfterRender: function (event, element, view) {},
                dropAccept: '.cool-event',
                drop: function (date, allDay, test3, test4, resourceId) {

                },
                selectOverlap: function (event) {
                    return event.rendering === 'background';
                },
                viewRender: function (view, element) {
                    var inlineWidthCss = $('.fc-resource-area').attr('style') ? $('.fc-resource-area').attr('style').indexOf('width') : $('.fc-resource-area').attr('style');
                    if (inlineWidthCss == undefined) {
                        $('.fc-resource-area').css('width', '200px')
                    } else {
                        $('.fc-resource-area').css('width', $('fc-resource-area').css('width'))
                    }
                },
                slotEventOverlap: false,
                defaultView: 'timelineDay',
                views: {
                    timelineThreeDays: {
                        type: 'timeline',
                        duration: {
                            days: $scope.allDays.length > 0 ? $scope.allDays.length : 1
                        }
                    }
                },
                resourceColumns: [{

                    labelText: 'Room',
                    field: 'locationCode'
                }, ],
                resourceGroupField: 'venue',
                resources: $scope.gridData.resources,
                events: $scope.gridData.events,
                eventDrop: function (event, delta, revertFunc) {
                    $scope.updateEvent(event, delta, revertFunc);
                },
                eventResize: function (event, delta, revertFunc, jsEvent, ui, view) {
                    $scope.updateEvent(event, delta, revertFunc);
                },
                eventMouseover: function (calEvent, jsEvent) {
                    var name = '';
                    angular.forEach(calEvent.regAttendees, function (v, k) {
                        if ($scope.allowedAttendeeTypeNames.indexOf(v.code) > -1) {
                            name = name + ((v.firstName + ' ' + v.lastName) + (v.organization ? (' - ' + v.organization) : '')) + '<br>'
                        }
                    })
                    var tooltip = '<div class="tooltip" style="text-align: left !important">Meeting Name: ' +
                        calEvent.title +
                        '<br> Start Time: ' + calEvent.startTime.split(' ')[1] +
                        '<br> End Time: ' + calEvent.endTime.split(' ')[1] +
                        '<br> Location: ' + calEvent.venue + ' - ' + calEvent.locationCode +
                        '<br><span style="' + ((calEvent.regAttendees.length > 0) ? "" : "display:none") + '"> Attendees: ' + name +
                        '</span></div>';
                    var $tooltip = $(tooltip).appendTo('body');
                    $(this).mouseover(function (e) {
                        $(this).css('z-index', 10000);
                        $tooltip.fadeIn('500');
                        $tooltip.fadeTo('10', 1.9);
                    }).mousemove(function (e) {
                        $tooltip.css('top', e.pageY + 10);
                        $tooltip.css('left', e.pageX + 20);
                    });
                },

                eventMouseout: function (calEvent, jsEvent) {
                    $(this).css('z-index', 8);
                    $('.tooltip').remove();
                },
                eventClick: function (event, start, end) {
                    var modalInstance = $modal.open({
                        templateUrl: '/app/assets/angular/views/checkIn.html',
                        controller: 'CheckInCtrl',
                        size: 'lg',
                        resolve: {
                            meetingEvent: function () {
                                return event;
                            },
                            locations: function () {
                                return $scope.gridData.resources;
                            },
                            event: function () {
                                return $scope.eventObj;
                            },
                            meetingTypes: function () {
                                return $scope.configuredMeetingTypes;
                            },
                            isBlockedEvent: function () {
                                return false;
                            },
                            tracks: function () {
                                return $scope.sessionTracks;
                            }
                        }
                    });
                    modalInstance.result.then(
                        function (result) {
                            if (result != null) {
                                if (!Array.isArray(result)) {
                                    $('#calendar').fullCalendar('removeEvents', result.deleteId);
                                    $scope.gridData.events = $scope.gridData.events.filter(function (item) {
                                        return item.id !== result.deleteId;
                                    })
                                } else {
                                    event.title = result[0].sessionTitle;
                                    event.start = result[0].start;
                                    event.startTime = result[0].startTime;
                                    event.endTime = result[0].endTime;
                                    event.startDate = result[0].startDate;
                                    event.endDate = result[0].endDate;
                                    event.end = result[0].end;
                                    event.regAttendees = result[0].regAttendees;
                                    color = $scope.getColorBasedOnLevel(result[0].level);
                                    event.backgroundColor = color;
                                    event.borderColor = color;
                                    $('#calendar').fullCalendar('updateEvent', event);
                                }
                            }
                        }
                    );
                },
                select: function (start, end, jsEvent, view, resource) {
                    if (!$scope.isLookUpMode) {
                        var modalInstance = $modal.open({
                            templateUrl: '/app/assets/angular/views/checkIn.html',
                            controller: 'CheckInCtrl',
                            size: 'lg',
                            scope: $scope,
                            resolve: {
                                meetingEvent: function () {
                                    return {
                                        "startTime": start,
                                        "endTime": end,
                                        "eventType": 1,
                                        "resource": resource
                                    }
                                },
                                locations: function () {
                                    return $scope.gridData.resources;
                                },
                                event: function () {
                                    return $scope.eventObj;
                                },
                                meetingTypes: function () {
                                    return $scope.configuredMeetingTypes;
                                },
                                isBlockedEvent: function () {
                                    return false;
                                },
                                tracks: function () {
                                    return $scope.sessionTracks;
                                }
                            }
                        });
                        modalInstance.result.then(
                            function (result) {
                                if (result != null) {
                                    var event = {};
                                    event.eventId = result[0].eventId;
                                    event.title = result[0].sessionTitle;
                                    event.start = result[0].start;
                                    event.end = result[0].end;
                                    event.startTime = result[0].startTime;
                                    event.endTime = result[0].endTime;
                                    event.startDate = result[0].startDate;
                                    event.endDate = result[0].endDate;
                                    event.regAttendees = result[0].regAttendees;
                                    color = $scope.getColorBasedOnLevel(result[0].level);
                                    event.backgroundColor = color;
                                    event.borderColor = color;
                                    event.resourceId = resource.id;
                                    event.id = result[0].sessionId;
                                    event.sessionId = result[0].sessionId;
                                    event.venue = result[0].venue;
                                    event.locationCode = result[0].locationCode;
                                    event.sessionCode = result[0].sessionCode;
                                    event.instanceId = result[0].instanceId;
                                    event.venue = result[0].venue;
                                    $('#calendar').fullCalendar('renderEvent', event, true);
                                }
                            },
                            function (result) {

                            }
                        );
                    }
                }
            });
            $('.fc-resource-area').css('width', '200px');
        }

        $scope.getColorBasedOnLevel = function (level) {
            if (level != null) {
                if (level == 'Scheduled') {
                    return $scope.colorSchemes[0];
                    return $scope.colorSchemes[0];
                } else if (level == 'Submitted') {
                    return $scope.colorSchemes[1];
                    return $scope.colorSchemes[1];
                } else if (level == 'Pending') {
                    return $scope.colorSchemes[2];
                    return $scope.colorSchemes[2];
                } else if (level == 'Reserved') {
                    return $scope.colorSchemes[3];
                    return $scope.colorSchemes[3];
                } else if (level == 'Checked In') {
                    return $scope.colorSchemes[3];
                    return $scope.colorSchemes[3];
                } else if (level == 'Blocked') {
                    return $scope.colorSchemes[5];
                    return $scope.colorSchemes[5];
                } else {
                    return $scope.colorSchemes[4];
                    return $scope.colorSchemes[4];
                }
            } else {
                return $scope.colorSchemes[4];
                return $scope.colorSchemes[4];
            }
        }

        // Attendee Search Modal
        $scope.openAttendeeSearchModal = function () {
            var modalInstance = $modal.open({
                templateUrl: '/app/assets/angular/views/attendeeSearchModal.html',
                controller: 'AttendeeSearchCtrl',
                size: 'md',
                resolve: {
                    aValue: function () {

                    }
                }
            });
            modalInstance.result.then(
                function (result) {
                    if (result != null) {
                        $scope.lookUpForMeeting(result);
                    }
                }
            );
        }

        $scope.updateEvent = function (event, delta, revertFunc) {
            swal({
                title: "Are you sure you want to modify or move this meeting?",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes",
                closeOnConfirm: true
            }, function (isConfirm) {
                if (isConfirm) {
                    var postEvent = {
                        "eventId": $scope.eventObj.eventId,
                        "startDate": event.start.format("MM/DD/YYYY hh:mm t") + "m",
                        "endDate": event.end.format("MM/DD/YYYY hh:mm t") + "m",
                        "id": event.id,
                        "resource": event.resourceId,
                        "accountCode": $scope.eventObj.accountCode,
                        "eventCode": $scope.eventObj.eventCode,
                        "sessionCode": event.sessionCode,
                        "instanceId": event.instanceId
                    }
                    var duration = GlobalMethodService.getMinuteDifferenceBetweenDates(new Date(postEvent.startDate), new Date(postEvent.endDate));
                    if (duration > 660) {
                        notificationService.error("Duration can be of maximum 11 hrs.");
                        revertFunc();
                        return;
                    }
                    event.editable = false;
                    SessionFactory.updateMeetingOnDragAndDrop(postEvent).then(function (data) {
                        event.editable = true;
                        event.endDate = postEvent.endDate;
                        event.startDate = postEvent.startDate;
                        $('#calendar').fullCalendar('updateEvent', event);
                        notificationService.success('Success!!!');
                    }, function () {
                        notificationService.error('Error Occurred while updating meeting. We are syncing back.');
                        postEvent.endDate = $filter('date')(new Date(event.endTime), "MM/dd/yyyy hh:mm a");
                        postEvent.startDate = $filter('date')(new Date(event.startTime), "MM/dd/yyyy hh:mm a");
                        SessionFactory.updateMeetingOnDragAndDrop(postEvent).then(function (data) {
                            event.editable = true;
                            event.endDate = postEvent.endDate;
                            event.startDate = postEvent.startDate;
                            $('#calendar').fullCalendar('updateEvent', event);
                        });
                        revertFunc();
                    });
                } else {
                    revertFunc();
                }
            })
        }


        $scope.lookUpForMeeting = function (registration) {
            $('#calendar').hide();
            $scope.showDateList = false;
            $scope.isLookUpMode = true;
            $scope.userMeetingSchedularMode = false;
            $scope.lookUpUser = registration;
            $scope.lookUpData = [];
            $scope.eventDataLoading = true;
            var requestObject = {
                eventId: $scope.eventObj.eventId,
                eventCode: $scope.eventObj.eventCode,
                accountCode: $scope.eventObj.accountCode,
                regCode: registration.registrationCode
            }
            SessionFactory.getSessionsInstanceByRegCode(requestObject).then(function (data) {
                $scope.lookUpData = data;
                $scope.filterLookUpData(registration);
            }, function () {
                $scope.showDateList = true;
                notificationService.error("No registration found for RegCode : " + registration.registrationCode)
                $scope.refreshGridData();
            })
        }

        $scope.filterLookUpData = function (registration) {
            $scope.commonUniqueIds = [];
            var goToDate = null;
            $('#calendar').fullCalendar('destroy');
            if ($scope.lookUpData.length > 0) {
                angular.forEach($scope.lookUpData, function (v, k) {
                    $scope.commonUniqueIds.push(v.sessionId);
                });
                angular.forEach($scope.gridData.events, function (ev, ek) {
                    if ($scope.commonUniqueIds.indexOf(ev.sessionId) >= 0) {
                        if (goToDate == null) {
                            goToDate = ev.startDate;
                        }
                        ev.className = 'lookUpEventEnable';
                    } else {
                        ev.className = 'lookUpEventDisable';
                        ev.editable = false;
                    }
                })
            } else {
                angular.forEach($scope.gridData.events, function (ev, ek) {
                    ev.className = 'lookUpEventDisable';
                    ev.editable = false;
                })
            }
            $('#calendar').show();
            $scope.initializeCalendar();
            $scope.refreshGridData();
            if ($scope.lookUpData.length > 0) {
                notificationService.notify($scope.lookUpData.length + " Meetings found for " + registration.profile.firstName + " " + registration.profile.lastName);
                $('#calendar').fullCalendar('gotoDate', goToDate);
            } else {
                $('#calendar').fullCalendar('gotoDate', $scope.calendar.date);
                notificationService.notify("No Meetings found for " + registration.profile.firstName + " " + registration.profile.lastName);
            }
        }

        $scope.disableLookUpMode = function () {
            $location.search('');
            $stateParams.regCode = null;
            $scope.lookUpUser = null;
            $scope.lookUpData = [];
            $scope.isLookUpMode = false;
            $scope.refreshCalendar();
        }

        $scope.logout = function () {
            $state.go('logout');
        }

        $scope.toSearch = function () {
            $state.go('search', {
                eventId: $scope.eventId
            });
        }

        $scope.getSessionTypes = function () {
            var req = {
                eventId: $scope.eventId
            }
            SessionFactory.getSessionTypes(req).then(function (data) {
                if (data != null) {
                    $scope.meetingTypes = data;
                }
            })
        }
        $scope.getSessionTypes();

        $scope.goToMeetingByLocation = function () {
            $state.go('meetingByLocation', {
                eventId: $scope.eventObj.eventId
            });
        }

        $scope.goToEventList = function () {
            $state.go('event');
        }

        $scope.getConfiguredSessionTypes = function () {
            var req = {
                eventId: $scope.eventId
            }
            MeetingInfoFctry.getConfiguredSessionTypes(req).then(function (data) {
                if (data != null) {
                    $scope.configuredMeetingTypes = data;
                }
            })
        }
        $scope.getConfiguredSessionTypes()
    }
]);