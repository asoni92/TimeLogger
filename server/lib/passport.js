var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    DelegateStrategy = require('passport-local').Strategy,
    FacebookStrategy = require('passport-facebook').Strategy,
    BasicStrategy = require('passport-http').BasicStrategy;

var schema = require("bookshelf").DB;

module.exports = function (app) {
    passport.serializeUser(function (user, done) {
        done(null, user);
    });

    passport.deserializeUser(function (user, done) {
		// schema.model('User').forge({ id: id }).fetch({ withRelated: ['roles'] }).then(
		// 		function (user) {
		// 			done(null, user);
		// 		},
		// 		function (err) {
		// 			app.log.error("err");
		// 			done(err, null);
		// 		}
		// 	);
        done(null, user)
    });

    passport.use("local", new LocalStrategy(
		{ usernameField: 'email', passwordField: 'password' },
		function (email, password, done) {
            // schema.model('User').forge()
			// 	.query(function (q) {
			// 		q.whereRaw('LOWER(email) = "' + email.toLowerCase() + '"');
			// 	})
			// 	.fetch().then(
			// 	function (user) {
			// 		if (!user) {
			// 			done(null, false, { message: app.__('User not found') });
			// 		}
			// 		else {
			// 			user.verify_password(password).then(
			// 				function () {
			// 					done(null, user);
			// 				},
			// 				function (err) {
			// 					done(null, false, { message: app.__(err.message) });
			// 				}
			// 			);
			// 		}
			// 	},
			// 	function (err) {
			// 		done(err, false);
			// 	}
			// 	);
            
            if(email=="mayank" && password=="mayank"){
               done(null,  {"email":"mayank","password":"mayank"}); 
            }else{
              done(null, false, { message: app.__('User not found') });  
            }
		}
    ));

  

};
