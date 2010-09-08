/*
 * storage-object.js: Instance of a single rackspace cloudserver
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

require.paths.unshift(require('path').join(__dirname, '..'));

var cloudfiles = require('cloudfiles'),
    eyes = require('eyes'),
    sys = require('sys'),
    utils = require('./utils');
 
var StorageObject = function (details) {
  if (!details) {
    throw new Error("StorageObject must be constructed with at least basic details.")
  }
  
  this._setProperties(details);
};

StorageObject.prototype = {
  
  _setProperties: function (details) {
    
  }
};