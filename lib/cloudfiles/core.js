/*
 * core.js: Core functions for accessing Rackspace CloudFiles
 *
 * (C) 2010 Nodejitsu Inc.
 * MIT LICENSE
 *
 */

require.paths.unshift(require('path').join(__dirname, '..'));
 
var http = require('http'),
    fs = require('fs'),
    path = require('path'),
    url = require('url'),
    request = require('request'),
    config = require('./config'),
    utils = require('./utils'),
    cloudfiles = require('cloudfiles');

//
// function createClient (options)
//   Creates a new instance of a Loggly client.
//
exports.createClient = function (options) {
  return new Cloudfiles(config.createConfig(options));
};

var Cloudfiles = exports.Cloudfiles = function (config) {
  this.config = config;
  this.authorized = false;
};

//
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
  utils.statOrMkdir(this.config.cache.path, function () {
    request(authOptions, function (err, res, body) {
      if (err) return callback(err); 

      self.authorized = true;
      self.config.serverUrl = res.headers['x-server-management-url'];
      self.config.storageUrl = res.headers['x-storage-url'];
      self.config.cdnUrl = res.headers['x-cdn-management-url'];
      self.config.authToken = res.headers['x-auth-token'];
      self.config.storageToken = res.headers['x-storage-token']

      callback(null, res, self.config);
    }); 
  });  
};

Cloudfiles.prototype.getContainers = function () {
  var self = this,
      args = Array.prototype.slice.call(arguments),
      callback = (typeof(args[args.length - 1]) === 'function') && args.pop(),
      isCdn = args.length > 0 && (typeof(args[args.length - 1]) === 'boolean') && args.pop(),
      url = isCdn ? this.cdnUrl(true) : this.storageUrl(true);

  
  utils.rackspace(url, this, callback, function (body) {
    var results = [], containers = JSON.parse(body);

    containers.forEach(function (container) {

      if(isCdn){

        /* The cdn properties are normaly set in response headers
         * when requesting single cdn containers
         */

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

Cloudfiles.prototype.getContainer = function () {
  var self = this,
      args = Array.prototype.slice.call(arguments),
      callback = (typeof(args[args.length - 1]) === 'function') && args.pop(),
      isCdn = args.length > 0 && (typeof(args[args.length - 1]) === 'boolean') && args.pop(),
      containerName = args.pop();
  
  var containerOptions = {
    method: 'HEAD',
    uri: isCdn ? this.cdnUrl(containerName) : this.storageUrl(containerName),
    cdn: isCdn,
    client: this
  }
  
  utils.rackspace(containerOptions, callback, function (body, res) {
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

Cloudfiles.prototype.createContainer = function (container, callback) {
  var self = this, containerName = container instanceof cloudfiles.Container ? container.name : container;
  utils.rackspace('PUT', this.storageUrl(containerName), this, callback, function (body, res) {
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
      
      utils.rackspace(cdnOptions, callback, function (body, res) {
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

Cloudfiles.prototype.destroyContainer = function (container, callback) {
  var self = this;
  this.getFiles(container, function (err, files) {
    if (err) return callback(err);
    
    function destroy () {
      utils.rackspace('DELETE', self.storageUrl(container), self, callback, function (body, res) {
        callback(null, true);
      });
    }
    
    if (files.length === 0) return destroy();
    
    files.forEach(function (file) {
      file.destroy(function (err, deleted) {
        if (file === files[files.length - 1]) destroy();
      });
    });
  });
};

Cloudfiles.prototype.getFiles = function (container, download, callback) {
  var self = this;
  
  // Download is optional argument
  // And can be only: true, false, [array of files]
  
  // Also download can be omitted: (...).getFiles(container, callback);
  // In this case second argument will be a function
  if (typeof download === 'function' && !(download instanceof RegExp)) {
    callback = download;
    download = false;
  }

  utils.rackspace(this.storageUrl(container, true), this, callback, function (body) {
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
        return function(callback) {
          self.getFile(container, file.name, callback);
        }
      });      
    } else if (Array.isArray(download)) {
      // Go through all files that we've asked to download 
      batch = download.map(function(file) {
        var exists = files.some(function(item) {
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
    } else {
      callback(Error('"download" argument can be only boolean, array or regexp'));
    }
    
    // Run batch
    utils.runBatch(batch, callback);
  });
};

Cloudfiles.prototype.getFile = function (container, filename, callback) {
  var self = this, containerPath = path.join(this.config.cache.path, container);
  
  utils.statOrMkdir(containerPath, function () {
    var cacheFile = path.join(containerPath, filename);

    var options = {
      method: 'GET', 
      client: self,
      uri: self.storageUrl(container, filename),
      filename: cacheFile
    };

    utils.curlDownload(options, callback, function (body, res) {
      var file = {
        local: cacheFile,
        container: container,
        name: filename,
        bytes: res.bytes,
        hash: res.hash,
        last_modified: res.lastModified,
        content_type: res.contentType
      };

      callback(null, new (cloudfiles.StorageObject)(self, file));
    });
  });
};

Cloudfiles.prototype.addFile = function (container, file, local, callback) {
  var options = {
    method: 'PUT',
    client: this,
    uri: this.storageUrl(container, file),
    filename: local,
    contentType: cloudfiles.mime.type(file)
  };
  
  utils.rackspaceCurl(options, callback, function (body, res) {
    callback(null, true);
  });
};

Cloudfiles.prototype.destroyFile = function (container, file, callback) {
  utils.rackspace('DELETE', this.storageUrl(container, file), this, function (body, res) {
    callback(null, true);
  });
};

//
// function storageUrl (path, to, resource)
//   Helper method that concats the string params into a url
//   to request against the authenticated node-cloudfiles
//   storageUrl. 
//
Cloudfiles.prototype.storageUrl = function () {
  var args = Array.prototype.slice.call(arguments),
      json = (typeof(args[args.length - 1]) === 'boolean') && args.pop();
  
  return [this.config.storageUrl].concat(args).join('/') + (json ? '?format=json' : '');
};

//
// function cdnUrl (path, to, resource)
//   Helper method that concats the string params into a url
//   to request against the authenticated node-cloudfiles cdnUrl. 
//
Cloudfiles.prototype.cdnUrl = function () {
  var args = Array.prototype.slice.call(arguments),
      json = (typeof(args[args.length - 1]) === 'boolean') && args.pop();
  
  return [this.config.cdnUrl].concat(args).join('/') + (json ? '?format=json' : '');
};
