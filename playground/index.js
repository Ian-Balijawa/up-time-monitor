/**
 * Primary File for the API
 */
// Dependencies
var http = require('http');
var url = require('url');
var { StringDecoder } = require('string_decoder');

// The server should respond to all requests with a string
var server = http.createServer(function (req, res) {
	// Get the url and then parse it
	var parsedUrl = url.parse(req.url, true);

	// Get the path
	var path = parsedUrl.pathname;
	var trimmedPath = path.replace(/^\/+|\/+$/g, '');

	// Get the query string as an object
	var queryStringObject = parsedUrl.query;

	// Get the HTTP method
	var method = req.method;
	// Get the req headers as an object
	var headers = req.headers;

	// Get the payload, is any
	var decoder = new StringDecoder('utf-8');
	var buffer = '';

	req.on('data', function (data) {
		buffer += decoder.write(data);
	});
	req.on('end', function () {
		buffer += decoder.end();

		// choose the handler that this request should go to. If one is not found, use the not found handler
		var choosenHandler =
			typeof router[trimmedPath] !== 'undefined'
				? router[trimmedPath]
				: handlers.notFound;

		// construct the data object to send to the handler
		var data = {
			trimmedPath,
			queryStringObject,
			method,
			headers,
			payload: buffer,
		};

		// route the request to the handler specified in the router
		choosenHandler(data, function (statuscode, payload) {
			// use the status code called back by the handler or default to 200
			statuscode = typeof statuscode === 'number' ? statuscode : 200;

			// use the payload called back by the handler or default to an empty object
			payload = typeof payload === 'object' ? payload : {};

			// covert the payload to a string
			var payloadString = JSON.stringify(payload);

			// return the response
			res.writeHead(statuscode);
			res.end(payloadString);

			// Log the response
			console.log('Returning this response:', statuscode, payloadString);
		});
	});
});
// Start the server and have it listen on port 3000
server.listen(3000, function () {
	console.log('The server is listening on port 3000');
});

// defining handlers
var handlers = {};

// sample handler
handlers.sample = function (data, callback) {
	// callbacka http statuscode and a payload object
	callback(406, { name: 'sample handler' });
};

// not found handler
handlers.notFound = function (data, callback) {
	callback(404);
};
// we are defining a request router

var router = {
	sample: handlers.sample,
};
