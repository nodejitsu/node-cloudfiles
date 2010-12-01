/*
 * container-test.js: Tests for rackspace cloudfiles containers
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

require.paths.unshift(require('path').join(__dirname, '..', 'lib'));
 
var path = require('path'),
    fs = require('fs'),
    vows = require('vows'),
    eyes = require('eyes'),
    assert = require('assert'),
    cloudfiles = require('cloudfiles'),
    helpers = require('./helpers');

var testData = {}, client = helpers.createClient(),
    sampleData = fs.readFileSync(path.join(__dirname, '..', 'test', 'data', 'fillerama.txt')).toString();

vows.describe('node-cloudfiles/containers').addBatch({
  "The node-cloudfiles client": {
    "the createContainer() method": {
      "when creating a container": {
        topic: function () {
          client.createContainer({ name: 'test_container' }, this.callback);
        },
        "should return a valid container": function (err, container) {
          helpers.assertContainer(container);
        }
      },
      "when creating a CDN-enabled container": {
        topic: function () {
          client.createContainer({
            name: 'test_cdn_container',
            cdnEnabled: true
          }, this.callback);
        },
        "should return a valid container": function (err, container) {
          helpers.assertCdnContainer(container);
        }
      }
    }
  }
}).addBatch({
  "The node-cloudfiles client": {
    "the createContainer() method": {
      "when creating a container that already exists": {
        topic: function () {
          client.createContainer({ name: 'test_container' }, this.callback);
        },
        "should return a valid container": function (err, container) {
          helpers.assertContainer(container);
        }
      },
    },
    "the getContainers() method": {
      "when requesting non-CDN containers": {
        topic: function () {
          client.getContainers(this.callback); 
        },
        "should return a list of containers": function (err, containers) {
          assert.isArray(containers);
          assert.length(containers, 2);
          containers.forEach(function (container) {
            helpers.assertContainer(container);
          });
        }
      },
      "when requesting CDN containers": {
        topic: function () {
          client.getContainers(true, this.callback); 
        },
        "should return a list of containers": function (err, containers) {
          assert.isArray(containers);
          assert.length(containers, 1);
          containers.forEach(function (container) {
            helpers.assertContainer(container);
          });
        }
      }
    },
    "the getContainer() method": {
      "when requesting non-CDN container": {
        topic: function () {
          client.getContainer('test_container', this.callback); 
        },
        "should return a valid container": function (err, container) {
          helpers.assertContainer(container);
          testData.container = container;
        }
      },
      "when requesting CDN container": {
        "with a valid CDN container": {
          topic: function () {
            client.getContainer('test_cdn_container', true, this.callback); 
          },
          "should return a valid container": function (err, container) {
            helpers.assertContainer(container);
          }
        },
        "with an invalid CDN container": {
          topic: function () {
            client.getContainer('test_container', true, this.callback); 
          },
          "should respond with an error": function (err, container) {
            assert.isNotNull(err);
          }
        }
      }
    }
  }
}).addBatch({
  "The node-cloudfiles client": {
    "an instance of a Container object": {
      "the addFile() method": {
        topic: function () {
          client.addFile('test_container', 'file1.txt', path.join(__dirname, '..', 'test', 'data', 'fillerama.txt'), this.callback);
        },
        "should respond with true": function (err, uploaded) {
          assert.isTrue(uploaded);
        }
      }
    }
  }
}).addBatch({
  "The node-cloudfiles client": {
    "an instance of a Container object": {
      "the getFiles() method": {
        topic: function () {
          testData.container.getFiles(this.callback);
        },
        "should response with a list of files": function (err, files) {
          assert.isArray(files);
          assert.length(files, 1); 
          assert.isArray(testData.container.files);
          assert.length(testData.container.files, 1);
        }
      }
    }
  }
}).addBatch({
  "The node-cloudfiles client": {
    "an instance of a Container object": {
      "the removeFile() method": {
        topic: function () {
          testData.container.removeFile('file1.txt', this.callback);
        },
        "should response with true": function (err, removed) {
          assert.isTrue(removed);
        }
      }
    }
  }
}).export(module);