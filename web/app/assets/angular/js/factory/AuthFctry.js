concurApp.factory('AuthFctry', ['$http', '$resource', '$q', 'GlobalVariableService', function ($http, $resource, $q, GlobalVariableService) {
	var serverUrl = location.host;
	var authDataFctry = {};
    var resource = $resource(location.protocol+'//'+serverUrl + '/service/auth/:action', { action: '@action', }, {
            'authenticate': { method: 'POST', params: { action: 'authenticate'}, isArray: false},
            'logout' : { method: 'POST', params: { action: 'logout'}, isArray: false}
        }
    );

    var _authenticate = function (parms) {
        var deferred = $q.defer();
        resource.authenticate(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _logout = function (parms) {
        var deferred = $q.defer();
        resource.logout(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }

    authDataFctry.authenticate = _authenticate;
    authDataFctry.logout = _logout;
    return authDataFctry;
}]);
