/**
 * create and export conifigurations variables
 */

// container for all the environments

var environments = {};

// staging environments
environments.staging = {
	httpPort: 3000,
	httpsPort: 3001,
	port: 3000,
	envName: 'staging',
};

// production environments
environments.production = {
	httpPort: 3000,
	httpsPort: 3001,
	port: 5000,
	envName: 'production',
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
