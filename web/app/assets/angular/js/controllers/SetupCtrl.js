var SetupCtrl = concurApp.controller('SetupCtrl', ['$scope','GlobalVariableService', 'SessionFactory', 'notificationService',function ($scope, GlobalVariableService, SessionFactory, notificationService) {
    
    $scope.init = function(){
        $scope.serverSetting = {};
        $scope.serverSetting.eventId = GlobalVariableService.eventId;
        $scope.serverSetting.accountCode = GlobalVariableService.accountCode;
        $scope.serverSetting.eventCode = GlobalVariableService.eventCode;
        $scope.serverSetting.accountId = GlobalVariableService.accountId;
        $scope.serverSetting.userId = GlobalVariableService.userId;
        $scope.serverSetting.serverUrl = GlobalVariableService.serverUrl;
        $scope.serverSetting.certainServer = GlobalVariableService.certainServer;
        $scope.serverSetting.company = GlobalVariableService.company;
    }
    
    $scope.save = function() {
        SessionFactory.settings($scope.serverSetting).then(function (data) {
            notificationService.success('Successfully Saved!!!');
            location.reload();
        });
    }

    $scope.init();
}]);