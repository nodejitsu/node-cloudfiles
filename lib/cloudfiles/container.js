/*
 * container.js: Instance of a single rackspace cloudfiles container
 *
 * (C) 2010 Nodejitsu Inc.
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
  
  getFiles: function (download, callback) {
    var self = this;
    
    // download can be omitted: (...).getFiles(callback);
    // In this case first argument will be a function
    if (typeof download === 'function' && !(download instanceof RegExp)) {
      callback = download;
      download = false;
    }
    
    this.client.getFiles(this.name, download, function (err, files) {
      if (err) return callback(err);
      
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
    this.cdnSslUri = details.cdnSslUri;
    this.ttl = details.ttl;
    this.logRetention = details.logRetention;
    this.count = details.count || 0;
    this.bytes = details.bytes || 0;
  }
};
