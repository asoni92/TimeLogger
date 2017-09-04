var path = require('path');;
var cmd = require('node-cmd');
var appDir = path.dirname(require.main.filename);
appDir = appDir.substring(0, appDir.lastIndexOf('/'));
var revisionNumber = null;
var revisionData = [];
module.exports = {
		getSVNRevisionNumber : function() {
			cmd.get(
					'svn info '+appDir,
					function(err, data, stderr) {
						if(data) {
							var lines = data.split(/\r?\n/);
								for(var rowNum in lines) {
									var line = lines[rowNum];
									if(line.startsWith('Revision')) {
					        		 	revisionNumber = line.substring(9).trim();
					        		 }
								}
					    }
						return revisionNumber;
					}
			);
		},
		setSVNRevisionData : function() {
			cmd.get(
					'svn info '+appDir,
					function(err, data, stderr) {
						if(data) {
							var lines = data.split(/\r?\n/);
							for(var rowNum in lines) {
								var line = lines[rowNum];
								if(line != null && line != '') {
									revisionData.push(line)
				        		}
							}
							return revisionData;
					    }
					}
			);
		},
		getSVNRevisionData : function() {
			cmd.get(
					'svn info '+appDir,
					function(err, data, stderr) {
						if(data) {
							var lines = data.split(/\r?\n/);
							for(var rowNum in lines) {
								var line = lines[rowNum];
								if(line != null && line != '') {
									revisionData.push(line)
				        		}
							}
							return revisionData;
					    }
					}
			);
		}
}
