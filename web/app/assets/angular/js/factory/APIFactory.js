concurApp.factory('APIFactory', ['$http', '$resource', '$q', 'localStorageService', 'GlobalVariableService', function($http, $resource, $q, localStorageService, GlobalVariableService){
    var api = {};
    var serverUrl = location.host;
    var resource = $resource(location.protocol+'//'+serverUrl + '/service/api/:action', {
        action: '@action',
    },
    {
        'getLoggerData': { method: 'GET', params: { action: 'getLoggerData' }, isArray: false }
    })

    var _getLoggerData = function (parms) {
        var deferred = $q.defer();
        resource.getLoggerData(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    api.getLoggerData = _getLoggerData;
    return api;
}]);