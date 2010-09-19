/*
 * container.js: Instance of a single rackspace cloudfiles container
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
 
var Container = function (details) {
  if (!details) {
    throw new Error("Container must be constructed with at least basic details.")
  }
  
  this.files = [];
  this._setProperties(details);
};

Container.prototype = {
  destory: function () {
    
  },
  
  _setProperties: function (details) {
    this.name = details.name;
    this.count = details.count;
    this.bytes = details.bytes;
  }
};

exports.Container = Container;