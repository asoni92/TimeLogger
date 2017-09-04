var express = require( 'express' );
var loader  = require( 'express-load' );

// Create the main express app
var app = module.exports = express();

// Boot the app (see boot.js), then use the very
// cool express-load utility to suck in all of the
// modules located under lib, models, collections, etc.
// and finally, start the server!
require( './boot' )( app, function() {
    loader( 'lib' )
	.then( 'models' )
	.then( 'collections' )
	.then( 'controllers' )
	.then( 'routes' )
	.into( app );
    app.listen( app.get( 'port' ), function() {
	console.log('web server listening on port ' + app.get('port'));
    });
});
