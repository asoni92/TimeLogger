concurApp.factory('MeetingInfoFctry', ['$http', '$resource', '$q', 'GlobalVariableService', function ($http, $resource, $q, GlobalVariableService) {
    var meetingInfoData = {};
    var serverUrl = location.host;
    var resource = $resource(location.protocol + '//' + serverUrl + '/service/meetingInfo/:action', {
        action: '@action'
    }, {
        'getConfig': {
            method: 'GET',
            params: {
                action: 'getConfig'
            },
            isArray: false
        },
        'saveConfig': {
            method: 'POST',
            params: {
                action: 'saveConfig'
            }
        },
        'getAllMeetingInfoConfigByEventId': {
            method: 'GET',
            params: {
                action: 'getAllMeetingInfoConfigByEventId'
            },
            isArray: true
        },
        'getConfiguredSessionTypes': {
            method: 'GET',
            params: {
                action: 'getConfiguredSessionTypes'
            },
            isArray: true
        },
        'getRequesterConfig': {
            method: 'GET',
            params: {
                action: 'getRequesterConfig'
            },
            isArray: false
        },
        'saveRequesterConfig': {
            method: 'POST',
            params: {
                action: 'saveRequesterConfig'
            }
        },
        'getOnSiteSettingConfigData': {
            method: 'GET',
            params: {
                action: 'getOnSiteSettingConfigData'
            },
            isArray: false
        },
        'saveOnSiteSettingConfig': {
            method: 'POST',
            params: {
                action: 'saveOnSiteSettingConfig'
            }
        }
    })
    var _getConfig = function (parms) {
        var deferred = $q.defer();
        resource.getConfig(parms, function (response) {
            deferred.resolve(response);
        }, function (response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }
    var _saveConfig = function (parms) {
        var deferred = $q.defer();
        resource.saveConfig(parms, function (response) {
            deferred.resolve(response);
        }, function (response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }
    var _getAllMeetingInfoConfigByEventId = function (parms) {
        var deferred = $q.defer();
        resource.getAllMeetingInfoConfigByEventId(parms, function (response) {
            deferred.resolve(response);
        }, function (response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }
    var _getConfiguredSessionTypes = function (parms) {
        var deferred = $q.defer();
        resource.getConfiguredSessionTypes(parms, function (response) {
            deferred.resolve(response);
        }, function (response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }
    var _getRequesterConfig = function (parms) {
        var deferred = $q.defer();
        resource.getRequesterConfig(parms, function (response) {
            deferred.resolve(response);
        }, function (response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }
    var _saveRequesterConfig = function (parms) {
        var deferred = $q.defer();
        resource.saveRequesterConfig(parms, function (response) {
            deferred.resolve(response);
        }, function (response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }
    var _getOnSiteSettingConfigData = function (parms) {
        var deferred = $q.defer();
        resource.getOnSiteSettingConfigData(parms, function (response) {
            deferred.resolve(response);
        }, function (response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }
    var _saveOnSiteSettingConfig = function (parms) {
        var deferred = $q.defer();
        resource.saveOnSiteSettingConfig(parms, function (response) {
            deferred.resolve(response);
        }, function (response) {
            deferred.reject(response);
        });
        return deferred.promise;
    }
    meetingInfoData.getConfig = _getConfig;
    meetingInfoData.saveConfig = _saveConfig;
    meetingInfoData.getAllMeetingInfoConfigByEventId = _getAllMeetingInfoConfigByEventId;
    meetingInfoData.getConfiguredSessionTypes = _getConfiguredSessionTypes;
    meetingInfoData.getRequesterConfig = _getRequesterConfig;
    meetingInfoData.saveRequesterConfig = _saveRequesterConfig;
    meetingInfoData.getOnSiteSettingConfigData = _getOnSiteSettingConfigData;
    meetingInfoData.saveOnSiteSettingConfig = _saveOnSiteSettingConfig;
    return meetingInfoData;
}]);