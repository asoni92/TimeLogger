var Bookshelf = require('bookshelf').DB;
var Deferred  = require("promised-io/promise").Deferred;
var async     = require( 'async' );

var BaseModel = require( '../models/BaseModel' )();

var UserSession = BaseModel.extend({
    tableName: 'user_session',

    format: function( attrs ) {
		if ( attrs.data )
	    	attrs.data = JSON.stringify( attrs.data );
		return attrs;
    },
    parse: function( attrs ) {
		if ( attrs.data )
	    	attrs.data = JSON.parse( attrs.data );
		return attrs;
    },

});

module.exports = function( app ) {
    return Bookshelf.model( 'UserSession', UserSession );
};
