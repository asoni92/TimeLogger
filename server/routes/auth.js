module.exports = function (app) {

    var auth = app.controllers.auth;
    var loggerAPIController = app.controllers.timeLogAPICtrl;

     app.post('/api/processRequest', loggerAPIController.populateUserIdAndProcessRequest);
     app.get('/api/getLoggerData', loggerAPIController.getLoggerData);
     app.get('/api/getUserData', loggerAPIController.getUserData);
     
};