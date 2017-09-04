concurApp.factory('requestInterceptor', function($q, $injector, $rootScope, $timeout,  localStorageService, notificationService,  $cookieStore, ipCookie) {
	return {
		request: function(config) {
            config.headers = config.headers || {};
            config.headers['X-Requested-With'] = location.hostname;
            config.headers['uuid'] = ipCookie('uuid');
            config.headers['portal_id'] = '';
            config.headers['server_url'] = '';
            return config;
		},
		response: function(response) {
           return response;
		},
		requestError: function(rejectReason) {
           return $q.reject(rejectReason);
		},
		responseError: function(rejectReason) {
           if(rejectReason.status === 401 || rejectReason.status === 403 ) {
        	    $rootScope.isSessionLogout = true;
        	    ipCookie.remove('uuid');
				swal({
                   title:"",
                   text: "Your Session has been expired. Please login again to continue.",
                   type: "warning",
                   confirmButtonText: "Login",
                   closeOnConfirm: true,
                   confirmButtonClass: "btn btn-danger",
                   buttonsStyling: false,
                   allowEscapeKey:false
                }, function(isConfirm) {
                   $injector.get('$state').transitionTo('login');
                });
				return $q.reject(rejectReason);
	        }
			else if(rejectReason.status === 429){
				return $q.reject(rejectReason);
			}
			else {
				if(rejectReason.data && rejectReason.data.indexOf('Your Certain Session Is Expired') >= 0) {
					$rootScope.isSessionLogout = true;
	        	    ipCookie.remove('uuid');
					swal({
	                   title:"",
	                   text: "Your Session to Certain Server is expired or inactive. Please login again to continue.",
	                   type: "warning",
	                   confirmButtonText: "Login",
	                   closeOnConfirm: true,
	                   confirmButtonClass: "btn btn-danger",
	                   buttonsStyling: false,
	                   allowEscapeKey:false
	                }, function(isConfirm) {
	                   $injector.get('$state').transitionTo('login');
	                });
				} else {
					return $q.reject(rejectReason);
				}
	        }
		}
	};
});