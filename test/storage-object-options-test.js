/*
 * storage-object-options-test.js: Tests for rackspace cloudfiles file upload with extra options
 *
 * (C) 2010 Nodejitsu Inc.
 * MIT LICENSE
 *
 */

require.paths.unshift(require('path').join(__dirname, '..', 'lib'));
 
var path = require('path'),
    vows = require('vows'),
    fs = require('fs'),
    assert = require('assert'),
    cloudfiles = require('cloudfiles'),
    helpers = require('./helpers');

var client = helpers.createClient();

vows.describe('node-cloudfiles/storage-object').addBatch({
  "The node-cloudfiles client": {
    "the addFile() method with options": {
      topic: function () {
        var options = { 
          headers: {
            'Content-Encoding' : 'gzip'
          }
        };
        
        client.addFile('test_container', 'file1.txt', path.join(__dirname, '..', 'test', 'fixtures', 'fillerama.txt'), options, this.callback);
      },
      "should respond with true": function (err, uploaded) {
        assert.isTrue(uploaded);
      }
    }
  }
}).addBatch({
  "The node-cloudfiles client": {
    "the getFile() method": {
      "for a file that exists": {
        topic: function () {
          client.getFile('test_container', 'file1.txt', this.callback);
        },
        "should return a valid StorageObject": function (err, file) {
          helpers.assertFile(file);
        }
      }
    }
  }
}).addBatch({
  "The node-cloudfiles client": {
    "the destroyFile() method": {
      "for a file that exists": {
        topic: function () {
          client.destroyFile('test_container', 'file1.txt', this.callback);
        },
        "should return true": function (err, deleted) {
          assert.isTrue(deleted);
        }
      }
    }
  }
}).export(module);