//
// The main web server global initialization code.
//
// This is called from server.js to "boot" the 
// server.
//
module.exports = function (app, cb) {
    var express = require('express');
    var path = require('path');
    var util = require('util');
    var passport = require('passport');
    var SessionStore = require('express-mysql-session');
    var i18n = require("i18n");
    var fs = require('fs');
    var sprintf = require('sprintf-js').sprintf;
    var _ = require('lodash');
    var config1 = require('./scripts/config.json');
    var encryptionService = require("./lib/EncryptionDecryption.js");
    var pathPrefix = '/service';
    var logger = require('./lib/Logger.js').logger
    var compression = require('compression')

    var proxy = require('path-prefix-proxy')(pathPrefix);
    app.use(pathPrefix, proxy);
    app.use(proxy.denyUnproxied);
    var bodyParser = require('body-parser')
    
    var isVersionUpdate = process.env.npm_config_isVersionUpdate;
    if(isVersionUpdate == null) {
    	isVersionUpdate = process.env.isVersionUpdate;
    }
    if(isVersionUpdate != null && isVersionUpdate == 'true') {
    	var version_update = require('./scripts/db_update.js');
    }

    var fileUpload = require('express-fileupload');

    
    i18n.configure({
        locales: ['en', 'de'],
        directory: __dirname + '/locales'
    });


    var appname = path.basename(process.argv[1], '.js').toLowerCase();
    var log = require('winston');
    log.configure({
        transports: [new(log.transports.File)({
            filename: 'somefile.log'
        })]
    });

    // Our routes and controllers have access to "app",
    // so give them access to the log and config objects.
    config = {}
    app.log = log;
    app.config = config;


    config.bookshelf = config1.connConfig;
    app.set('port', process.env.PORT || config.port || 3000);
    app.set('views', path.join(__dirname, 'views'));
    app.engine('html', require('ejs').renderFile);

    app.use('/services', express);
    app.use(function (req, res, next) {
    	console.log(!req.headers["access-control-request-method"] && req.url.indexOf('/api/processRequest') >= 0);
    	 if (!req.headers["access-control-request-method"] && req.url.indexOf('/api/processRequest') >= 0) {
    		 console.log('Inside')
    		 populateUserId(req, res, next);
         } else {
             handleRequest(req, res, next);
         }
    });
    
    app.use(bodyParser.urlencoded({
    	  extended: true
    }));


    // CORS
    app.use(function (req, res, next) {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Final-Length, Offset, Content-Range, Content-Disposition, server_url, portal_id, uuid');
        res.header('Access-Control-Allow-Credentials', 'true');
        if (req.method == 'OPTIONS') {
            res.send(200);
        } else {
            next();
        }
    });

    app.use(express.json());
    app.use(express.urlencoded());
    app.use(express.methodOverride());
    app.use(compression())

    app.use(i18n.init);

    app.use(express.cookieParser());
    app.use(express.bodyParser());
    //app.use(express.session({ store: SessionStore,secret: 'keyboard cat', resave: false, saveUninitialized: false,  cookie: {  httpOnly: false,secure: false }}));
    app.use(express.session({
        cookie: {
            maxAge: 36000000,
            httpOnly: false
        },
        secret: 'MySecret'
    }));
    app.use(passport.initialize());
    app.use(passport.session());

    app.use(function (req, res, next) {
        app.__ = res.__;
        next();
    });


    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));

    // Page not found errors
    app.use(function (req, res, next) {
        log.error("page not found: %s", req.url);
        res.send(app.__('Page not found'), 404);
    });

    // Server errors
    app.use(function (err, req, res, next) {
        if (err.noStackTrace)
            log.error("handled server error: status: %d: ",
                err.status || 500, err.message);
        else
            log.error("handled server error: status: %d: ",
                err.status || 500, err.stack, err);
        res.send(err.message, err.status || 500);
    });
    app.use(fileUpload());

    // Initialize Bookshelf.
    if (process.env.SQL_TRACE == "1") config.bookshelf.debug = true;
    if (process.env.SQL_TRACE == "0") config.bookshelf.debug = false;

    // bring in Bookshelf!
    var knex = require('knex')(config.bookshelf);
    //var Bookshelf = require('bookshelf')( knex );
    // Bookshelf.DB = Bookshelf.initialize( config.bookshelf );
    var bookshelf = require('bookshelf')(knex);
    var Bookshelf = require('bookshelf');
    Bookshelf.DB = bookshelf;
    app.set('schema', bookshelf);

    /*
     * Add the registry plugin to handle table relations definitions without
     * curcular dependencies.
     */
    Bookshelf.DB.plugin('registry');
    // THIS FIXES A BUG IN BS MODEL RESOLUTION VISA the registry plugin!!
    Bookshelf.DB.model('_unused', {});
    Bookshelf.DB.collection('_unused', {});
    /*
     * Add the visibility plugin to hide model fields on toJSON, and
     * virtuals to synth "name" on User from first_name and last_name.
     */
    Bookshelf.DB.plugin('visibility');
    Bookshelf.DB.plugin('virtuals');

    // Warn the user if they are running against the production
    // database...
    if (process.env.NODE_ENV) {
        var banner = require('ascii-banner');
        banner.write('Warning')
            .color('red')
            .after('>You are running against the ' + process.env.NODE_ENV.toUpperCase() + ' database<', 'red')
            .after('>This is OK, but bee careful!!!<', 'green')
            .out();
    }

    var queryDebugMode = config1.queryDebugMode
    
    populateUserId = function (req, res, next) {
        schema = app.get('schema')
        schema.model('User').forge().where({
            username: req.body.user_name,
            active: 1
        }).query(function (qb) {
            qb.debug(queryDebugMode)
        }).fetch().then(function (data) {
            if (data) {
                userData = data.toJSON();
                req.headers.user_id = data.get('id');
                console.log('User id is '+req.headers.user_id)
                handleRequest(req, res, next);
            } else {
                res.status(301).send("No Page");
            }
        }).catch(function (err) {
        	console.log(err)
            logger.error("Error occurred in verifying user: ", err)
        })
    }
    
    
    verifyUserAndPortal = function (req, res, next) {
        domain = req.headers["x-requested-with"];
        schema = app.get('schema')
        schema.model('Portal').forge().where({
            domain: domain
        }).query(function (qb) {
            qb.debug(queryDebugMode)
        }).fetch().then(function (data) {
            if (data) {
                portalData = data.toJSON();
                req.headers.portal_id = data.get('id');
                req.headers["server_url"] = portalData.serverUrl;
                if (req.url != '/auth/authenticate' && req.url.indexOf('getPortalByDomain') < 0) {
                    authenticatUserSession(req, res, next)
                } else {
                    handleRequest(req, res, next);
                }
            } else {
                res.status(301).send("No Page");
            }
        }).catch(function (err) {
            logger.error("Error occurred in verifyUserAndPortal: ", err)
        })
    }

    handleRequest = function (req, res, next) {
        var jsonp = res.jsonp;
        res.jsonp = function (obj) {
            if (req.param('fmt') == 'xml') {
                try {
                    var o = JSON.parse(JSON.stringify(obj));
                    body = xml.render(o);
                    body = body.replace(/count\+tail/g, 'count_tail');
                    res.header('Content-Type', 'text/xml');
                    return res.send(body);
                } catch (err) {
                    return next(err);
                }
            } else {
                return jsonp.call(res, obj);
            }
        };
        res.sendError = function (statusCode, err) {
            return res.status(statusCode).send(err.message);
        }
        next();
    }

    authenticatUserSession = function (req, res, next) {
        if (req.headers.uuid == null || req.headers.uuid == '' || req.headers.uuid == undefined) {
            res.status(403).send();
            return;
        }
        schema.model('UserSession').forge().where({
            uuid: req.headers.uuid,
            portalId: req.headers.portal_id,
            active: 1
        }).query(function (qb) {
            qb.debug(queryDebugMode)
        }).fetch().then(function (data) {
            if (data) {
                var userSession = data.toJSON();
                var dumpUserSession = _.clone(userSession);
                currentTime = (new Date()).getTime();
                differenceTime = (currentTime - userSession.lastHit);
                if (differenceTime < 72000000) {
                    req.session = {
                        'uuid': userSession.uuid
                    };
                    req.headers.username = userSession.username;
                    req.headers.password = encryptionService.decrypt(userSession.password);
                    userSession.lastHit = (new Date()).getTime();
                    var isEqual = _.isEqual(userSession, dumpUserSession);
                    if (!isEqual) {
                        data.save(userSession, {
                            method: 'update',
                            patch: true,
                            require: false
                        }).then(function (result) {
                            handleRequest(req, res, next);
                        }).catch(function (err) {
                            logger.error("Error occurred in authenticatUserSession while updating data", err)
                            if (err.message == "No Rows Updated") {
                                handleRequest(req, res, next)
                            } else {
                                return res.status(403).send();
                            }
                        })
                    } else {
                        handleRequest(req, res, next);
                    }
                } else {
                    userSession.active = 0;
                    data.save(userSession, {
                        method: 'update',
                        patch: true,
                        require: false
                    }).then(function (result) {
                        return res.status(403).send();
                    }).catch(function (err) {
                        logger.error("Error occurred in authenticatUserSession while updating data when deactivation userSession", err)
                        return res.status(403).send();
                    })
                }
            } else {
                return res.status(403).send();
            }
        }).catch(function (err) {
            logger.error("Error occurred in authenticatUserSession while fetching data", err)
            return res.status(403).send();
        })
    }


    cb();
};