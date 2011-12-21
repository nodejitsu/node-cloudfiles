/*
 * core.js: Core functions for accessing Rackspace CloudFiles
 *
 * (C) 2010 Nodejitsu Inc.
 * MIT LICENSE
 *
 */

var http = require('http'),
    fs = require('fs'),
    path = require('path'),
    url = require('url'),
    async = require('async'),
    mime = require('mime'),
    request = require('request'),
    cloudfiles = require('../cloudfiles'),
    config = require('./config'),
    common = require('./common');

//
// ### function createClient (options)
// #### @options {Object} Options for this instance.
// Creates a new instance of a Loggly client.
//
exports.createClient = function (options) {
  return new Cloudfiles(config.createConfig(options));
};

//
// ### function Cloudfiles (config)
// #### @config {loggly.Config} Configuration object for this instance.
// Constructor function for the `Cloudfiles` object responsible for exposing
// the core `node-cloudfiles` API methods.
//
var Cloudfiles = exports.Cloudfiles = function (config) {
  this.config = config;
  this.authorized = false;
  
  //
  // Create the cache path for this instance immediately.
  //
  common.statOrMkdirp(this.config.cache.path)
};

//
// ### function setAuth (callback)
// #### @callback {function} Continuation to respond to when complete.
// Authenticates node-cloudfiles with the options specified 
// in the Config object for this instance
//
Cloudfiles.prototype.setAuth = function (callback) {
  var authOptions = {
    uri: 'https://' + this.config.auth.host + '/v1.0', 
    headers: {
      'HOST': this.config.auth.host,
      'X-AUTH-USER': this.config.auth.username,
      'X-AUTH-KEY': this.config.auth.apiKey
    }
  };
  
  var self = this;
  request(authOptions, function (err, res, body) {
    if (err) {
      return callback(err); 
    }

    var statusCode = res.statusCode.toString();
    if (Object.keys(common.failCodes).indexOf(statusCode) !== -1) {
      err = new Error('Rackspace Error (' + statusCode + '): ' + common.failCodes[statusCode]);
      return callback(err, res);
    }

    self.authorized = true;
    self.config.serverUrl = res.headers['x-server-management-url'];
    self.config.setStorageUrl(res.headers['x-storage-url']);
    self.config.cdnUrl = res.headers['x-cdn-management-url'];
    self.config.authToken = res.headers['x-auth-token'];
    self.config.storageToken = res.headers['x-storage-token']

    callback(null, res, self.config);
  });  
};

//
// ### function getContainers ([cdn,] callback)
// #### @cdn {boolean} Value indicating if CDN containers should be returned
// #### @callback {function} Continuation to respond to when complete.
// Gets all Rackspace Cloudfiles containers for this instance.
//
Cloudfiles.prototype.getContainers = function () {
  var self = this,
      args = Array.prototype.slice.call(arguments),
      callback = (typeof(args[args.length - 1]) === 'function') && args.pop(),
      isCdn = args.length > 0 && (typeof(args[args.length - 1]) === 'boolean') && args.pop(),
      url = isCdn ? this.cdnUrl(true) : this.storageUrl(true);

  common.rackspace(url, this, callback, function (body) {
    var results = [], 
        containers = JSON.parse(body);

    containers.forEach(function (container) {
      if (isCdn) {
        //
        // The cdn properties are normaly set in response headers
        // when requesting single cdn containers
        //
        container.cdnEnabled = container.cdn_enabled == "true";
        container.logRetention = container.log_retention == "true";
        container.cdnUri = container.cdn_uri;
        container.cdnSslUri = container.cdn_ssl_uri;
      }

      results.push(new (cloudfiles.Container)(self, container));
    });

    callback(null, results);
  });
};

