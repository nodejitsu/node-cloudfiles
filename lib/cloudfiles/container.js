/*
 * container.js: Instance of a single rackspace cloudfiles container
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

require.paths.unshift(require('path').join(__dirname, '..'));

var cloudfiles = require('cloudfiles'),
    sys = require('sys'),
    utils = require('./utils');
 
var Container = exports.Container = function (client, details) {
  if (!details) {
    throw new Error("Container must be constructed with at least basic details.")
  }
  
  this.files = [];
  this.client = client;
  this._setProperties(details);
};

Container.prototype = {
  addFile: function (file, local, callback) {
    this.client.addFile(this.name, file, local, callback);
  },
  
  destory: function (callback) {
    this.client.destoryContainer(this.name, callback);
  },
  
  getFiles: function (callback) {
    var self = this;
    this.client.getFiles(this.name, function (err, files) {
      self.files = files;
      callback(null, files);
    });
  },
  
  removeFile: function (file, callback) {
    this.client.destroyFile(this.name, file, callback);
  },
  
  // Remark: Not fully implemented
  updateCdn: function (options, callback) {
    if (!this.cdnEnabled) {
      callback(new Error('Cannot call updateCdn on a container that is not CDN enabled'));
    }
    
    // TODO: Write the rest of this method
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