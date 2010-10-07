/*
 * mime-test.js: Tests for mime type indentification
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */
 
var path = require('path'),
    vows = require('vows'),
    eyes = require('eyes'),
    fs = require('fs'),
    assert = require('assert');
    
require.paths.unshift(path.join(__dirname, '..', 'lib'));

var cloudfiles = require('cloudfiles');

var tests = {};

// Create a test for each mime type
Object.keys(cloudfiles.mime.types).forEach(function (ext) {
  var mimeType = cloudfiles.mime.types[ext],
      test = 'when passed a ' + ext + ' file',
      assertion = "should response with " + mimeType + " mimetype";
  
  tests[test] = { };
  tests[test][assertion] = function () {
    var testType = cloudfiles.mime.type('someFile' + ext);
    assert.isTrue(testType.indexOf(mimeType) !== -1);
  };
});

// Create a batch for the specified mime type
var batch = {
  "When using the node-cloudfiles client": {
    "the mime type module": tests
  }
};

// Export the batch with vows
vows.describe('cloudfiles/mime').addBatch(batch).export(module);