//
// ### function getContainer (containerName, [cdn,] callback)
// #### @containerName {string} Name of the container to return
// #### @cdn {boolean} Value indicating if this is a CDN container.
// #### @callback {function} Continuation to respond to when complete.
// Responds with the Rackspace Cloudfiles container for the specified
// `containerName`.
//
Cloudfiles.prototype.getContainer = function () {
  var self = this,
      args = Array.prototype.slice.call(arguments),
      callback = (typeof(args[args.length - 1]) === 'function') && args.pop(),
      isCdn = args.length > 0 && (typeof(args[args.length - 1]) === 'boolean') && args.pop(),
      containerName = args.pop(),
      containerOptions;
  
  containerOptions = {
    method: 'HEAD',
    uri: isCdn ? this.cdnUrl(containerName) : this.storageUrl(containerName),
    cdn: isCdn,
    client: this
  }
  
  common.rackspace(containerOptions, callback, function (body, res) {
    var container = {
      name: containerName,
      count: new Number(res.headers['x-container-object-count']),
      bytes: new Number(res.headers['x-container-bytes-used'])
    };
    
    if (isCdn) {
      container.cdnUri = res.headers['x-cdn-uri'];
      container.cdnSslUri = res.headers['x-cdn-ssl-uri'];
      container.cdnEnabled = res.headers['x-cdn-enabled'].toLowerCase() == "true";
      container.ttl = parseInt(res.headers['x-ttl']);
      container.logRetention = res.headers['x-log-retention'].toLowerCase() == "true";

      delete container.count;
      delete container.bytes;
    }
    
    callback(null, new (cloudfiles.Container)(self, container));
  });
};

//
// ### function createContainer (container, callback)
// #### @container {string|Container} Container to create in Rackspace Cloudfiles.
// #### @callback {function} Continuation to respond to when complete.
// Creates the specified `container` in the Rackspace Cloudfiles associated
// with this instance.
//
Cloudfiles.prototype.createContainer = function (container, callback) {
  var self = this, 
      containerName = container instanceof cloudfiles.Container ? container.name : container;
      
  common.rackspace('PUT', this.storageUrl(containerName), this, callback, function (body, res) {
    if (typeof container.cdnEnabled !== 'undefined' && container.cdnEnabled) {
      container.ttl = container.ttl || self.config.cdn.ttl;
      container.logRetention = container.logRetention || self.config.cdn.logRetention;
      
      var cdnOptions = {
        uri: self.cdnUrl(containerName),
        method: 'PUT',
        client: self,
        headers: {
          'X-TTL': container.ttl,
          'X-LOG-RETENTION': container.logRetention
        }
      };
      
      common.rackspace(cdnOptions, callback, function (body, res) {
        container.cdnUri = res.headers['x-cdn-uri'];
        container.cdnSslUri = res.headers['x-cdn-ssl-uri'];
        callback(null, new (cloudfiles.Container)(self, container));
      });
    }
    else {
      callback(null, new (cloudfiles.Container)(self, container));
    }
  });
};

//
// ### function destroyContainer (container, callback)
// #### @container {string} Name of the container to destroy
// #### @callback {function} Continuation to respond to when complete.
// Destroys the specified `container` and all files in it.
//
Cloudfiles.prototype.destroyContainer = function (container, callback) {
  var self = this;
  this.getFiles(container, function (err, files) {
    if (err) {
      return callback(err);
    }
    
    function deleteContainer (err) {
      if (err) {
        return callback(err);
      }
      
      common.rackspace('DELETE', self.storageUrl(container), self, callback, function (body, res) {
        callback(null, true);
      });
    }
    
    function destroyFile (file, next) {
      file.destroy(next);
    }
    
    if (files.length === 0) {
      return deleteContainer();
    }
    
    async.forEach(files, destroyFile, deleteContainer);
  });
};

Cloudfiles.prototype.getFiles = function (container, download, callback) {
  var self = this;
  
  //
  // Download is optional argument
  // And can be only: true, false, [array of files]
  //
  // Also download can be omitted: (...).getFiles(container, callback);
  // In this case second argument will be a function
  //
  if (typeof download === 'function' && !(download instanceof RegExp)) {
    callback = download;
    download = false;
  }

  common.rackspace(this.storageUrl(container, true), this, callback, function (body) {
    var files = JSON.parse(body);
    
    // If download == false or wasn't defined
    if (!download) {
      var results = files.map(function (file) {
        file.container = container;
        return new (cloudfiles.StorageObject)(self, file);
      });
      
      callback(null, results);
      return;
    }
    
    var batch;
    
    if (download instanceof RegExp || download == true) {
      // If download == true
      // Download all files
      if (download !== true) {
        files = files.filter(function (file) {
          return download.test(file.name);
        });
      }
      
      // Create a batch
      batch = files.map(function (file) {
        return function (callback) {
          self.getFile(container, file.name, callback);
        }
      });      
    } 
    else if (Array.isArray(download)) {
      // Go through all files that we've asked to download 
      batch = download.map(function (file) {
        var exists = files.some(function (item) {
          return item.name == file
        });
        
        // If file exists - get it
        // If not report about error
        return exists ?
            function (callback) {
              self.getFile(container, file, callback);
            } :
            function (callback) {
              callback(Error('File : ' + file + ' doesn\'t exists'));
            };
      });
    } 
    else {
      callback(Error('"download" argument can be only boolean, array or regexp'));
    }
    
    // Run batch
    common.runBatch(batch, callback);
  });
};

