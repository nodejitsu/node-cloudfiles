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
    "the destroyContainer() method": {
      "when deleting test_container": {
        topic: function () {
          cloudfiles.destroyContainer('test_container', this.callback)
        },
        "should return true": function (err, success) {
          assert.isTrue(success);
        }
      },
      "when deleting test_cdn_container": {
        topic: function () {
          cloudfiles.destroyContainer('test_cdn_container', this.callback)
        },
        "should return true": function (err, success) {
          assert.isTrue(success);
        }
      }
    }
  }
}).export(module);