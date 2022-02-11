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

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJSONToObject = function (str) {
	try {
		var object = JSON.parse(str);
		return object;
	} catch (err) {
		return {};
	}
};

// create a string of random alphanumeric characters of a given length
helpers.createRandomString = function(strLength) {
	strLength = typeof(strLength) === 'number' && strLength > 0 ? strLength : false;

	if(strLength) {
		// Define all the possible characters that could go into a string
		var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

		// start the final string
		var str = '';
		for (var i = 0; i < strLength; i++) {
			// get a random character from the possible characters string

			var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
			// Append this character to the string
			str += randomCharacter;
		}

		return str;	

	}else {
		return false;
	}	

}

// Export the module
module.exports = helpers;
