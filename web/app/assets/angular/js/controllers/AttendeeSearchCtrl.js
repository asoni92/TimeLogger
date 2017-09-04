var AttendeeSearchCtrl = concurApp.controller('AttendeeSearchCtrl', ['$scope', '$modal', '$modalInstance', 'SessionFactory', 'GlobalMethodService', 'GlobalVariableService', '$filter', 'notificationService', '$stateParams', function ($scope, $modal, $modalInstance, SessionFactory, GlobalMethodService, GlobalVariableService, $filter, notificationService, $stateParams) {

    $scope.registrations = [];
    $scope.attendeeSearchObject = {
        firstName: '',
        lastName: ''
    };
    $scope.selectedRegistraion = {};
    $scope.loading = false;
    $scope.eventId = $stateParams.eventId;

    if ($scope.eventId == null || angular.isUndefined($scope.eventId) || $scope.eventId == '') {
        $state.go('event');
    }

    $scope.getEventById = function () {
        req = {
            'eventId': $scope.eventId
        }
        SessionFactory.getEventByEventId(req).then(function (data) {
            if (data != null) {
                $scope.eventObj = data.eventDTO;
            } else {
                $state.go('event')
            }
        })
    }
    $scope.getEventById();

    $scope.searchForAttendees = function () {
        if (!$scope.validate()) {
            return;
        }
        $scope.selectedRegistraion = {};
        var searchTerm = '';
        $scope.loading = true;
        if ($scope.attendeeSearchObject.firstName == null || $scope.attendeeSearchObject.firstName == '') {
            searchTerm = $scope.attendeeSearchObject.lastName;
        } else {
            searchTerm = $scope.attendeeSearchObject.firstName;
        }
        var requestObject = {
            eventId: $scope.eventObj.eventId,
            eventCode: $scope.eventObj.eventCode,
            accountCode: $scope.eventObj.accountCode,
            searchTerm: $scope.attendeeSearchObject
        }
        SessionFactory.getRegistrationByFilter(requestObject).then(function (data) {
            $scope.registrations = data.data;
            angular.forEach($scope.registrations, function (v, k) {
                v.profile = {
                    firstName: v.firstName,
                    lastName: v.lastName,
                    organization: v.organization,
                    email: v.email
                }
            })
            $scope.loading = false;
        }, function () {
            $scope.loading = false;
        })
    }

    $scope.validate = function () {
        if ($scope.attendeeSearchObject.firstName == '' && $scope.attendeeSearchObject.lastName == '') {
            notificationService.error($filter('translate')('meetingApp.messages.errorNameMsg'));
            return false;
        } else {
            return true;
        }
    }

    $scope.lookUp = function () {
        if($scope.selectedRegistraion.registrationCode == null) {
            notificationService.error($filter('translate')('meetingApp.messages.noAttendeeSelected'));
            return false;
        }
        $modalInstance.close($scope.selectedRegistraion);
    }

    $scope.getRegName = function () {
        return ($scope.selectedRegistraion.firstName + ' ' + $scope.selectedRegistraion.lastName);
    }

    $scope.close = function () {
        $modalInstance.close();
    }

    $scope.selectRegistration = function (reg) {
        $scope.selectedRegistraion = reg;
    }

}]);