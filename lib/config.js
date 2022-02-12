/**
 * create and export conifigurations variables
 */

// container for all the environments

var environments = {};

// staging environments
environments.staging = {
	httpPort: 5000,
	httpsPort: 5001,
	port: 5000,
	envName: 'staging',
	hashingSecret: 'secure123456',
	maxChecks: 5,
	twilio: {
		accountSid: 'ACb32d411ad7fe886aac54665d25e5c5d',
		authToken: '9455eb3109edc12e3d8c92768f7a67',
		fromPhone: '+15005550006',
	},
};

// production environments
environments.production = {
	httpPort: 8000,
	httpsPort: 8001,
	port: 8000,
	envName: 'production',
	hashingSecret: 'secure123456',
	maxChecks: 5,
	twilio: {
		accountSid: 'ACb32d411ad7fe886aac54665d25e5c5d',
		authToken: '9455eb3109edc12e3d8c92768f7a67',
		fromPhone: '+15005550006',
	},
};

// determine which should be exported based on an environment variable

var currentEnvironment =
	typeof process.env.NODE_ENV === 'string'
		? process.env.NODE_ENV.toLowerCase()
		: '';

// check that the current Environment is one ogf the envirnoments above, if not default to staging
var envirnomentToExport =
	typeof environments[currentEnvironment] === 'object'
		? environments[currentEnvironment]
		: environments.staging;

module.exports = envirnomentToExport;
