concurApp.factory('SearchFctry', ['$http', '$resource', '$q', 'GlobalVariableService', function( $http, $resource, $q, GlobalVariableService){
    
    var searchFctryData = {};

    var resource = $resource(GlobalVariableService.serverUrl + '/search/:action',{
        action: '@action'
    },{
        'searchData': { method: 'GET', params: { action: 'searchData'}, isArray: true}
    });

    var _searchData = function(parms){
        var deferred = $q.defer();
        resource.searchData(parms, function(response){
            deferred.resolve(response);
        },
        function(response){
            deferred.reject(response)
        });

        return deferred.promise;
    }

    searchFctryData.searchData = _searchData;

    return searchFctryData;
}]);