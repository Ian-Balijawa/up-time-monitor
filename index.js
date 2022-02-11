/**
 * Primary file for the API
 *
 */

// Dependecies

var http = require('http');
var https = require('https');
var url = require('url');
var { StringDecoder } = require('string_decoder');
var config = require('./config');
var fs = require('fs');
var _data = require('./lib/data');

/**
 * TESTINg
 * @TODO delete this
 *
 */
_data.delete('test', 'newFile', function (err) {
	console.log('This was the error: ', err);
});

//the server should respond to all requests with a string
var httpServer = http.createServer(function (req, res) {
	unifiedServer(req, res);
});

// Instantiating the HTTP server
httpServer.listen(config.httpPort, function () {
	console.log(`The http server is now listening on port: ${config.httpPort} `);
});

var httpsSeverOptions = {
	key: fs.readFileSync('./https/key.pem'),
	cert: fs.readFileSync('./https/cert.pem'),
};
// create the HTTPS server
var httpsServer = https.createServer(httpsSeverOptions, function (req, res) {
	unifiedServer(req, res);
});

// Instantiating the HTTPS server
httpsServer.listen(config.httpsPort, function () {
	console.log(
		`The https server is now listening on port: ${config.httpsPort} `
	);
});

// Unified server.  All the server logic for both http and https server
var unifiedServer = function (req, res) {
	// Get the url and parse it
	var parsedUrl = url.parse(req.url, true);
	// Get the path from that url
	var path = parsedUrl.pathname;
	var trimmedPath = path.replace(/^\/+|\/+$/g, '');

	// Get the query string as an object
	var queryStringObject = parsedUrl.query;

	// get the http method
	var method = req.method;

	// Get the HTTP headers
	var headers = req.headers;

	// Get the payload as an object
	// This payload comes in as a stream
	var decoder = new StringDecoder('utf-8');
	var buffer = '';
	req.on('data', function (data) {
		buffer += decoder.write(data);
	});
	req.on('end', function () {
		buffer += decoder.end();

		// choose the handler this request should go to. If one is not found, use the not found handler
		var choosenHandler =
			typeof router[trimmedPath] !== 'undefined'
				? router[trimmedPath]
				: handlers.notFound;

		// Now we construct the data object to send to the handler
		var data = {
			trimmedPath,
			queryStringObject,
			method,
			headers,
			payload: buffer,
		};

		// Router the reqeust to the handler specified in the router
		choosenHandler(data, function (statuscode, payload) {
			// Use the statuscode called back by the handler or default to 200
			statuscode = typeof statuscode === 'number' ? statuscode : 200;

			// use the payload callback by the hanndler or default to an empty object {}
			payload = typeof payload === 'object' ? payload : {};

			// convert the payload into a string
			var payloadString = JSON.stringify(payload);

			// Return the response
			res.setHeader('Content-Type', 'application/json');
			res.writeHead(statuscode);
			res.end(payloadString);

			// Log the response payload string
			console.log('Returning this response: ', statuscode, payloadString);
		});
	});
};
// Define the handlers
var handlers = {};

// Define a ping handler
handlers.ping = function (data, callback) {
	callback(200);
};
// not Found handler
handlers.notFound = function (data, callback) {
	callback(404);
};

// Define a request router
var router = {
	ping: handlers.ping,
};
