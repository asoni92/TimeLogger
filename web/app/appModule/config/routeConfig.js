concurApp.config([
    '$stateProvider', '$urlRouterProvider', '$locationProvider', '$httpProvider', 'localStorageServiceProvider', 'notificationServiceProvider', '$translateProvider',
    function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, localStorageServiceProvider, notificationServiceProvider, $translateProvider) {  
        
		notificationServiceProvider.setDefaults({
				history: false,
				delay: 2000,
                closer: true,
				closer_hover: true  
			})
		;
	   
        localStorageServiceProvider
            .setPrefix('concurApp')
            .setStorageType('localStorage')
            .setNotify(true, true)
        // initialize get if not there
        if (!$httpProvider.defaults.headers.get) {
            $httpProvider.defaults.headers.get = {};    
        }
        $httpProvider.defaults.withCredentials = true;
        // // disable IE ajax request caching
        // $httpProvider.defaults.headers.get['If-Modified-Since'] = 'Mon, 26 Jul 1997 05:00:00 GMT';
        // // extra
        // $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
        // $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';

        $stateProvider
            .state('login', {
                url: '/login',
                templateUrl: '/app/assets/angular/views/login.html',
                controller: 'LoginCtrl',
                friendlyName: 'Sign In',
                hideInMenu: true,
            })
            .state('home', {
                url: '/home',
                templateUrl: '/app/assets/angular/views/home.html',
                controller: 'HomeCtrl'
            });
            
            $urlRouterProvider.otherwise('/home');
            $httpProvider.interceptors.push('requestInterceptor');
        
            $translateProvider.useStaticFilesLoader({
		          prefix : '/app/assets/angular/i18n/',
		      suffix : '.json'
	       });
	       $translateProvider.preferredLanguage('en');
      }
]);