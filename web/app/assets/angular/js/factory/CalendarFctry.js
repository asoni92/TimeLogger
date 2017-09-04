concurApp.factory('CalendarFctry', ['$http', '$resource', '$q', 'localStorageService', 'GlobalVariableService', function($http, $resource, $q, localStorageService, GlobalVariableService){
    var calendarFctryData = {};

    var resource = $resource(GlobalVariableService.serverUrl + '/calendar/:action', {
        action: '@action',
    },
    {
        'eventData': { method: 'GET', params: { action: 'eventData' }, isArray: false },
        'getResourceData': {method: 'GET', params: { action: 'getResourceData'}, isArray: false},
        'updateEvent': { method: 'POST', params: { action: 'updateEvent'}, isArray: false},
        'statuses': { method: 'GET', params: { action: 'statuses' }, isArray: true },
        'createUpdateMeeting': { method: 'POST', params: { action: 'createUpdateMeeting' }, isArray: false },
        'getAttendeesList': { method: 'POST', params: { action: 'getAttendeesList' }, isArray:true}
    })

    var _eventData = function (parms) {
        var deferred = $q.defer();
        resource.eventData(parms,
            function (response) {
                resource.getResourceData(parms, function(response1){
                    var calData = {
                        resources: response1.data,
                        events: response
                    }
                    deferred.resolve(calData);
                })
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }

    var _getResourceData = function (parms) {
        var deferred = $q.defer();
        resource.getResourceData(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }

    var _updateEvent = function (parms) {
        var deferred = $q.defer();
        resource.updateEvent(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }

    var _getAttendeesList = function (parms) {
        var deferred = $q.defer();
        resource.getAttendeesList(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }

     var _statuses = function (parms) {
        var deferred = $q.defer();
        resource.statuses(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
 var _createUpdateMeeting = function (parms) {
        var deferred = $q.defer();
        resource.createUpdateMeeting(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    calendarFctryData.eventData = _eventData;
    calendarFctryData.updateEvent = _updateEvent;
    calendarFctryData.getResourceData = _getResourceData;
    calendarFctryData.statuses = _statuses;
    calendarFctryData.createUpdateMeeting = _createUpdateMeeting;
    calendarFctryData.getAttendeesList = _getAttendeesList;
    return calendarFctryData;
}]);