var connection = require('./db.js');
var config = require('./config.json');
var path = require('path');
var _ = require('underscore');
var cmd=require('node-cmd');
var appDir = path.dirname(require.main.filename);
var sqlFile =  appDir + '/scripts/db.sql';

function createSQLImportCommand() {
	var command = "MYSQL_PWD=\'"+config.connConfig.connection.password+"\' mysql -h ";
	command = command + config.connConfig.connection.host + ' -u ' + config.connConfig.connection.user + ' ' + config.connConfig.connection.db + ' < '+ sqlFile  
	return command;
}

cmd.get(
    createSQLImportCommand(),
    function(err, data, stderr){
    	 if (!err) {
           console.log('------------------------------Database Updated Successfully.------------------------------')
        } else {
           console.log('------------------------------Error Occured While Updating Database.------------------------------', err);
        }
    }
);
