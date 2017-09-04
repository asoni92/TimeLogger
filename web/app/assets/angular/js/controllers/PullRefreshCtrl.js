var PullRefreshCtrl = concurApp.controller('PullRefreshCtrl', ['$scope', 'SessionFactory', 'notificationService', 'localStorageService', '$state', function ($scope, SessionFactory, notificationService, localStorageService, $state) {

    $scope.init = function () {
        var event = localStorageService.get('event');
        $scope.pullData(event);
    }

    $scope.pullData = function (event) {
        console.log('event: ', event)
        SessionFactory.syncEventData(event).then(function (data) {
            notificationService.success("Event: " + event.eventName + " updated with latest data!!");
            $state.go('calendar');
        })
    }

    $scope.init();
}]);