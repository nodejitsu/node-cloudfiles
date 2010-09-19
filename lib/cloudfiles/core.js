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
  utils.rackspace(utils.storageUrl(), callback, function (body) {
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
      name: name,
      count: new Number(res.headers['x-container-object-count']),
      bytes: new Number(res.headers['x-container-bytes-used'])
    };
    callback(null, new (cloudfiles.Container)(container));
  });
};

core.createContainer = function (container, callback) {
  
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
