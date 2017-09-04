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
            .state('event', {
                url: '/event',
                templateUrl: '/app/assets/angular/views/event.html',
                controller: 'EventCtrl',
                friendlyName: 'Events',
            })
            .state('logout', {
                url: '/logout',
                templateUrl: '/app/assets/angular/views/logout.html',
                controller: 'LogoutCtrl'
            })
            .state('home', {
                url: '/home',
                templateUrl: '/app/assets/angular/views/home.html',
                controller: 'HomeCtrl',
                abstract: true
            })
            .state('calendar', {
                url: '/calendar/:eventId?regCode&mode',
                templateUrl: '/app/assets/angular/views/calendar.html',
                controller: 'CalendarCtrl',
                friendlyName: 'Calendar',
                params: {
                    obj: null
                },
                hideInMenu: true
            }).state('search', {
                url: '/search/:eventId',
                templateUrl: '/app/assets/angular/views/search.html',
                controller: 'SearchCtrl',
                friendlyName: 'search'
            })
            .state('demoRequest', {
                url: '/demoRequest',
                templateUrl: '/app/assets/angular/views/demoRequest.html',
                controller: 'DemoRequest',
                friendlyName: 'DEMO REQUEST'
            })
            .state('setup', {
                url: '/setup',
                templateUrl: '/app/assets/angular/views/setup.html',
                controller: 'SetupCtrl'
            })
            .state('configurableQuestions',{
                url: '/configurableQuestions',
                templateUrl: '/app/assets/angular/views/configurableQuestions1.html',
                controller: 'configurableQuestions'
            })
            .state('pullRefresh',{
                url: '/pullRefresh',
                //templateUrl: '/app/assets/angular/views/configurableQuestions1.html',
                controller: 'PullRefreshCtrl'
            })
            .state('meetingByLocation', {
                url: '/meetingByLocation/:eventId',
                templateUrl: '/app/assets/angular/views/meetingByLocation.html',
                controller: 'MeetingByLocationCtrl'
            })
            .state('lookup', {
                url: '/lookup/:accountCode/:eventCode/:regCode?mode',
                templateUrl: '/app/assets/angular/views/regCodeLookUp.html',
                controller: 'RegCodeLookUpCtrl'
            });
            
            $urlRouterProvider.otherwise('/login');
            $httpProvider.interceptors.push('requestInterceptor');
        
            $translateProvider.useStaticFilesLoader({
		          prefix : '/app/assets/angular/i18n/',
		      suffix : '.json'
	       });
	       $translateProvider.preferredLanguage('en');
      }
]);