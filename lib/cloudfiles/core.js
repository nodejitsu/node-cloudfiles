/*
 * core.js: Core functions for accessing Rackspace CloudFiles
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */
 
var http = require('http'),
    url = require('url'),
    eyes = require('eyes'),
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
};

// Remark: What about CDN Containers?
core.getContainers = function (callback) {
  utils.rackspace(utils.storageUrl(true), callback, function (body) {
    var results = [], containers = JSON.parse(body);
    containers.forEach(function (container) {
      results.push(new (cloudfiles.Container)(container));
    });
    
    callback(null, results);
  });
};

// Remark: What about CDN Containers?
core.getContainer = function (container, callback) {
  utils.rackspace('HEAD', utils.storageUrl(container), callback, function (body, res) {
    var container = {
      name: container,
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
