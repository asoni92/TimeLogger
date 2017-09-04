//module.exports = function(app, cb) {
//var debug = require('debug')('app4')
//
//var express = require('express');
//var path = require('path');
//var favicon = require('serve-favicon');
//var logger = require('morgan');
//var cookieParser = require('cookie-parser');
//var bodyParser = require('body-parser');
//var passport = require('passport');
//var session = require('express-session')
//var config = require('./scripts/config.json')
//
//
////var app = express();
//
//// view engine setup
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');
//
//// uncomment after placing your favicon in /public
////app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//app.use(logger('dev'));
//// CORS
//    app.use(function(req, res, next) {
//        res.header('Access-Control-Allow-Origin', req.headers.origin);
//        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
//        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Final-Length, Offset, Content-Range, Content-Disposition');
//        res.header('Access-Control-Allow-Credentials', 'true');
//        if (req.method == 'OPTIONS') {
//            res.send(200);
//        } else {
//            next();
//        }
//    });
//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: false }));
//app.use(cookieParser());
//app.use(express.static(path.join(__dirname, 'public')));
//app.use(session({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
//  //  app.use(function(req, res, next) {
//  //       app.__ = res.__;
//  //       next();
//  //   });
//app.use(passport.initialize());
//app.use(passport.session());
//
//// bring in Bookshelf!
//var knex = require('knex')(config.connConfig);
////var Bookshelf = require('bookshelf')( knex );
//// Bookshelf.DB = Bookshelf.initialize( config.bookshelf );
//var bookshelf = require('bookshelf')(knex);
//var Bookshelf = require('bookshelf');
//Bookshelf.DB = bookshelf;
//app.set('schema', bookshelf);
//var index = require('./routes/index')(app);
//var users = require('./routes/users')(app);
//var calendarApi = require('./routes/CalendarApi')(app);
//app.use('/', index);
//app.use('/auth', users);
//app.use('/cal', calendarApi);
//
//// catch 404 and forward to error handler
//app.use(function (req, res, next) {
//  var err = new Error('Not Found');
//  err.status = 404;
//  next(err);
//});
//
//// error handler
//app.use(function (err, req, res, next) {
//  // set locals, only providing error in development
//  res.locals.message = err.message;
//  res.locals.error = req.app.get('env') === 'development' ? err : {};
//
//  // render the error page
//  res.status(err.status || 500);
//  res.render('error');
//});
//
//app.set('port', process.env.PORT || 3000)
//
//var server = app.listen(app.get('port'), function () {
//  debug('Express server listening on port ' + server.address().port)
//})
//cb();
//}