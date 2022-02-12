/**
 * Request handlers
 *
 */

// Dependencies
var config = require('./config');
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

	console.log(phone);
	if (phone) {
		// Get the token from the headers
		var token =
			typeof data.headers.token === 'string' ? data.headers.token : false;
		// Verify that the given token from the headers is valid for the phone number
		handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
			if (tokenIsValid) {
				//Lookup the user with phone
				_data.read('users', phone, function (err, userData) {
					if (!err && userData) {
						_data.delete('users', phone, function (err) {
							if (!err) {
								// callback(200);
								// Delete each of the checks associated with the user
								var userChecks =
									typeof userData.checks === 'object' &&
									userData.checks instanceof Array
										? userData.checks
										: [];

								var checksToDelete = userData.length;
								if (checksToDelete > 0) {
									var checksDeleted = 0;
									var deletionErrors = false;

									// Loop through the checks
									userChecks.forEach(function (checkId) {
										//Delete the check
										_data.delete('checks', checkId, function (err) {
											if (err) {
												deletionErrors = true;
											}
											checksDeleted++;
											if (checksDeleted === checksToDelete) {
												if (!deletionErrors) {
													callback(200);
												} else {
													callback(500, {
														Error:
															'Errors encountered while trying to delete use checks',
													});
												}
											}
										});
									});
								} else {
									callback(200);
								}
							} else {
								callback(500, { Error: 'Could not delete the specified user' });
							}
						});
					} else {
						callback(404, { Error: 'Could not find the specified user' });
					}
				});
			} else {
				callback(403, { Error: 'Missing or invalid token in header' });
			}
		});
	} else {
		console.log(phone);
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

// checks
handlers.checks = function (data, callback) {
	var acceptableMethods = ['POST', 'GET', 'PUT', 'DELETE'];
	if (acceptableMethods.includes(data.method)) {
		handlers._checks[data.method](data, callback);
	} else {
		// method not allowed
		callback(405);
	}
};

// Container for all the checks methods
handlers._checks = {};

// Checks -> POST
/**
 * Required Data <- method , protocol, url, successCodes, timeoutSeconds
 * Optional data <- none
 * @param {*} data
 * @param {*} callback
 */
handlers._checks.POST = function (data, callback) {
	// Validate all the entrant inputs
	var protocol =
		typeof data.payload.protocol === 'string' &&
		['https', 'http'].includes(data.payload.protocol)
			? data.payload.protocol
			: false;
	var url =
		typeof data.payload.url === 'string' && data.payload.url.trim().length > 0
			? data.payload.url
			: false;
	var successCodes =
		typeof data.payload.successCodes === 'object' &&
		data.payload.successCodes instanceof Array &&
		data.payload.successCodes.length > 0
			? data.payload.successCodes
			: false;
	var method =
		typeof data.payload.method === 'string' &&
		['POST', 'GET', 'PUT', 'DELETE'].includes(data.payload.method)
			? data.payload.method
			: false;
	var timeoutSeconds =
		typeof data.payload.timeoutSeconds === 'number' &&
		data.payload.timeoutSeconds % 1 === 0 &&
		data.payload.timeoutSeconds >= 1 &&
		data.payload.timeoutSeconds <= 5
			? data.payload.timeoutSeconds
			: false;

	if (protocol && url && successCodes && timeoutSeconds && method) {
		// Get the token from the request headers
		var token =
			typeof data.headers.token === 'string' ? data.headers.token : false;

		// Lookup the user by reading the token
		_data.read('tokens', token, function (err, tokenData) {
			if (!err && tokenData) {
				var userPhone = tokenData.phone;

				// lookup the user data using this phone
				_data.read('users', userPhone, function (err, userData) {
					if (!err && userData) {
						var userChecks =
							typeof userData.checks === 'object' &&
							userData.checks instanceof Array
								? userData.checks
								: [];
						// verify that the user has less than the number of max-checks-per-user
						if (userChecks.length < config.maxChecks) {
							// create a random id for the check
							var checkId = helpers.createRandomString(20);

							// create the check object, and include the user's phone
							var checkObject = {
								id: checkId,
								userPhone,
								protocol,
								method,
								successCodes,
								url,
								timeoutSeconds,
							};

							// Save the new object to disk
							_data.create('checks', checkId, checkObject, function (err) {
								if (!err) {
									// Add the check id to the user's object
									userData.checks = userChecks;
									userData.checks.push(checkId);

									// Save the new user data
									_data.update('users', userPhone, userData, function (err) {
										if (!err) {
											// Return  the data about the new check to the requester
											callback(200, checkObject);
										} else {
											callback(500, {
												Error: 'Couldnot update the user the new check',
											});
										}
									});
								} else {
									callback(500, { Error: 'Could Not create the new check' });
								}
							});
						} else {
							callback(400, {
								Error:
									'The user already has the maximum number of checks (' +
									config.maxChecks +
									')',
							});
						}
					} else {
						callback(403, { Error: 'Invalid token. No user with that token' });
					}
				});
			} else {
				callback(403, { Error: 'Missing token or invalid token' });
			}
		});
	} else {
		console.log(method, url, protocol, successCodes, timeoutSeconds);
		callback(400, { Error: 'missing required inputs or inputs are invalid' });
	}
};

// checks -> GET
/**
 * REquired data: id
 * Optional Data : none
 * @param {*} data
 * @param {*} callback
 */
handlers._checks.GET = function (data, callback) {
	var id =
		typeof data.queryStringObject.id === 'string' &&
		data.queryStringObject.id.trim().length === 20
			? data.queryStringObject.id
			: false;
	if (id) {
		// Lookup the check
		_data.read('checks', id, function (err, checkData) {
			if (!err && checkData) {
				// Get the token from the headers
				var token =
					typeof data.headers.token === 'string' ? data.headers.token : false;
				// Verify that the given token from the headers is valid and belongs to the user who created the check
				handlers._tokens.verifyToken(
					token,
					checkData.userPhone,
					function (tokenIsValid) {
						if (tokenIsValid) {
							// return the check Data
							callback(200, checkData);
						} else {
							callback(403, { Error: 'Missing or invalid token in header' });
						}
					}
				);
			} else {
				callback(404);
			}
		});
	} else {
		callback(400, { Error: 'Missing required fields' });
	}
};

// checks -> PUT
/**
 * REquired data: id
 * Optional Data : protocol, url, method, successCodes, timeoutseconds (one must be sent)
 * @param {*} data
 * @param {*} callback
 */
handlers._checks.PUT = function (data, callback) {
	// Check the required fields
	var id =
		typeof data.payload.id === 'string' && data.payload.id.trim().length === 20
			? data.payload.id
			: false;
	var protocol =
		typeof data.payload.protocol === 'string' &&
		['https', 'http'].includes(data.payload.protocol)
			? data.payload.protocol
			: false;
	var url =
		typeof data.payload.url === 'string' && data.payload.url.trim().length > 0
			? data.payload.url
			: false;
	var successCodes =
		typeof data.payload.successCodes === 'object' &&
		data.payload.successCodes instanceof Array &&
		data.payload.successCodes.length > 0
			? data.payload.successCodes
			: false;
	var method =
		typeof data.payload.method === 'string' &&
		['POST', 'GET', 'PUT', 'DELETE'].includes(data.payload.method)
			? data.payload.method
			: false;
	var timeoutSeconds =
		typeof data.payload.timeoutSeconds === 'number' &&
		data.payload.timeoutSeconds % 1 === 0 &&
		data.payload.timeoutSeconds >= 1 &&
		data.payload.timeoutSeconds <= 5
			? data.payload.timeoutSeconds
			: false;

	if (id) {
		// check to make sure one or more optional fields has been sent
		if (protocol || url || method || successCodes || timeoutSeconds) {
			// Lookup the check
			_data.read('checks', id, function (err, checkData) {
				if (!err && checkData) {
					// Get the token from the headers
					var token =
						typeof data.headers.token === 'string' ? data.headers.token : false;
					// Verify that the given token from the headers is valid and belongs to the user who created the check
					handlers._tokens.verifyToken(
						token,
						checkData.userPhone,
						function (tokenIsValid) {
							if (tokenIsValid) {
								// update the check whre neccessary
								if (protocol) {
									checkData.protocol = protocol;
								}
								if (method) {
									checkData.method = method;
								}
								if (successCodes) {
									checkData.successCodes = successCodes;
								}
								if (url) {
									checkData.url = url;
								}
								if (timeoutSeconds) {
									checkData.timeoutSeconds = timeoutSeconds;
								}

								// store the updates
								_data.update('checks', id, checkData, function (err) {
									if (!err) {
										callback(200);
									} else {
										callback(500, { Error: 'Could not update the check' });
									}
								});
							} else {
								callback(403, { Error: 'Missing or invalid token in header' });
							}
						}
					);
				} else {
					callback(400, { Error: 'Check id did not exist' });
				}
			});
		} else {
			callback(400, { Error: 'Missing fields to update' });
		}
	} else {
		callback(400, { Error: 'Missing required field(s)' });
	}
};

/**
 * Checks -> delete
 * Required data -> id
 * Optional -> none
 * @param {*} data
 * @param {*} callback
 */
handlers._checks.DELETE = function (data, callback) {
	// Check that the id is valid
	var id =
		typeof data.queryStringObject.id === 'string' &&
		data.queryStringObject.id.trim().length === 20
			? data.queryStringObject.id
			: false;
	if (id) {
		// Lookup the check to delete
		_data.read('checks', id, function (err, checkData) {
			if (!err && checkData) {
				// Get the token from the headers
				var token =
					typeof data.headers.token === 'string' ? data.headers.token : false;
				// Verify that the given token from the headers is valid for the id number
				handlers._tokens.verifyToken(
					token,
					checkData.userPhone,
					function (tokenIsValid) {
						if (tokenIsValid) {
							// Delete the check data
							_data.delete('checks', id, function (err) {
								if (!err) {
									//Lookup the user with id
									_data.read(
										'users',
										checkData.userPhone,
										function (err, userData) {
											if (!err && userData) {
												var userChecks =
													typeof userData.checks === 'object' &&
													userData.checks instanceof Array
														? userData.checks
														: [];
												// Remove the deleted check from their list of checks
												var checkPosition = userChecks.indexOf(id);
												if (checkPosition > -1) {
													userChecks.splice(checkPosition, 1);
													// re-save the users data
													_data.update(
														'users',
														checkData.phone,
														userData,
														function (err) {
															if (!err) {
																callback(200);
															} else {
																console.log(err);
																callback(500, {
																	Error:
																		'Could not update the user who owned that check',
																});
															}
														}
													);
												} else {
													callback(500, {
														Error:
															"could not find the check on the user's object, so could not remove it",
													});
												}
											} else {
												callback(500, {
													Error:
														'Could not find the specified user who created the check, so could not remve the check from the list of checks on the user object',
												});
											}
										}
									);
								} else {
									callback(500, { Error: 'Could not delete the check data' });
								}
							});
						} else {
							callback(403, { Error: 'Missing or invalid token in header' });
						}
					}
				);
			} else {
				console.log(err);

				callback(400, { Error: 'The specified check doesnot exist' });
			}
		});
	} else {
		callback(400, { Error: 'Missing Required fields' });
	}
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
