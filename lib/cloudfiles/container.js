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
    this.cdnEnabled = details.cdnEnabled || false;
    this.cdnUri = details.cdnUri;
    this.ttl = details.ttl;
    this.logRetention = details.logRetention;
    this.count = details.count || 0;
    this.bytes = details.bytes || 0;
  }
};

exports.Container = Container;