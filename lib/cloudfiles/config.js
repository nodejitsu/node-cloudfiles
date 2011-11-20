/*
 * config.js: Configuration information for your Rackspace Cloud account
 *
 * (C) 2010 Nodejitsu Inc.
 * MIT LICENSE
 *
 */

var fs = require('fs'),
    path = require('path');

var defaultAuthHost = 'auth.api.rackspacecloud.com';

//
// function createConfig (defaults) 
//   Creates a new instance of the configuration 
//   object based on default values
//
exports.createConfig = function (options) {
  return new Config(options);
};

//
// Config (defaults) 
//   Constructor for the Config object
//
var Config = exports.Config = function (options) {
  if (!options.auth) throw new Error ('options.auth is required to create Config');

  this.auth = {
    username: options.auth.username,
    apiKey: options.auth.apiKey,
    host: options.auth.host || defaultAuthHost
  };

  
  if (options.cdn) {
    this.cdn.ttl = options.cdn.ttl || this.cdn.ttl;
    this.logRetention = options.cdn.logRetention || this.cdn.logRetention;
  }
  
  var cachePath = path.join(this.cache.path, this.auth.username);
  this.cache.path = options.cache ? options.cache.cachePath || cachePath : cachePath;

  this.servicenet = options.servicenet === true;
};
 
Config.prototype = {
  cdn: {
    ttl: 43200,        // Default X-TTL time-out to 12 hours,
    logRetention: true // Default X-LOG-RETENTION to true 
  },
  cache: {
    path: path.join(__dirname, '..', '..', '.cache')
  },
  servicenet: false
};

//
// ### function setStorageUrl (storageUrl)
// ### @storageUrl {string} Rackspace Cloudfiles storage URL
// Sets the storage URL for this instance, updating to the Serive Net URL if
// Service Net transfer has been specified.
Config.prototype.setStorageUrl = function(storageUrl) {
  if (this.servicenet === true) {
    this.storageUrl = storageUrl.replace('https://', 'https://snet-');
  } else {
    this.storageUrl = storageUrl;
  }
};



