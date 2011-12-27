/*
 * storage-object.js: Instance of a single rackspace cloudserver
 *
 * (C) 2010 Nodejitsu Inc.
 * MIT LICENSE
 *
 */

var fs = require('fs'),
    cloudfiles = require('../cloudfiles'),
    common = require('./common');

var StorageObject = exports.StorageObject = function (client, details) {
  if (!details) {
    throw new Error("StorageObject must be constructed with at least basic details.")
  }
  
  this.client = client;
  this._setProperties(details);
};

StorageObject.prototype = {
  // Remark: Not fully implemented
  addMetadata: function (metadata, callback) {
    var newMetadata = clone(this.metadata);
    Object.keys(metadata).forEach(function (key) {
      newMetadata[key] = metadata[key];
    });
    
    var options = {
      uri: this.fullPath,
      method: 'POST', 
      headers: this._createHeaders(newMetadata) 
    };
    
    common.rackspace(options, callback, function (body, res) {
      this.metadata = newMetadata;
      callback(null, true);
    });
  },
  
  // Remark: This method is untested
  copy: function (container, destination, callback) {
    var copyOptions = {
      method: 'PUT',
      uri: this.fullPath,
      headers: {
        'X-COPY-DESTINATION': [container, destination].join('/'),
        'CONTENT-LENGTH': this.bytes
      }
    };
    
    common.rackspace(copyOptions, callback, function (body, res) {
      callback(null, true);
    });
  },
  
  destroy: function (callback) {
    this.client.destroyFile(this.containerName, this.name, callback);
  },
  
  // Remark: Not fully implemented
  getMetadata: function (callback) {
    common.rackspace('HEAD', this.fullPath, function (body, res) {
      var metadata = {};
      Object.keys(res.headers).forEach(function (header) {
        var match;
        if (match = header.match(/x-object-meta-(\w+)/i)) {
          metadata[match[1]] = res.headers[header];
        }
      });
      
      callback(null, metadata);
    });
  },
  
  // Remark: Not fully implemented
  removeMetadata: function (keys, callback) {
    var newMetadata = {};
    Object.keys(this.metadata).forEach(function (key) {
      if (keys.indexOf(key) !== -1) {
        newMetadata[key] = this.metadata[key];
      }
    });
    
    // TODO: Finish writing this method
  },
  
  save: function (options, callback) {
    var self = this;
    var fileStream = fs.createWriteStream(options.local, {
      flags: options.flags || 'w+', 
      encoding: options.encoding || null,
      mode: options.mode || 0666
    });
    
    fs.readFile(this.local, function (err, data) {
      if (err) {
        return callback(err);
      }
      
      function endWrite() {
        fileStream.end();
        callback(null, options.local);
      }
      
      var written = false;
      fileStream.on('drain', function () {
        if (!written) {
          endWrite();
        }
      });
      
      written = fileStream.write(data);
      if (written) {
        endWrite();
      }
    });
  },
  
  update: function (data, callback) {
    
  },
  
  get fullPath() {
    return this.client.storageUrl(this.containerName, this.name);
  },
  
  get containerName() {
    return this.container instanceof cloudfiles.Container ? this.container.name : this.container; 
  },
  
  _setProperties: function (details) {
    // TODO: Should probably take this in from details or something.
    this.metadata = {};
    
    this.container = details.container || null;
    this.name = details.name || null;
    this.etag = details.etag || null;
    this.hash = details.hash || null;
    this.bytes = details.bytes || null;
    this.local = details.local || null;
    this.contentType = details.content_type || null;
    this.lastModified = details.last_modified || null;
  },
  
  _createHeaders: function (metadata) {
    var headers = {};
    Object.keys(metadata).forEach(function (key) {
      var header = "x-object-meta-" + key;
      headers[header] = metadata[key];
    });
    
    return headers;
  }
};

