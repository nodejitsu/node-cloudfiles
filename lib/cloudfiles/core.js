/*
 * core.js: Core functions for accessing Rackspace CloudFiles
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */
 
var http = require('http'),
    fs = require('fs'),
    path = require('path'),
    eyes = require('eyes'),
    url = require('url'),
    request = require('request'),
    utils = require('./utils');
    
require.paths.unshift(require('path').join(__dirname, '..'));

var cloudfiles = require('cloudfiles');

var core = exports;

var authUrl = 'auth.api.rackspacecloud.com';

//
// Authenticates node-cloudfiles with the specified options:
// { username: "your-username", apiKey: "your-secret-key" }
//
core.setAuth = function (options, callback) {
  var authOptions = {
    uri: 'https://' + authUrl + '/v1.0', 
    headers: {
      'HOST': authUrl,
      'X-AUTH-USER': options.username,
      'X-AUTH-KEY': options.apiKey
    }
  };
  
  utils.statOrMkdir(cloudfiles.config.cache.path, function () {
    request(authOptions, function (err, res, body) {
      if (err) {
        callback(err); 
        return;
      }

      cloudfiles.config.serverUrl = res.headers['x-server-management-url'];
      cloudfiles.config.storageUrl = res.headers['x-storage-url'];
      cloudfiles.config.cdnUrl = res.headers['x-cdn-management-url'];
      cloudfiles.config.authToken = res.headers['x-auth-token'];
      cloudfiles.config.storageToken = res.headers['x-storage-token']

      callback(null, res);
    }); 
  });  
};

core.getContainers = function () {
  var args = Array.prototype.slice.call(arguments),
      callback = (typeof(args[args.length - 1]) === 'function') && args.pop(),
      isCdn = args.length > 0 && (typeof(args[args.length - 1]) === 'boolean') && args.pop(),
      url = isCdn ? utils.cdnUrl(true) : utils.storageUrl(true);
      
  utils.rackspace(url, callback, function (body) {
    var results = [], containers = JSON.parse(body);
    containers.forEach(function (container) {
      results.push(new (cloudfiles.Container)(container));
    });
    
    callback(null, results);
  });
};

core.getContainer = function () {
  var args = Array.prototype.slice.call(arguments),
      callback = (typeof(args[args.length - 1]) === 'function') && args.pop(),
      isCdn = args.length > 0 && (typeof(args[args.length - 1]) === 'boolean') && args.pop(),
      containerName = args.pop(),
      url = isCdn ? utils.cdnUrl(containerName) : utils.storageUrl(containerName);
      
  utils.rackspace('HEAD', url, callback, function (body, res) {
    var container = {
      name: containerName,
      count: new Number(res.headers['x-container-object-count']),
      bytes: new Number(res.headers['x-container-bytes-used'])
    };
    callback(null, new (cloudfiles.Container)(container));
  });
};

core.createContainer = function (container, callback) {
  utils.rackspace('PUT', utils.storageUrl(container.name), callback, function (body, res) {
    if (typeof container.cdnEnabled !== 'undefined' && container.cdnEnabled) {
      container.ttl = container.ttl || cloudfiles.config.cdn.ttl;
      container.logRetention = container.logRetention || cloudfiles.config.cdn.logRetention;
      
      var cdnOptions = {
        uri: utils.cdnUrl(container.name),
        method: 'PUT',
        headers: {
          'X-TTL': container.ttl,
          'X-LOG-RETENTION': container.logRetention
        }
      };
      
      utils.rackspace(cdnOptions, callback, function (body, res) {
        container.cdnUri = res.headers['x-cdn-uri'];
        callback(null, new (cloudfiles.Container)(container));
      });
    }
    else {
      callback(null, new (cloudfiles.Container)(container));
    }
  });
};

core.destroyContainer = function (container, callback) {
  core.getFiles(container, function (err, files) {
    if (err) {
      callback(err);
      return;
    }
    
    // TODO: Delete all files, then delete the container
    utils.rackspace('DELETE', utils.storageUrl(container), callback, function (body, res) {
      callback(null, true);
    });
  });
};

core.getFiles = function (container, callback) {
  utils.rackspace(utils.storageUrl(container, true), callback, function (body) {
    var results = [], files = JSON.parse(body);
    files.forEach(function (file) {
      file.container = container;
      results.push(new (cloudfiles.StorageObject)(file));
    });
    callback(null, results);
  });
};

core.getFile = function (container, filename, callback) {
  var containerPath = path.join(cloudfiles.config.cache.path, container);
  
  utils.statOrMkdir(containerPath, function () {
    var cachePath = path.join(containerPath, filename);
        fileStream = fs.createWriteStream(cachePath);

    var options = {
      method: 'GET', 
      uri: utils.storageUrl(container, filename),
      responseBodyStream: fileStream
    };

    utils.rackspace(options, callback, function (body, res) {
      var file = {
        content_type: res.headers['content-type'],
        bytes: res.headers['content-length'],
        hash: res.headers['etag'],
        last_modified: res.headers['last-modified'],
        local: cachePath,
        container: container,
        name: filename
      };

      callback(null, new (cloudfiles.StorageObject)(file));
    });
  });
};

core.addFile = function (container, file, local, callback) {
  var options = {
    method: 'PUT',
    uri: utils.storageUrl(container, file),
    filename: local,
    contentType: cloudfiles.mime.type(file)
  };
  
  utils.rackspaceCurl(options, callback, function (body, res) {
    callback(null, true);
  });
};

core.destroyFile = function (container, file, callback) {
  utils.rackspace('DELETE', utils.storageUrl(container, file), function (body, res) {
    callback(null, true);
  });
};