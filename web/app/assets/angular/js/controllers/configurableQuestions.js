var configurableQuestions = concurApp.controller('configurableQuestions', ['$scope', 'GlobalVariableService', 'meetingInfoFctry', 'notificationService', function ($scope, GlobalVariableService, meetingInfoFctry, notificationService) {

    $scope.init = function () {
        $scope.meetingInfoConfig = {
            "events": []
        }
        $scope.get();
        $scope.miConfig = {};
        $scope.miConfig.showSelectType = false;
    }

    $scope.typeChange = function () {
        //console.log($scope.meetingInfoConfig);
    }

    $scope.add = function () {
        //console.log($scope.miConfig)
        if ($scope.miConfig.type == 'event') {
            $scope.meetingInfoConfig.events.push({
                "name": $scope.miConfig.eventName,
                "sections": []
            });
            $scope.miConfig.showSelectType = true;
        } else {
            $scope.meetingInfoConfig.events[$scope.meetingInfoConfig.events.length - 1].sections.push($scope.miConfig);
        }
        console.log($scope.meetingInfoConfig)
        $scope.miConfig = {}
    }

    $scope.get = function () {
        meetingInfoFctry.getConfig().then(function (data) {
            console.log('get data: ', data);
            if(data && data.events) $scope.meetingInfoConfig.events = data.events;
            else $scope.meetingInfoConfig = { "events": [] }
        });
    }

    $scope.save = function () {
        console.log($scope.meetingInfoConfig)
        //meetingInfoConfig1 = $scope.meetingInfoConfig;
        meetingInfoFctry.saveConfig($scope.meetingInfoConfig);
        $scope.get();
    }

    $scope.addEvent = function () {
        $scope.miConfig.type = 'event'
    }

    $scope.init();
}]);