Cloudfiles.prototype.getFile = function (container, filename, callback) {
  var self = this, 
      containerPath = path.join(this.config.cache.path, container),
      cacheFile = path.join(containerPath, filename),
      options;
  
  common.statOrMkdirp(containerPath);
  
  var lstream = fs.createWriteStream(cacheFile),
      rstream,
      options;
      
  options = {
    method: 'GET', 
    client: self,
    uri: self.storageUrl(container, filename),
    download: lstream
  };

  rstream = common.rackspace(options, callback, function (body, res) {
    var file = {
      local: cacheFile,
      container: container,
      name: filename,
      bytes: res.headers['content-length'],
      etag: res.headers['etag'],
      last_modified: res.headers['last-modified'],
      content_type: res.headers['content-type']
    };

    callback(null, new (cloudfiles.StorageObject)(self, file));
  });
};

//
// options
//   remote
//   local
//   stream
//   mime
//
Cloudfiles.prototype.addFile = function (container, options, callback) {
  if (typeof options === 'function' && !callback) {
    callback = options;
    options = {};
  }
  if (!options.remote) {
    return callback(new Error('.remote is required to addFile'));
  }

  var lstream,
      addOptions,
      size;

  if (options.local) {
    lstream = fs.createReadStream(options.local, options.fs);
    options.headers = options.headers || {};
    options.headers['content-length'] = fs.statSync(options.local).size;
  }
  else if (options.stream) {
    lstream = options.stream;
  }
  
  if (!lstream) {
    return callback(new Error('.local or .stream is required to addFile.'));
  }
  
  addOptions = {
    method: 'PUT',
    client: this,
    upload: lstream,
    uri: this.storageUrl(container, options.remote),
    headers: options.headers || {}
  };
  
  if (options.headers && !options.headers['content-type']) {
    options.headers['content-type'] = mime.lookup(options.remote);
  }
  
  return common.rackspace(addOptions, callback, function (body, res) {
    callback(null, true);
  });
};

//
// ### function destroyFile (container, file, callback)
// #### @container {string} Name of the container to destroy the file in
// #### @file {string} Name of the file to destroy.
// #### @callback {function} Continuation to respond to when complete.
// Destroys the `file` in the specified `container`.
//
Cloudfiles.prototype.destroyFile = function (container, file, callback) {
  common.rackspace('DELETE', this.storageUrl(container, file), this, callback, function (body, res) {
    callback(null, true);
  });
};

//
// ### function storageUrl (arguments)
// #### @arguments {Array} Lists of arguments to convert into a storage url.
// Helper method that concats the string params into a url to request against
// the authenticated node-cloudfiles storageUrl. 
//
Cloudfiles.prototype.storageUrl = function () {
  var args = Array.prototype.slice.call(arguments),
      json = (typeof(args[args.length - 1]) === 'boolean') && args.pop();
  
  return [this.config.storageUrl].concat(args).join('/') + (json ? '?format=json' : '');
};

//
// ### function cdnUrl (arguments)
// #### @arguments {Array} Lists of arguments to convert into a cdn url.
// Helper method that concats the string params into a url
// to request against the authenticated node-cloudfiles cdnUrl. 
//
Cloudfiles.prototype.cdnUrl = function () {
  var args = Array.prototype.slice.call(arguments),
      json = (typeof(args[args.length - 1]) === 'boolean') && args.pop();
  
  return [this.config.cdnUrl].concat(args).join('/') + (json ? '?format=json' : '');
};
