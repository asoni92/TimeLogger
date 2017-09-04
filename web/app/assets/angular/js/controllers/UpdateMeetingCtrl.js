var UpdateMeetingCtrl = concurApp.controller('UpdateMeetingCtrl', ['$scope', '$modalInstance', 'aValue', function ($scope, $modalInstance, aValue) {
    
    $scope.init = function(){
        //write all init processes here
        $scope.meetingInfo = {};
        $scope.attendeeSearch = {
            firstName: 'Surbhi'
        };
    }

    $scope.updateMeeting = function(){
        console.log("Meeting Info: ", $scope.meetingInfo);
    }

    $scope.toggleSearchBtn = function(){
        if(($scope.attendeeSearch.firstName != null && $scope.attendeeSearch.firstName != undefined && $scope.attendeeSearch.firstName != '')
        ||($scope.attendeeSearch.lastName != null && $scope.attendeeSearch.lastName != undefined && $scope.attendeeSearch.lastName != ''))
            return false;
        else return true;
    }
    $scope.init();
}]);