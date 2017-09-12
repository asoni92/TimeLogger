concurApp.run(['$rootScope', '$http', '$modal', '$state', '$window', '$filter', 'localStorageService', 'GlobalVariableService',
    function ($rootScope, $http, $modal, $state, $window, $filter, localStorageService, GlobalVariableService) {
        $rootScope.$on("$stateChangeStart", function (event, next, nextStateParam, current, currentParams) {
            $rootScope.toState = next;
        });
    }
])