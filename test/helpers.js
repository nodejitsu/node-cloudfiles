/*
 * helpers.js: Test helpers for node-cloudservers
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */
 
var path = require('path'),
    vows = require('vows'),
    assert = require('assert');
    
require.paths.unshift(path.join(__dirname, '..', 'lib'));

var cloudfiles = require('cloudfiles');

var helpers = exports;

helpers.assertContainer = function (container) {
  assert.instanceOf(container, cloudfiles.Container);
  assert.isNotNull(container.name);
  assert.isNotNull(container.count);
  assert.isNotNull(container.bytes);
};

helpers.assertFile = function (file) {
  assert.instanceOf(file, cloudfiles.StorageObject);
  assert.isNotNull(file.name);
  assert.isNotNull(file.bytes);
  assert.isNotNull(file.hash);
  assert.isNotNull(file.lastModified);
  assert.isNotNull(file.contentType);
}
