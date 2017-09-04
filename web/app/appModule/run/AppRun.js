concurApp.run(['$rootScope', '$http', '$modal', '$state', '$window', '$filter', 'localStorageService', 'GlobalVariableService', 'SessionFactory',
    function ($rootScope, $http, $modal, $state, $window, $filter, localStorageService, GlobalVariableService, SessionFactory) {
        $rootScope.isModified = false;
        $rootScope.domainName = "";
        $rootScope.certainUrl = GlobalVariableService.certainServer;
        $rootScope.$on("$stateChangeStart", function (event, next, nextStateParam, current, currentParams) {
            $rootScope.toState = next;
            if(current.url.startsWith('/calendar/') && next.url.startsWith('/login') && !$rootScope.isSessionLogout) {
            	event.preventDefault();
            	$state.go('calendar', {
                    eventId : currentParams.eventId
                });
                return;
            }
            $rootScope.isSessionLogout = false;
            $rootScope.error = null;
            if(GlobalVariableService.company == 'microsoft') {
                $rootScope.domainName = 'microsoft';
                $rootScope.logoPath =  "/app/assets/angular/img/microsoftLogo.png";
                $rootScope.appBackground = 'microsoftScreen';
   
            } else if(GlobalVariableService.company == 'oracle') {
                $rootScope.domainName = 'oracle';
                $rootScope.logoPath =  "/app/assets/angular/img/oracleLogo.png";
                $rootScope.appBackground = 'oracleScreen';
            } else {
                $rootScope.domainName = 'microsoft';
                $rootScope.logoPath =  "/app/assets/angular/img/microsoftLogo.png";
                $rootScope.appBackground = 'microsoftScreen';
   
            }
        });
    }
])