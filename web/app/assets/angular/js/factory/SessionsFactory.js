concurApp.factory('SessionFactory', ['$http', '$resource', '$q', 'localStorageService', 'GlobalVariableService', function($http, $resource, $q, localStorageService, GlobalVariableService){
    var sessionData = {};
    var serverUrl = location.host;
    var resource = $resource(location.protocol+'//'+serverUrl + '/service/sessions/:action', {
        action: '@action',
    },
    {
        'getRegistrationByFilter': { method: 'GET', params: { eventId : '@eventId' , action: 'getRegistrationByFilter' }, isArray: false },
        'getSessionLightInstances': { method: 'GET', params: { eventId : '@eventId' , action: 'getSessionLightInstances' }, isArray: true },
        'getLocationByEventId': { method: 'GET', params: { eventId : '@eventId' , action: 'getLocationByEventId' }, isArray: false },
        'createUpdateMeeting': { method: 'POST', params: { action: 'createUpdateMeeting' }, isArray: false },
        'getSessionById': { method: 'GET', params: { action: 'getSessionById' }, isArray: false },
        'getSessionsInstanceByRegCode': { method: 'GET', params: { eventId : '@eventId' , action: 'getSessionsInstanceByRegCode' }, isArray: true },
        'getSessionStatuses': { method: 'GET', params: {action: 'getSessionStatuses' }, isArray: true },
        'updateSessionStatusOfRegistration': { method: 'POST', params: { action: 'updateSessionStatusOfRegistration' }, isArray: false },
        'createNewRegistration': { method: 'POST', params: { action: 'createNewRegistration' }, isArray: false },
        'getAttendeesList': { method: 'GET', params: { action: 'getAttendeesList' }, isArray: true },
        'getEventById' : { method: 'GET', params: { action: 'getEventById' }, isArray: false },
        'getSessionLevels' : { method: 'GET', params: { action: 'getSessionLevels' }, isArray: true },
        'getAllSessions' : { method: 'GET', params: { action: 'getAllSessions' }, isArray: false },
        'settings' : { method: 'POST', params: { action: 'settings' }, isArray: false },
        'updateEvent' : { method: 'POST', params: { action: 'updateEvent' }, isArray: false },
        'getStatuses' : { method: 'GET', params: { action: 'getStatuses' }, isArray: true },
        'getTracksByEvent' :  { method: 'GET', params: { action: 'getTracksByEvent' }, isArray: true },
        'getEventsByPortalId' :  { method: 'GET', params: { action: 'getEventsByPortalId' }, isArray: true },      
        'getMeetingInfoData' :  { method: 'GET', params: { action: 'getMeetingInfoData' }, isArray: false },
        'deleteEventById' : { method: 'POST', params: { action: 'deleteEventById' }, isArray: false },
        'saveEvent' : { method: 'POST', params: { action: 'saveEvent' }, isArray: false },
        'getPortalByDomain' : { method: 'GET', params: { action: 'getPortalByDomain' }, isArray: false },
        'getPortalById' : { method: 'GET', params: { action: 'getPortalById' }, isArray: false },
        'getSessionTypes' : { method: 'GET', params: { action: 'getSessionTypes' }, isArray: true },
        'getQuestionsByEventId' : { method: 'GET', params: { action: 'getQuestionsByEventId' }, isArray: true },
        'getLocationSessionByEventId' : { method: 'GET', params: { action: 'getLocationSessionByEventId' }, isArray: true },
        'getRegistrationAnswersByRegCode' : { method: 'GET', params: { action: 'getRegistrationAnswersByRegCode' }, isArray: false },
        'syncEventData': { method: 'POST', params:{action: 'syncEventData'}, isArray: false},
        'getEventByEventId' : { method: 'GET', params: { action: 'getEventByEventId' }, isArray: false },
        'getRegistrationByCode' : { method: 'GET', params: { action: 'getRegistrationByCode' }, isArray: false },
        'updateSessionStatusBySessionId' : { method: 'POST', params: { action: 'updateSessionStatusBySessionId' }, isArray: true },
        'getSessionTracks' : { method: 'GET', params: { action: 'getSessionTracks' }, isArray: true },
        'deleteMeetingByInstanceId' : { method: 'POST', params: { action: 'deleteMeetingByInstanceId' }, isArray: false },
        'updateMeetingOnDragAndDrop' : { method: 'POST', params: { action: 'updateMeetingOnDragAndDrop' }, isArray: false },
        'changeDefaultEvent' : { method: 'POST', params: { action: 'changeDefaultEvent' }, isArray: false },
        'checkInAttendees' : { method: 'POST', params: { action: 'checkInAttendees' }, isArray: false },
        'getAllowedAttendeeTypes': {method: 'GET', params: {action: 'getAllowedAttendeeTypes'}, isArray: true},
        'getAttendeeTypes': {method: 'GET', params: {action: 'getAttendeeTypes'}, isArray: true},
        'saveAllowedAttendeeTypes': {method: 'POST', params: {action: 'saveAllowedAttendeeTypes'}, isArray:true},
        'getDefaultAttendeeType': {method: 'GET', params: {action: 'getDefaultAttendeeType'}, isArray:false},
        'validateUserAgainstEmail': {method: 'POST', params: {action: 'validateUserAgainstEmail'}, isArray:false},
        'bulkAssignRegistrationToSession': {method: 'POST', params: {action: 'bulkAssignRegistrationToSession'}, isArray:false},
        'getVersionData': {method: 'GET', params: {action: 'getVersionData'}, isArray: true},
        'saveDefaultMeetingType': {method: 'POST', params: {action: 'saveDefaultMeetingType'}, isArray: false},
        'getAttendeeBySessionId': {method: 'GET', params: {action: 'getAttendeeBySessionId'}, isArray: true},
        'getSessionsData': {method: 'GET', params: {action: 'getSessionsData'}, isArray: false}
    })
    
      
    var _getSessionLightInstances = function (parms) {
        var deferred = $q.defer();
        resource.getSessionLightInstances(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _getLocationByEventId = function (parms) {
        var deferred = $q.defer();
        resource.getLocationByEventId(parms,
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
    
     var _getSessionById = function (parms) {
        var deferred = $q.defer();
        resource.getSessionById(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _getRegistrationByFilter = function (parms) {
        var deferred = $q.defer();
        resource.getRegistrationByFilter(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _getSessionsInstanceByRegCode = function (parms) {
        var deferred = $q.defer();
        resource.getSessionsInstanceByRegCode(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _getSessionStatuses = function (parms) {
        var deferred = $q.defer();
        resource.getSessionStatuses(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _updateSessionStatusOfRegistration = function (parms) {
        var deferred = $q.defer();
        resource.updateSessionStatusOfRegistration(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
   
    var _createNewRegistration = function (parms) {
        var deferred = $q.defer();
        resource.createNewRegistration(parms,
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
    
    var _getEventById = function (parms) {
        var deferred = $q.defer();
        resource.getEventById(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
       
    var _getSessionLevels = function (parms) {
        var deferred = $q.defer();
        resource.getSessionLevels(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _getAllSessions = function (parms) {
        var deferred = $q.defer();
        resource.getAllSessions(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _settings = function (parms) {
        var deferred = $q.defer();
        resource.settings(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _getStatuses = function (parms) {
        var deferred = $q.defer();
        resource.getStatuses(parms,
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
    var _getTracksByEvent = function (parms) {
        var deferred = $q.defer();
        resource.getTracksByEvent(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }

    var _getEventsByPortalId = function (parms) {
        var deferred = $q.defer();
        resource.getEventsByPortalId(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    var _getMeetingInfoData = function (parms) {
        var deferred = $q.defer();
        resource.getMeetingInfoData(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _deleteEventById = function (parms) {
        var deferred = $q.defer();
        resource.deleteEventById(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _saveEvent = function (parms) {
        var deferred = $q.defer();
        resource.saveEvent(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _getPortalByDomain = function (parms) {
        var deferred = $q.defer();
        resource.getPortalByDomain(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _getPortalById = function (parms) {
        var deferred = $q.defer();
        resource.getPortalById(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
     
    var _getSessionTypes = function (parms) {
        var deferred = $q.defer();
        resource.getSessionTypes(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _getQuestionsByEventId = function (parms) {
        var deferred = $q.defer();
        resource.getQuestionsByEventId(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _getLocationSessionByEventId = function (parms) {
        var deferred = $q.defer();
        resource.getLocationSessionByEventId(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _getRegistrationAnswersByRegCode = function (parms) {
        var deferred = $q.defer();
        resource.getRegistrationAnswersByRegCode(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _syncEventData = function (parms) {
        var deferred = $q.defer();
        resource.syncEventData(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _getEventByEventId = function (parms) {
        var deferred = $q.defer();
        resource.getEventByEventId(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _updateSessionStatusBySessionId = function (parms) {
        var deferred = $q.defer();
        resource.updateSessionStatusBySessionId(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _getRegistrationByCode = function (parms) {
        var deferred = $q.defer();
        resource.getRegistrationByCode(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _getSessionTracks = function (parms) {
        var deferred = $q.defer();
        resource.getSessionTracks(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _deleteMeetingByInstanceId = function (parms) {
        var deferred = $q.defer();
        resource.deleteMeetingByInstanceId(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _updateMeetingOnDragAndDrop = function (parms) {
        var deferred = $q.defer();
        resource.updateMeetingOnDragAndDrop(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _changeDefaultEvent = function (parms) {
        var deferred = $q.defer();
        resource.changeDefaultEvent(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _checkInAttendees = function (parms) {
        var deferred = $q.defer();
        resource.checkInAttendees(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _getAllowedAttendeeTypes = function (parms) {
        var deferred = $q.defer();
        resource.getAllowedAttendeeTypes(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _getAttendeeTypes = function (parms) {
        var deferred = $q.defer();
        resource.getAttendeeTypes(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _saveAllowedAttendeeTypes = function (parms) {
        var deferred = $q.defer();
        resource.saveAllowedAttendeeTypes(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _getDefaultAttendeeType = function (parms) {
        var deferred = $q.defer();
        resource.getDefaultAttendeeType(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _validateUserAgainstEmail = function (parms) {
        var deferred = $q.defer();
        resource.validateUserAgainstEmail(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _bulkAssignRegistrationToSession = function (parms) {
        var deferred = $q.defer();
        resource.bulkAssignRegistrationToSession(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _getVersionData = function (parms) {
        var deferred = $q.defer();
        resource.getVersionData(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _saveDefaultMeetingType = function (parms) {
        var deferred = $q.defer();
        resource.saveDefaultMeetingType(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _getAttendeeBySessionId = function (parms) {
        var deferred = $q.defer();
        resource.getAttendeeBySessionId(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    var _getSessionsData = function (parms) {
        var deferred = $q.defer();
        resource.getSessionsData(parms,
            function (response) {
                deferred.resolve(response);
            },
            function (response) {
                deferred.reject(response);
            });

        return deferred.promise;
    }
    
    sessionData.getSessionLightInstances = _getSessionLightInstances;
    sessionData.getLocationByEventId = _getLocationByEventId;
    sessionData.createUpdateMeeting = _createUpdateMeeting;
    sessionData.getSessionById = _getSessionById;
    sessionData.getRegistrationByFilter = _getRegistrationByFilter;
    sessionData.getSessionsInstanceByRegCode = _getSessionsInstanceByRegCode;
    sessionData.getSessionStatuses = _getSessionStatuses;
    sessionData.updateSessionStatusOfRegistration = _updateSessionStatusOfRegistration;
    sessionData.createNewRegistration = _createNewRegistration;
    sessionData.getAttendeesList = _getAttendeesList;
    sessionData.getEventById = _getEventById;
    sessionData.getSessionLevels = _getSessionLevels;
    sessionData.getAllSessions = _getAllSessions;
    sessionData.settings = _settings;  
    sessionData.getStatuses = _getStatuses;
    sessionData.updateEvent =_updateEvent;
    sessionData.getTracksByEvent = _getTracksByEvent;
    sessionData.getEventsByPortalId = _getEventsByPortalId;
    sessionData.getMeetingInfoData = _getMeetingInfoData;
    sessionData.deleteEventById = _deleteEventById;
    sessionData.saveEvent = _saveEvent;
    sessionData.getPortalByDomain = _getPortalByDomain;
    sessionData.getPortalById = _getPortalById;
    sessionData.getSessionTypes = _getSessionTypes;
    sessionData.getQuestionsByEventId = _getQuestionsByEventId;
    sessionData.getLocationSessionByEventId = _getLocationSessionByEventId;
    sessionData.getRegistrationAnswersByRegCode = _getRegistrationAnswersByRegCode;
    sessionData.syncEventData = _syncEventData;
    sessionData.getEventByEventId = _getEventByEventId;
    sessionData.updateSessionStatusBySessionId = _updateSessionStatusBySessionId;
    sessionData.getRegistrationByCode = _getRegistrationByCode;
    sessionData.getSessionTracks = _getSessionTracks;
    sessionData.deleteMeetingByInstanceId = _deleteMeetingByInstanceId;
    sessionData.updateMeetingOnDragAndDrop = _updateMeetingOnDragAndDrop;
    sessionData.changeDefaultEvent =_changeDefaultEvent;
    sessionData.checkInAttendees = _checkInAttendees;
    sessionData.getAllowedAttendeeTypes = _getAllowedAttendeeTypes;
    sessionData.getAttendeeTypes = _getAttendeeTypes;
    sessionData.saveAllowedAttendeeTypes = _saveAllowedAttendeeTypes;
    sessionData.getDefaultAttendeeType = _getDefaultAttendeeType;
    sessionData.validateUserAgainstEmail = _validateUserAgainstEmail;
    sessionData.bulkAssignRegistrationToSession = _bulkAssignRegistrationToSession;
    sessionData.getVersionData = _getVersionData;
    sessionData.saveDefaultMeetingType = _saveDefaultMeetingType;
    sessionData.getAttendeeBySessionId = _getAttendeeBySessionId;
    sessionData.getSessionsData = _getSessionsData;
    return sessionData;
}]);