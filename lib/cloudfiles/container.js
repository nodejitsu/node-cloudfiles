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
 
var Container = function (details) {
  if (!details) {
    throw new Error("Container must be constructed with at least basic details.")
  }
  
  this.files = [];
  this._setProperties(details);
};

Container.prototype = {
    // Remark: Not fully implemented
  addFile: function (file, data, callback) {
    cloudfiles.addFile(this.name, file, data, callback);
  },
  
  destory: function (callback) {
    cloudfiles.destoryContainer(this.name, callback);
  },
  
  getFiles: function (callback) {
    var self = this;
    cloudfiles.getFiles(this.name, function (err, files) {
      self.files = files;
      callback(null, files);
    });
  },
  
  removeFile: function (file, callback) {
    cloudfiles.destroyFile(this.name, file, callback);
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

exports.Container = Container;