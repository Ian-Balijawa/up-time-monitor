/**
 * Helpers for various tasks
 *
 */
// Dependencies
var crypto = require('crypto');
var config = require('./config');

// Container for the helpers
var helpers = {};

// Create a SHA256 hash
helpers.hash = function (str) {
	if (typeof str === 'string' && str.length > 0) {
		var hash = crypto
			.createHmac('sha256', config.hashingSecret)
			.update(str)
			.digest('hex');
		return hash;
	} else {
		return false;
	}
};

// Parse a JSOn string to an object in cases, without throwing
helpers.parseJSONToObject = function (str) {
	try {
		var object = JSON.parse(str);
		return object;
	} catch (err) {
		return {};
	}
};

// Export the module
module.exports = helpers;
