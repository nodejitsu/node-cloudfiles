/*
 * servicenet-test.js: Tests for Rackspace Cloudfiles Service Net transfer
 *
 * MIT LICENSE
 *
 */

var path = require('path'),
    vows = require('vows'),
    assert = require('assert'),
    helpers = require('./helpers'),
    cloudfiles = require('../lib/cloudfiles');

// Create a config that has servicenet = true
var testConfig = helpers.loadConfig(),
    snConfig = {};
for (var key in testConfig) {
  if (testConfig.hasOwnProperty(key)) snConfig[key] = testConfig[key];
}
snConfig.servicenet = true;

var client = helpers.createClient(),
    snClient = cloudfiles.createClient(snConfig);
    
vows.describe('node-cloudfiles/servicenet').addBatch({
  "The node-cloudfiles client": {
    "with valid credentials and not specifying ServiceNet transfer": {
      topic: function () {
        client.setAuth(this.callback);
      },
      "should respond with 204 and appropriate headers": function (err, res) {
        assert.equal(res.statusCode, 204); 
        assert.isObject(res.headers);
        assert.include(res.headers, 'x-server-management-url');
        assert.include(res.headers, 'x-storage-url');
        assert.include(res.headers, 'x-cdn-management-url');
        assert.include(res.headers, 'x-auth-token');
      },
      "should update the config with non-ServiceNet storage url": function (err, res) {
        assert.equal(res.headers['x-storage-url'], client.config.storageUrl);
        assert.ok(client.config.storageUrl.substring(0, 13) != 'https://snet-');
      }
    },
    "with valid credentials and specifying ServiceNet transfer": {
      topic: function () {
        snClient.setAuth(this.callback);
      },
      "should respond with 204 and appropriate headers": function (err, res) {
        assert.equal(res.statusCode, 204); 
        assert.isObject(res.headers);
        assert.include(res.headers, 'x-server-management-url');
        assert.include(res.headers, 'x-storage-url');
        assert.include(res.headers, 'x-cdn-management-url');
        assert.include(res.headers, 'x-auth-token');
      },
      "should update the config with non-ServiceNet storage url": function (err, res) {
        assert.notEqual(res.headers['x-storage-url'], snClient.config.storageUrl);
        assert.ok(snClient.config.storageUrl.substring(0, 13) == 'https://snet-');
      }
    },
  }
}).export(module);

