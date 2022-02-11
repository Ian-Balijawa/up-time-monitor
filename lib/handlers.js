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
		// Get the token from the headers
		var token =
			typeof data.headers.token === 'string' ? data.headers.token : false;
		// Verify that the given token from the headers is valid for the phone number
		handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
			if (tokenIsValid) {
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
				callback(403, { Error: 'Missing or invalid token in header' });
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
		// Get the token from the headers
		var token =
			typeof data.headers.token === 'string' ? data.headers.token : false;
		// Verify that the given token from the headers is valid for the phone number
		handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
			if (tokenIsValid) {
				// Lookup the user
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
				callback(403, { Error: 'Missing or invalid token in header' });
			}
		});
	} else {
		callback(400, { Error: 'Missing required field' });
	}
};

/**
 * Users -> delete
 * @required phone
 * @param {*} data
 * @param {*} callback
 */
handlers._users.DELETE = function (data, callback) {
	var phone =
		typeof data.queryStringObject.phone === 'string' &&
		data.queryStringObject.phone.trim().length === 10
			? data.queryStringObject.phone
			: false;
	if (phone) {
		// Get the token from the headers
		var token =
			typeof data.headers.token === 'string' ? data.headers.token : false;
		// Verify that the given token from the headers is valid for the phone number
		handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
			if (tokenIsValid) {
				//Lookup the user with phone
				_data.read('users', phone, function (err, data) {
					if (!err && data) {
						_data.delete('users', phone, function (err) {
							if (!err) {
								callback(200);
							} else {
								callback(500, { Error: 'Could not delete the specified user' });
							}
						});
					} else {
						callback(500, { Error: 'Could not find the specified user' });
					}
				});
			} else {
				callback(403, { Error: 'Missing or invalid token in header' });
			}
		});
	} else {
		callback(400, { Error: 'Missing Required fields' });
	}
};

// tokens
handlers.tokens = function (data, callback) {
	var acceptableMethods = ['POST', 'GET', 'PUT', 'DELETE'];
	if (acceptableMethods.includes(data.method)) {
		handlers._tokens[data.method](data, callback);
	} else {
		// method not allowed
		callback(405);
	}
};

// container for all the tokens
handlers._tokens = {};

/**
 * Tokens -> POST
 * Required data phone, password
 * Optional data -> none
 * @param {*} data
 * @param {*} callback
 */
handlers._tokens.POST = function (data, callback) {
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

	if (phone && password) {
		// Lookup the user who matches that phone number

		_data.read('users', phone, function (err, userData) {
			if (!err && userData) {
				// Hash the password and  compare it with the user password
				var hashedPassword = helpers.hash(password);
				if (hashedPassword) {
					if (hashedPassword === userData.hashedPassword) {
						// If valid, create a new token with a random name, set expireation date 1 hour in the future
						var tokenId = helpers.createRandomString(20);
						var expires = Date.now() + 1000 * 60 * 60;

						var tokenObject = {
							phone,
							id: tokenId,
							expires,
						};

						_data.create('tokens', tokenId, tokenObject, function (err) {
							if (!err) {
								callback(200, tokenObject);
							} else {
								callback(500, { Error: 'Could not create the token' });
							}
						});
					} else {
						callback(400, {
							Error: "password did not match the specified user's password",
						});
					}
				}
			} else {
				callback(404, { Error: 'Could not find the specified user' });
			}
		});
	} else {
		callback(400, { Error: 'Missing required fields' });
	}
};

// Tokens -> GET

/**
 * Tokens -> GET
 * Required data: id
 * Optional data -> none
 * @param {*} data
 * @param {*} callback
 */
handlers._tokens.GET = function (data, callback) {
	var id =
		typeof data.queryStringObject.id === 'string' &&
		data.queryStringObject.id.trim().length === 20
			? data.queryStringObject.id
			: false;

	if (id) {
		// Lookup the user
		_data.read('tokens', id, function (err, tokenData) {
			if (!err && tokenData) {
				callback(200, tokenData);
			} else {
				callback(404, { Error: 'Could not find the specified token' });
				console.log(err);
			}
		});
	} else {
		callback(400, { Error: 'Missing required fields' });
	}
};

// Tokens -> PUT
/**
 * Tokens -> GET
 * Required data: id, extend
 * Optional data <- none
 * @param {*} data
 * @param {*} callback
 */
handlers._tokens.PUT = function (data, callback) {
	var id =
		typeof data.payload.id === 'string' && data.payload.id.trim().length === 20
			? data.payload.id
			: false;

	var extend =
		typeof data.payload.extend === 'boolean' && data.payload.extend === true
			? data.payload.extend
			: false;

	if (id && extend) {
		// Lookup the token
		_data.read('tokens', id, function (err, tokenData) {
			if (!err && tokenData) {
				// check to make sure the token is not already expired

				if (tokenData.expires > Date.now()) {
					// Set the expiration date one hour into the future
					var newExpiration = Date.now() + 1000 * 60 * 60;
					tokenData.expires = newExpiration;

					// store the new token updates
					_data.update('tokens', id, tokenData, function (err) {
						if (!err) {
							callback(200);
						} else {
							callback(500, { Error: 'Could not extend the token expiration' });
						}
					});
				} else {
					callback(400, {
						Error: 'The token has already expired and cannot be extended',
					});
				}
			} else {
				callback(400, {
					Error: 'Invalid token. The specified token doesnot exist',
				});
			}
		});
	} else {
		callback(400, { Error: 'Missing requied fiel(s) or field(s) are invalid' });
	}
};

// Tokens -> DELETE
handlers._tokens.DELETE = function (data, callback) {
	var id =
		typeof data.queryStringObject.id === 'string' &&
		data.queryStringObject.id.trim().length === 20
			? data.queryStringObject.id
			: false;
	if (id) {
		//Lookup the user with id
		_data.read('tokens', id, function (err, tokenData) {
			if (!err && tokenData) {
				_data.delete('tokens', id, function (err) {
					if (!err) {
						callback(200);
					} else {
						callback(500, { Error: 'Could not delete the specified token' });
					}
				});
			} else {
				callback(500, { Error: 'Could not find the specified token' });
			}
		});
	}
};

// Verify if a given id is currently valid for a given user
handlers._tokens.verifyToken = function (id, phone, callback) {
	// look up the token
	_data.read('tokens', id, function (err, tokenData) {
		if (!err && tokenData) {
			// Check that the given token is for a given user
			if (tokenData.phone === phone && tokenData.expires > Date.now()) {
				callback(true);
			} else {
				callback(false);
			}
		} else {
			callback(false);
		}
	});
};

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
