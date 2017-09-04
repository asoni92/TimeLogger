var passport = require("passport");
var _ = require('lodash');
module.exports = function (app) {
    var middleware = {};

    // Used on routes that need authentication.  Usage:
    //
    //  var mw = app.lib.middleware;
    //  app.post( '/path', mw.authenticated, controller.func );
    //
    middleware.authenticated = function (req, res, next) {
		if (req.isAuthenticated()) { return next(); }
		var realm ='local';
		passport.authenticate('local', function (err, user, info) {
            if (err) return res.send(app.__('Authentication required'), 403);
			if (!user) return res.send(info.message, 403);
			req.logIn(user, function (err) {
				if (err) res.send(app.__('Authentication required'), 403);
				app.log.info(user);
                return next();
                
			});
		})(req, res, next);
    };

    // This is the middleware you can use on a route to require
    // certain roles to be associated with the user in order for
    // the user to be able to access the route.
    //
    // The route would be configured something like this:
    //
    //  app.post( '/path', mw.authenticated, app.acl(['super-admin']), controller.func );
    //
    // The user must be authenticated to have roles.  The argument to acl() is a list
    // of roles that the user must belong TO AT LEAST ONE in the list.  This means
    // the list should contain the minimum role required AND ANY OTHER roles higher
    // than the minimum that the user might have.  
    //
    app.acl = function (roles) {
		return function (req, res, next) {
			// PUSH super-admin onto this list, so that anyone with
			// super-admin can do anything regardless of the specified ACLs.
			req.user.has_one_role_in(_.union(roles, ['super-admin'])).then(function (indeed) {
				if (indeed) return next();
				else {
					app.log.error('ACL violation:', req.user.get('email'),
						req.path, 'protected by:', JSON.stringify(roles));
					return res.send(app.__('Not allowed under current ACL'), 405);
				}
			});
		}
    };

    return middleware;
};

