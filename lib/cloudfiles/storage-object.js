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
  addMetadata: function (metadata, callback) {
    
  },
  
  copy: function (destination, callback) {
    var copyOptions = {
      method: 'PUT',
      uri: this.fullPath,
      headers: {
        'X-COPY-DESTINATION': destination,
        'CONTENT-LENGTH': this.bytes
      }
    };
    
    utils.rackspace(copyOptions, callback, function (body, res) {
      eyes.inspect(body);
      eyes.inspect(res.statusCode);
    });
  },
  
  destroy: function (callback) {
    cloudfiles.destroyFile(this.containerName, this.name, callback);
  },
  
  getMetadata: function () {
    
  },
  
  removeMetadata: function (keys, callback) {
    
  },
  
  update: function (data, callback) {
    
  },
  
  get fullPath() {
    return utils.storageUrl(this.containerName, this.name);
  },
  
  get containerName() {
    return this.container instanceof cloudfiles.Container ? this.container.name : this.container; 
  },
  
  _setProperties: function (details) {
    this.container = details.container;
    this.name = details.name;
    this.hash = details.hash;
    this.bytes = details.bytes;
    this.data = details.data;
    this.contentType = details.content_type;
    this.lastModified = details.last_modified;
  }
};

exports.StorageObject = StorageObject;