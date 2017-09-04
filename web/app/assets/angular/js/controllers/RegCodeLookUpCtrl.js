var RegCodeLookUpCtrl = concurApp.controller('RegCodeLookUpCtrl', ['$scope','GlobalVariableService', 'SessionFactory', 'notificationService', '$stateParams', '$filter', '$state', '$rootScope', function ($scope, GlobalVariableService, SessionFactory, notificationService, $stateParams, $filter, $state, $rootScope) {
    
	$scope.accountCode = $stateParams.accountCode;
	$scope.eventCode = $stateParams.eventCode;
	$scope.regCode = $stateParams.regCode;
	$scope.mode = '';
	if($stateParams.mode != null) {
		$scope.mode = $stateParams.mode;
		if($scope.mode == 'lookup') {
			$scope.mode = 'lookup';
		} else if($scope.mode == 'scheduleMeeting') {
			$scope.mode = 'scheduleMeeting'
		} else {
			notificationService.error("Invalid Url");
			$state.go('login');
		}
	} else {
		$scope.mode = 'scheduleMeeting';
	}
	
	$scope.callCount = 0;
	$scope.getEventByAccountCodeAndEventCode = function () {
		req = {
            'eventCode': $scope.eventCode,
            'accountCode' : $scope.accountCode
        }
        SessionFactory.getEventById(req).then(function (data) {
        	if (data != null) {
                $scope.eventObj = data.eventDTO;
                setTimeout(function() {
                	$state.go('calendar', {eventId : $scope.eventObj.eventId, regCode : $scope.regCode, mode : $scope.mode})
                },3000)
            }
        }, function() {
        	//notificationService.error("No Record Found");
        })
    }
	$scope.getEventByAccountCodeAndEventCode();
	
}]);