var LoginCtrl = concurApp.controller('LoginCtrl', ['AuthFctry', '$scope', '$state', '$filter', '$rootScope', 'localStorageService', '$modalStack', 'GlobalVariableService', 'SessionFactory',  '$cookieStore', 'ipCookie', function (AuthFctry, $scope, $state, $filter, $rootScope, localStorageService, $modalStack, GlobalVariableService, SessionFactory, $cookieStore, ipCookie) {
    $scope.isLoggingIn = false;
    $modalStack.dismissAll("");
    $scope.incorrectPassword = false;
 
    $scope.user={};
    if(ipCookie("uuid") != null) {
        $state.go('event');
    }

    $scope.authenticate=function () {
        $scope.isLoggingIn = true;
        $scope.incorrectPassword = false;
        AuthFctry.authenticate({username: $scope.user.name, password: $scope.user.password}).then(function(data){
            if(data.authResponseDTO){
            	ipCookie('uuid', data.authResponseDTO.uuid, { expires: 2 }); 
            	if(data.eventId != null && data.eventId != '') {
            		$state.go('calendar', {
                        eventId : data.eventId
                    });
            	} else {
            		$state.go('event');
            	}
            } else {
            	$scope.isLoggingIn = false;
            	$scope.incorrectPassword = true;  
            }
        }, function() {
            $scope.isLoggingIn = false;
            $scope.incorrectPassword = true;
        });
    }
    
}]);