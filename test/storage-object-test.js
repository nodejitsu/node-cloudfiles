/*
 * container-test.js: Tests for rackspace cloudfiles containers
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */
 
var path = require('path'),
    vows = require('vows'),
    fs = require('fs'),
    helpers = require('./helpers')
    assert = require('assert');
    
require.paths.unshift(path.join(__dirname, '..', 'lib'));

var cloudfiles = require('cloudfiles');

var sampleData = fs.readFileSync(path.join(__dirname, '..', 'test', 'data', 'fillerama.txt')).toString(),
    testData = {};

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
    "the addFile() method": {
      topic: function () {
        cloudfiles.addFile('test_container', 'file1.txt', path.join(__dirname, '..', 'test', 'data', 'fillerama.txt'), this.callback);
      },
      "should respond with true": function (err, uploaded) {
        assert.isTrue(uploaded);
      }
    },
    "the addFile() method called a second time": {
      topic: function () {
        cloudfiles.addFile('test_container', 'file2.txt', path.join(__dirname, '..', 'test', 'data', 'fillerama.txt'), this.callback);
      },
      "should respond with true": function (err, uploaded) {
        assert.isTrue(uploaded);
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
}).addBatch({
  "The node-cloudfiles client": {
    "the getFile() method": {
      "for a file that exists": {
        topic: function () {
          cloudfiles.getFile('test_container', 'file2.txt', this.callback);
        },
        "should return a valid StorageObject": function (err, file) {
          helpers.assertFile(file);
          testData.file = file;
        }
      }
    }
  }
}).addBatch({
  "The node-cloudfiles client": {
    "an instance of StorageObject": {
      "the save() method": {
        topic: function () {
          var self = this;
          testData.file.save({ local: path.join(__dirname, 'data', 'fillerama2.txt') }, function (err, filename) {
            if (err) {
              self.callback(err);
            }
            
            fs.stat(filename, self.callback)
          });
        },
        "should write the file to the specified location": function (err, stats) {
          assert.isNull(err);
          assert.isNotNull(stats);
        }
      }
    }
  }
}).addBatch({
  "The node-cloudfiles client": {
    "the destroyFile() method": {
      "for a file that exists": {
        topic: function () {
          cloudfiles.destroyFile('test_container', 'file1.txt', this.callback);
        },
        "should return true": function (err, deleted) {
          assert.isTrue(deleted);
        }
      }
    }
  }
}).addBatch({
  "The node-cloudfiles client": {
    "an instance of a StorageObject": {
      "the destroy() method": {
        "for a file that exists": {
          topic: function () {
            testData.file.destroy(this.callback);
          },
          "should return true": function (err, deleted) {
            assert.isTrue(deleted);
          }
        }
      }
    }
  }
}).export(module);