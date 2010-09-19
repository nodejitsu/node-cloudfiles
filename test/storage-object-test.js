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

vows.describe('node-cloudfiles/storage-object').addBatch({
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
    "the getFiles() method": {
      topic: function () {
        cloudfiles.getFiles('test_container', this.callback);
      },
      "should return a valid list of files": function (err, files) {
        files.forEach(function (file) {
          helpers.assertFile(file);
        });
      }
    }
  }
}).export(module);