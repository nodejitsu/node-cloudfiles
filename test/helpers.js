/*
 * helpers.js: Test helpers for node-cloudservers
 *
 * (C) 2010 Nodejitsu Inc.
 * MIT LICENSE
 *
 */

require.paths.unshift(require('path').join(__dirname, '..', 'lib'));
 
var util = require('util'),
    fs = require('fs'),
    path = require('path'),
    vows = require('vows'),
    assert = require('assert'),
    cloudfiles = require('cloudfiles');

var testConfig, client, helpers = exports;

helpers.loadConfig = function () {
  try {
    var configFile = path.join(__dirname, 'data', 'test-config.json'),
        stats = fs.statSync(configFile),
        config = JSON.parse(fs.readFileSync(configFile).toString());
    
    if (config.auth.username === 'test-username'
        || config.auth.apiKey === 'test-apiKey') {
      util.puts('Config file test-config.json must be updated with valid data before running tests.');
      process.exit(0);
    }

    testConfig = config;
    return config;
    
  }
  catch (ex) {
    util.puts('Config file test/data/test-config.json must be created with valid data before running tests.');
    process.exit(0);
  }  
};

helpers.createClient = function () {
  if (!testConfig) helpers.loadConfig();
  if (!client) client = cloudfiles.createClient(testConfig);
  
  return client;
};

helpers.assertContainer = function (container) {
  assert.instanceOf(container, cloudfiles.Container);
  assert.isNotNull(container.name);
  assert.isNotNull(container.count);
  assert.isNotNull(container.bytes);
};

helpers.assertCdnContainer = function (container) {
  helpers.assertContainer(container); 
  assert.isTrue(typeof container.ttl === 'number');
  assert.isTrue(typeof container.logRetention === 'boolean');
  assert.isTrue(typeof container.cdnUri === 'string');
  assert.isTrue(typeof container.cdnSslUri === 'string');
  assert.ok(container.cdnSslUri.match(/^https:/));
  assert.isTrue(container.cdnEnabled);
};

helpers.assertFile = function (file) {
  assert.instanceOf(file, cloudfiles.StorageObject);
  assert.isNotNull(file.name);
  assert.isNotNull(file.bytes);
  assert.isNotNull(file.hash);
  assert.isNotNull(file.lastModified);
  assert.isNotNull(file.contentType);
}

helpers.countTestContainers = function(containers){
	return containers.reduce(function(count,container){
		if(container.name == "test_container" || container.name == "test_cdn_container"){
			count++;
		}
		return count;
	},0);
}


