var LogoutCtrl = concurApp.controller('LogoutCtrl', ['$scope', '$state', '$filter', '$rootScope', 'localStorageService', '$modalStack', 'AuthFctry', 'ipCookie', function ( $scope, $state, $filter, $rootScope, localStorageService, $modalStack, AuthFctry, ipCookie) {
    $modalStack.dismissAll("");
    
    if(ipCookie('uuid') == null || ipCookie('uuid') == '') {
    	$state.go('login');
    } else {
    	 AuthFctry.logout({}).then(function(data){
    		ipCookie.remove('uuid')
	        swal({  title:"",
	           text: "You have been successfully logout.",
	           type : "success",    
	           confirmButtonText: "Login",
	           closeOnConfirm: true,
	           confirmButtonClass: "btn btn-danger",
	           buttonsStyling: false,
	           allowEscapeKey: false
	        }, function(isConfirm) {
	           $state.go('login');
	        });
    	 });
    }
}]);