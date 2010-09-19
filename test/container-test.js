/*
 * container-test.js: Tests for rackspace cloudfiles containers
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */
 
var path = require('path'),
    vows = require('vows'),
    eyes = require('eyes'),
    helpers = require('./helpers')
    assert = require('assert');
    
require.paths.unshift(path.join(__dirname, '..', 'lib'));

var cloudfiles = require('cloudfiles');

vows.describe('node-cloudfiles/containers').addBatch({
  "The node-cloudfiles client": {
    "when authenticated": {
      topic: function () {
        var options = cloudfiles.config
        cloudfiles.setAuth(options.auth, this.callback);
      },
      "should return with 204": function (err, res) {
        assert.equal(res.statusCode, 204);
      }
    }
  }
}).addBatch({
  "The node-cloudfiles client": {
    "the getContainers() method": {
      topic: function () {
        cloudfiles.getContainers(this.callback); 
      },
      "should return a list of containers": function (err, containers) {
        containers.forEach(function (container) {
          helpers.assertContainer(container);
        });
      }
    },
    "the getContainer() method": {
      topic: function () {
        cloudfiles.getContainer('test_container', this.callback); 
      },
      "should return a valid container": function (err, container) {
        helpers.assertContainer(container);
      }
    }
  }
}).export(module);