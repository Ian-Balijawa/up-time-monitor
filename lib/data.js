/**
 * Library for storing and editing data
 */

// Dependencies
var fs = require('fs');
var path = require('path');
var helpers = require('./helpers');

// Container for the module (to be exported)
var lib = {};

// Base directory of the folder
lib.baseDir = path.join(__dirname, '/../.data/');

// write the data to a file
lib.create = function (dir, file, data, callback) {
	// Open the file for writing
	fs.open(
		lib.baseDir + dir + '/' + file + '.json',
		'wx',
		function (err, fileDescriptor) {
			if (!err && fileDescriptor) {
				// Convert data to a string
				var stringData = JSON.stringify(data);

				// Write to a File and close it
				fs.writeFile(fileDescriptor, stringData, function (err) {
					if (!err) {
						fs.close(fileDescriptor, function (er) {
							if (!err) {
								callback(false);
							} else {
								callback('Error closing new file');
							}
						});
					} else {
						callback('Error writing to new file');
					}
				});
			} else {
				callback('Could not create new file, it may already exist');
			}
		}
	);
};

// Read data from a file
lib.read = function (dir, file, callback) {
	fs.readFile(
		lib.baseDir + dir + '/' + file + '.json',
		'utf-8',
		function (err, data) {
			if (!err && data) {
				var parsedData = helpers.parseJSONToObject(data);
				callback(false, parsedData);
			} else {
				callback(err, data);
			}
		}
	);
};

// Update data inside a file
lib.update = function (dir, file, data, callback) {
	// Open the file for writing
	fs.open(
		lib.baseDir + dir + '/' + file + '.json',
		'r+',
		function (err, fileDescriptor) {
			if (!err && fileDescriptor) {
				// Convert the data to a string
				var stringData = JSON.stringify(data);

				// Truncate the contents of the file before you write anything to it
				fs.ftruncate(fileDescriptor, function (err) {
					if (!err) {
						// Write to the file and close
						fs.writeFile(fileDescriptor, stringData, function (err) {
							if (!err) {
								fs.close(fileDescriptor, function (err) {
									if (!err) {
										callback(false);
									} else {
										callback('Error closing file');
									}
								});
							} else {
								callback('Error writing to existing file');
							}
						});
					} else {
						callback('Error trucating the file');
					}
				});
			} else {
				callback('Could not open the file for updating, it may not exist yet');
			}
		}
	);
};

// DELete a file
lib.delete = function (dir, file, callback) {
	// Unlink the file
	fs.unlink(lib.baseDir + dir + '/' + file + '.json', function (err) {
		if (!err) {
			callback(false);
		} else {
			callback('Error deleting the file');
		}
	});
};

// Export the module
module.exports = lib;
