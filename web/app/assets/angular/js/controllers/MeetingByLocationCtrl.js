var MeetingByLocationCtrl = concurApp.controller('MeetingByLocationCtrl', ['$scope','GlobalVariableService', 'SessionFactory', 'notificationService', '$stateParams', '$filter', '$state', '$rootScope', function ($scope, GlobalVariableService, SessionFactory, notificationService, $stateParams, $filter, $state, $rootScope) {
    
	$scope.eventId = $stateParams.eventId;
	$scope.meetingByLocation = [];
	$scope.dateOptions = {
            class: 'datepicker'
    };
	$scope.openCalendarViewDatePicker = {value : false};
	
	$scope.calendar = {date : new Date()};
	
	$scope.goToCalendar = function() {
		$state.go('calendar', {eventId : $scope.eventObj.eventId});
	}
	
	$scope.getEventById = function () {
        req = {
            'eventId': $scope.eventId
        }
        SessionFactory.getEventByEventId(req).then(function (data) {
            if (data != null) {
                $scope.eventObj = data.eventDTO;
                $scope.calendar.date  =  data.eventDTO.startDate == null ? new Date() : new Date(parseInt(data.eventDTO.startDate));
                $scope.getMeetingByLocation();
            } else {
            	$state.go('login')
            }
        }, function() {
			$state.go('login');
        })
    }
	
	$scope.getEventById();
	
	$scope.toggleCalendar = function($event) {
		$event.preventDefault();
        $event.stopPropagation();
		$scope.openCalendarViewDatePicker.value = !$scope.openCalendarViewDatePicker.value;
	}
	
	$scope.getTimeFromString = function(date) {
		date = new Date(date)
    	return $filter('date')(date, "hh:mm a");
    }
	
	$scope.getFormattedDate = function(date, format) {
		date = new Date(date)
    	return $filter('date')(date, format)
	}
	
	
	$scope.getMeetingByLocation = function() {
		req = {
			'eventId': $scope.eventObj.eventId,
			'eventCode': $scope.eventObj.eventCode,
			'accountCode': $scope.eventObj.accountCode,
			'startDate' : $scope.getFormattedDate($scope.calendar.date, "MM/dd/yyyy"),
			'endDate' : $scope.getFormattedDate($scope.calendar.date,  "MM/dd/yyyy")
	    }
	    SessionFactory.getLocationSessionByEventId(req).then(function (data) {
	    	if (data != null) {
	    		$scope.meetingByLocation = data;
	        }
	    })
	}
	
	$scope.checkInAll = function(sessionId) {
		req = {
				'eventCode': $scope.eventObj.eventCode,
				'accountCode' : $scope.eventObj.accountCode,
				'sessionId' : sessionId,
				'status' : 'Attended'
		}
	    SessionFactory.updateSessionStatusBySessionId(req).then(function (data) {
	    	$scope.getMeetingByLocation();
	    })
	}
	
	$scope.checkinRegistrationByCode = function(regCode) {
		req = {
				'eventCode': $scope.eventObj.eventCode,
				'accountCode' : $scope.eventObj.accountCode,
				'regCode' : regCode,
				'status' : 'Attended'
		}
		SessionFactory.updateSessionStatusOfRegistration(req).then(function (data) {
	    	$scope.getMeetingByLocation();
	    })
	}
	
	$scope.isCheckInDisable = function(session) {
		var enabled = false;
		angular.forEach(session.regAttendees, function(v,k) {
			if(v.registrationSessionStatus != 'Attended') {
				enabled = true;
			} 
		})
		return !enabled;
	}
	
}]);