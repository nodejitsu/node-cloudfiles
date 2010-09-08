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
    
    callback(null, res);
  });
};