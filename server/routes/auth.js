module.exports = function (app) {

    var auth = app.controllers.auth;
    var loggerAPIController = app.controllers.timeLogAPICtrl;
   
//    app.post('/auth/authenticate', auth.authenticate);
//    app.post('/auth/logout', auth.logout);
     app.post('/api/processRequest', loggerAPIController.processRequest);

};