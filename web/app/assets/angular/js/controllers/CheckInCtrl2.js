var CheckInCtrl = concurApp.controller('CheckInCtrl', ['$scope', 'CalendarFctry', '$modalInstance', 'meetingEvent', '$filter', 'GlobalMethodService', 'GlobalVariableService', 'SessionFactory', 'locations', 'notificationService', function ($scope, CalendarFctry, $modalInstance, meetingEvent, $filter, GlobalMethodService, GlobalVariableService, SessionFactory, locations, notificationService) {
    $scope.statuses = [];
    
    $scope.meetingEvent = meetingEvent; 
    $scope.isUpdate = false;
    $scope.dateTimeFormat = 'MM/dd/yyyy h:mm a';
    $scope.locations = locations;
    
    $scope.meetingObject = {};
    $scope.sessionTimeHandler = {};
    $scope.attendeesBySearch = [];
    $scope.loading = true;
    $scope.loadCount++;
    
    $scope.setCustomStartAndEndTime = function() {
        now = new Date();
        if($scope.meetingEvent.id == null) {
            var utcTimeStamp = (new Date(meetingEvent.startTime).getTime() + now.getTimezoneOffset() * 60000);
            $scope.sessionTimeHandler.startTime = utcTimeStamp;
            var utcTimeStamp = (new Date(meetingEvent.endTime).getTime() + now.getTimezoneOffset() * 60000);
            $scope.sessionTimeHandler.endTime = utcTimeStamp;
        } else {
            var utcTimeStamp = (new Date(meetingEvent.startDate).getTime());
            $scope.sessionTimeHandler.startTime = utcTimeStamp;
            var utcTimeStamp = (new Date(meetingEvent.endDate).getTime());
            $scope.sessionTimeHandler.endTime = utcTimeStamp; 
        }
        
    }
    $scope.setCustomStartAndEndTime();
    
    // Time Picker Initializatio
    $scope.initializeTimeOptions = function() {
        $scope.hstep = 1;
        $scope.mstep = 5;
        $scope.ismeridian = true;
    }
    $scope.initializeTimeOptions();
    
    $scope.getSessionObjectById = function(id) {
        var requestObject = {"sessionId" : id};
        SessionFactory.getSessionById(requestObject).then(function(data) {
            $scope.meetingObject =  data;
            if($scope.loadCount >= 1) {
                $scope.loading = false;    
            }
            $scope.loadCount++;
        });
    }
    
    $scope.init = function () {
        $scope.loading = true;
        if($scope.meetingEvent.id != null) {
            $scope.isUpdate = true;
            $scope.getSessionObjectById($scope.meetingEvent.sessionId);
        } else {
            $scope.isUpdate = false;
            $scope.meetingObject.name = $scope.meetingEvent.name;
            $scope.meetingObject.confSessionStatus = {id : 6, name : 'Scheduled'};
            $scope.meetingObject.abstractDes = "Custom Abstract Description";
            $scope.meetingObject.abstractSessionDoc = {};
            $scope.meetingObject.capacity = 10;
            $scope.meetingObject.confSessionFees = [];
            $scope.meetingObject.confSessionLevel = null;
            $scope.meetingObject.confSessionSpeakers = [];
            $scope.meetingObject.confSessionType = { "id": 3 }
            $scope.meetingObject.createSource = "Event Planner";
            $scope.meetingObject.description = "description";
            $scope.meetingObject.duration = 30;
            $scope.meetingObject.eventId = GlobalVariableService.eventId;
            $scope.meetingObject.eventTrack = { "id": 109 };
            $scope.meetingObject.noOfInstances = 1;
            $scope.meetingObject.sessionCode = GlobalMethodService.getUniqueCode();
            $scope.meetingObject.industry = [];
            $scope.meetingObject.jobFunction = [];
            $scope.meetingObject.nonAbstractSessionDocs = [];
            $scope.meetingObject.tags = [];
            $scope.meetingObject.uniqueId = 2491;
            $scope.meetingObject.userId = 2491;
            $scope.loading = false;
        }
        
        CalendarFctry.statuses(function name(data) {
            $scope.statuses = data;
        })
    }
    
    $scope.getAttendeesList = function(sessionId){
        CalendarFctry.getAttendeesList(sessionId).then(function(data){
            $scope.options = data;
            console.log('Attendees Data: ', $scope.filterdOption);
        });
    }
                                                       
    $scope.createSessionInstanceToPublish = function() {
        var sessionInstance = {};
        sessionInstance.endDate = GlobalMethodService.getDateOrTimeByFormat($scope.sessionTimeHandler.endTime, $scope.dateTimeFormat);
        sessionInstance.startDate = GlobalMethodService.getDateOrTimeByFormat($scope.sessionTimeHandler.startTime, $scope.dateTimeFormat);
        sessionInstance.eventId = GlobalVariableService.eventId;
        sessionInstance.resource = $scope.isUpdate ? $scope.meetingEvent.resourceId : $scope.meetingEvent.resource.id;
        sessionInstance.id = $scope.meetingEvent.id;   
        return sessionInstance;
    }                                                   

    $scope.addUpdateMeeting = function () {
        $scope.loading = true;
        var data = {};
        data.meetingObject = $scope.meetingObject;
        data.sessionInstance = $scope.createSessionInstanceToPublish();
        data.queryObject = {"eventCode" : GlobalVariableService.eventCode, "accountCode" : GlobalVariableService.accountCode}
        console.log(data.meetingObject)
        SessionFactory.createUpdateMeeting(data).then(function(resp) {
            notificationService.success($filter('translate')('meetingApp.messages.successMsg'));
            $modalInstance.close("done");
       }, function() {
            $scope.loading = false;
            notificationService.error($filter('translate')('meetingApp.messages.errorMsg'));       
       })

    }
    
    $scope.getLocationName = function(id) {
        var locationName = "";
        angular.forEach($scope.locations, function(v,k) {
            if(v.id == id) {
                locationName = v.name;
            }
        })
        return locationName;
    }
    $scope.getLocationName();
    $scope.searchAttendees = function (params) {
        $scope.filteredOption = $filter("filter")($scope.options, {
            firstName: $scope.searchOptions.firstName,
            lastName: $scope.searchOptions.lastName
        });
        $scope.showSearch = true;
    }
    
    $scope.customQuestionAnswer = {};

    $scope.getQuestions = function() {
        $scope.questionData = [];
        var requestObject = {"eventId" : GlobalVariableService.eventId};
        SessionFactory.getQuestions(requestObject).then(function(data) {
            $scope.questionData =  data.page.content;
            console.log($scope.questionData)
            if($scope.loadCount >= 1) {
                $scope.loading = false;    
            }
            $scope.loadCount++;
        });
    }
    
    $scope.getQuestions();
    
    
    $scope.getQuestionByRegField = function(regField) {
        var found = false;
        var answer;
        angular.forEach($scope.questionData, function(v,k) {
            if(v.questionAssignment.fieldName == regField && !found) {
                answer = v.answers;
                found = true;
            }
        })
        return answer;
    }
    
    $scope.close = function (params) {
        $modalInstance.close();
    }
    $scope.init();
}]);