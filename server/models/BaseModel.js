var Bookshelf = require('bookshelf').DB;
var Deferred  = require("promised-io/promise").Deferred;
var omapper = require( 'object-mapper' );

var BaseModel = Bookshelf.Model.extend({
    // By default, hide the 'id' field on toJSON() calls, so the
    // UI never sees them.  The UI will deal with UUIDs, not id.
    hidden: [ 'id' ],

    // We should use the same object factory on the server side as well, to access
    // data and methods consistently on both the server and the client.  So here we
    // use the "fetched" event to create JSON of the model and pass it trhough the
    // same object factory.  We'll save this object on our model.  The server-side
    // code would then look something like:
    //
    // schema.model( 'Bee' ).forge({ imei: imei }).fetch().then( function( bee ) {
    //   app.log.debug( "Name: ",    bee.obj.name() );
    //   app.log.debug( "Location:", bee.obj.location() );
    // }, cb );
    /* COMMENT OUT UNTIL READY FOR THIS
    initialize: function() {
        var self = this;
        self.on( 'fetched', function( model, resp, options ) {
            self.obj = ObjectFactory.create( model.toJSON() );
        });
    },
    */

    // Emulate DBIx find_or_create(), nice for developing testcases.
    // Usage:
    // schema.model( 'ModelClass' ).forge({ values }).find_or_create().then( function( obj ) {} );
    find_or_create: function() {
	var self = this;
	var dfd = new Deferred();
	self.fetch().then( function( obj ) {
	    if ( obj ) dfd.resolve( obj );
	    else {
		self.save().then( 
		    function( obj ) {
			dfd.resolve( obj );
		    },
		    function( err ) {
			dfd.reject( err );
		    }
		);
	    }
	}, function( err ) { dfd.reject( err ) } );
	return dfd.promise;
    },

    // This only works on one-to-many.  
    // Usage:
    // account.find_or_create_related( 'Role', 'account_id', { name: 'admin' } ).then( function( role ) {})
    find_or_create_related: function( Model, foreign_key, attrs ) {
	var self = this;
	attrs[foreign_key] = self.id;
	return Bookshelf.model( Model ).forge( attrs ).find_or_create();
    },

    // Transform Bookshelf objects (or the passed in JSON object) into another object
    // using node-object-mapper templates.
    //
    // If the 'template' param is a string, look it up in the object's templates hash.
    // If its an object, use that as the object-mapper template.
    //
    // If json is passed in, use that as the source object, else call toJSON() on this
    // object.
    //
    // var beeSummary = schema.model( 'Bee' ).forge().transform( 'summary', shipment.get( 'data' ).bee );
    // var beeSummary = shipment.related( 'bee' ).at(0).transform( 'summary' );
    //
    transform: function( template, json ) {
	var self = this;
	var t;
	if ( typeof template == 'object' ) t = template;
	else t = ( self.templates ? self.templates[ template ] : null );
	if ( ! t ) {
	    if ( json ) return json;
	    else return self.toJSON();
	}
	if ( json ) return omapper.merge( json, {}, t );
	else return omapper.merge( self.toJSON(), {}, t );
    },

});

module.exports = function( app ) {
    if ( ! Bookshelf.model( 'BaseModel' ) )
	return Bookshelf.model( 'BaseModel', BaseModel );
    else
	return Bookshelf.model( 'BaseModel' );
};
