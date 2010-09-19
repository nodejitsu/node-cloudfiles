/*
 * authentication-test.js: Tests for rackspace cloudfiles authentication
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */
 
var path = require('path'),
    vows = require('vows'),
    eyes = require('eyes'),
    assert = require('assert');
    
require.paths.unshift(path.join(__dirname, '..', 'lib'));

var cloudfiles = require('cloudfiles');
    
vows.describe('node-cloudfiles/authentication').addBatch({
  "The node-cloudfiles client": {
    "should have core methods defined": function() {
      assert.isObject(cloudfiles.config.auth);
      assert.include(cloudfiles.config.auth, 'username');
      assert.include(cloudfiles.config.auth, 'apiKey');
      
      assert.isFunction(cloudfiles.setAuth);
    },
    "with a valid username and api key": {
      topic: function () {
        var options = cloudfiles.config;
        cloudfiles.setAuth(options.auth, this.callback);
      },
      "should respond with 204 and appropriate headers": function (err, res) {
        assert.equal(res.statusCode, 204); 
        assert.isObject(res.headers);
        assert.include(res.headers, 'x-server-management-url');
        assert.include(res.headers, 'x-storage-url');
        assert.include(res.headers, 'x-cdn-management-url');
        assert.include(res.headers, 'x-auth-token');
      },
      "should update the config with appropriate urls": function (err, res) {
        var config = cloudfiles.config;
        assert.equal(res.headers['x-server-management-url'], config.serverUrl);
        assert.equal(res.headers['x-storage-url'], config.storageUrl);
        assert.equal(res.headers['x-cdn-management-url'], config.cdnUrl);
        assert.equal(res.headers['x-auth-token'], config.authToken);
      }
    },
    "with an invalid username and api key": {
      topic: function () {
        var options = { 
          username: 'invalid-username', 
          apiKey: 'invalid-apikey'
        };
        
        cloudfiles.setAuth(options, this.callback);
      },
      "should respond with 401": function (err, res) {
        assert.equal(res.statusCode, 401);
      }
    }
  }
}).export(module);