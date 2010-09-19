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
  copy: function (destination, callback) {
    var copyOptions = {
      method: 'COPY',
      uri: this.fullPath,
      headers: {
        'Destination': destination
      }
    };
    
    utils.rackspace(copyOptions, callback, function (body, res) {
      eyes.inspect(body);
      eyes.inspect(res.statusCode);
    });
  },
  
  destroy: function () {
    utils.rackspace('DELETE', this.fullPath, callback, function (body, res) {
      eyes.inspect(body);
      eyes.inspect(res.statusCode);
    });
  },
  
  // Adds metadata to this instance .... getter / setter?
  addMetadata: function () {
    
  },
  
  // Updates this instance with a new target bytes??
  update: function () {
    
  },
  
  get fullPath() {
    var containerName = this.container instanceof cloudfiles.Container ? this.container.name : this.container;
    return utils.storageUrl(containerName, this.name);
  },
  
  _setProperties: function (details) {
    this.container = details.container;
    this.name = details.name;
    this.hash = details.hash;
    this.bytes = details.bytes;
    this.contentType = details.content_type;
    this.lastModified = details.last_modified;
  }
};

exports.StorageObject = StorageObject;