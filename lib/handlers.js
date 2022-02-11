/**
 * Request handlers
 *
 */

// Dependencies
var _data = require('./data');
var helpers = require('./helpers');
// Define the handlers
var handlers = {};

// users
handlers.users = function (data, callback) {
	var acceptableMethods = ['POST', 'GET', 'PUT', 'DELETE'];
	if (acceptableMethods.includes(data.method)) {
		handlers._users[data.method](data, callback);
	} else {
		// method not allowed
		callback(405);
	}
};

// Container for the users submethods
handlers._users = {};

// Users -> POST
// REquired data: firstName, lastName, phone, password, tosAgreement
// optional data: none
handlers._users.POST = function (data, callback) {
	// Check that all required fields are filled out
	var firstName =
		typeof data.payload.firstName === 'string' &&
		data.payload.firstName.trim().length > 0
			? data.payload.firstName.trim()
			: false;
	var lastName =
		typeof data.payload.lastName === 'string' &&
		data.payload.lastName.trim().length > 0
			? data.payload.lastName.trim()
			: false;
	var phone =
		typeof data.payload.phone === 'string' &&
		data.payload.phone.trim().length === 10
			? data.payload.phone.trim()
			: false;
	var password =
		typeof data.payload.password === 'string' &&
		data.payload.password.trim().length > 0
			? data.payload.password.trim()
			: false;
	var tosAgreement =
		typeof data.payload.tosAgreement === 'boolean' &&
		data.payload.tosAgreement === true
			? data.payload.tosAgreement
			: false;

	if (firstName && lastName && phone && tosAgreement && password) {
		// Make sure that the  user doesnot already exist
		_data.read('users', phone, function (err, data) {
			if (err) {
				// Hash the password
				var hashedPassword = helpers.hash(password);

				if (hashedPassword) {
					// create the user object
					var userObject = {
						firstName,
						lastName,
						hashedPassword,
						phone,
						tosAgreement,
					};

					// store the user
					_data.create('users', phone, userObject, function (err) {
						if (!err) {
							callback(200);
						} else {
							console.log(err);
							callback(500, { Error: 'Could not create the new user' });
						}
					});
				} else {
					callback(500, {
						Error: 'Could not create the new user',
					});
				}
			} else {
				callback(400, {
					Error: 'A user with that phone number already exists',
				});
			}
		});
	} else {
		callback(400, { Error: 'Missing required fields' });
	}
};

/**
 *  Users -> GET
 *  REquired data -> phone
 * @TODO Only let authenticated users access their object
 * @param {*} data
 * @param {*} callback
 */
handlers._users.GET = function (data, callback) {
	var phone =
		typeof data.queryStringObject.phone === 'string' &&
		data.queryStringObject.phone.trim().length === 10
			? data.queryStringObject.phone
			: false;
	if (phone) {
		// Lookup the user
		_data.read('users', phone, function (err, data) {
			if (!err && data) {
				// remove the hashed password from the user object before returning it to the client
				delete data.hashedPassword;
				callback(200, data);
			} else {
				callback(404);
			}
		});
	} else {
		callback(400, { Error: 'Missing required fields' });
	}
};

/**
 * Users -> PUT
 * @TODO Only let authenticated users update their object
 * @param {*} data
 * @required phone
 * @optional firstName, lastName, password, tosAgreement
 * @param {*} callback
 */
handlers._users.PUT = function (data, callback) {
	// Check the required fields
	var phone =
		typeof data.payload.phone === 'string' &&
		data.payload.phone.trim().length === 10
			? data.payload.phone
			: false;
	var firstName =
		typeof data.payload.firstName === 'string' &&
		data.payload.firstName.trim().length > 0
			? data.payload.firstName.trim()
			: false;
	var lastName =
		typeof data.payload.lastName === 'string' &&
		data.payload.lastName.trim().length > 0
			? data.payload.lastName.trim()
			: false;
	var password =
		typeof data.payload.password === 'string' &&
		data.payload.password.trim().length > 0
			? data.payload.password.trim()
			: false;

	// Error if phone is valid
	if (phone) {
		// Error if missing field to update
		if (firstName || lastName || password) {
			// look up the user
			_data.read('users', phone, function (err, userData) {
				if (!err && userData) {
					// update the necessary fields if neccessary
					if (firstName) {
						userData.firstName = firstName;
					}
					if (lastName) {
						userData.lastName = lastName;
					}
					if (password) {
						userData.hasedPassword = helpers.hash(password);
					}

					// _store the updates to disk
					_data.update('users', phone, userData, function (err) {
						if (!err) {
							callback(200);
						} else {
							console.log(err);
							callback(500, { Error: 'Could not update the user' });
						}
					});
				} else {
					callback(400, { Error: 'The specified user doesnot exist' });
				}
			});
		}
	} else {
		callback(400, { Error: 'Missing required field' });
	}
};

// Users -> delete
handlers._users.DELETE = function (data, callback) {};

// Define a ping handler
handlers.ping = function (data, callback) {
	callback(200);
};
// not Found handler
handlers.notFound = function (data, callback) {
	callback(404);
};

// Export the handlers
module.exports = handlers;
