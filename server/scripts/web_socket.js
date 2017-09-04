"use strict";
var webSocketsServerPort = 1337;
var webSocketServer = require('websocket').server;
var http = require('http');
var clients = [];
var wsServer  = null;
module.exports = {
	startWebSocketServer : function() {
		var server = http.createServer(function(request, response) {

		});
		server.listen(webSocketsServerPort, function() {
			console.log((new Date()) + " Server is listening on port "
					+ webSocketsServerPort);
		});
		/**
		 * WebSocket server
		 */
		var wsServer = new webSocketServer({
			httpServer : server
		});

		wsServer.on('request', function(request) {
			console.log(' Connection from origin ' + request.origin + '.');
			var connection = request.accept(null, request.origin);
			clients.push(connection)
			
			//Connection need to be handled on the basis of logged in user of MMA. Like username
			connection.on('message', function(message) {
				if(message) {
					//Handle any client Message
				}
			});
			// user disconnected
			connection.on('close', function(connection) {
				console.log(connection.remoteAddress + " disconnected.");
				// Remove the connection from client.

			});
		})

	},
	sendMessage : function(data) {
		// Send data to only that client which is associted with the message. Need to find client connection from Clients Array
		connection.sendUTF(JSON.stringify({
			type : 'MessageType',
			data : 'MessageData'
		}));
	}
};
