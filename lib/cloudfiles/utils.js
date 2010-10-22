/*
 * core.js: Core functions for accessing Rackspace CloudFiles
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

require.paths.unshift(require('path').join(__dirname, '..'));

var cloudfiles = require('cloudfiles'),
    sys = require('sys'),
    url = require('url'),
    fs = require('fs'),
    eyes = require('eyes'),
    http = require('http'),
    spawn = require('child_process').spawn,
    exec = require('child_process').exec,
    request = require('request');

var utils = exports;

// Failure HTTP Response codes based
// off Rackspace CloudFiles specification.
var failCodes = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Resize not allowed",
  404: "Item not found",
  409: "Build in progress",
  413: "Over Limit",
  415: "Bad Media Type",
  500: "Fault",
  503: "Service Unavailable"
};

// Export the set of Failure Codes
utils.failCodes = failCodes;

// Success HTTP Response codes based
// off Rackspace CloudFiles specification.
var successCodes = {
  200: "OK",
  202: "Accepted",
  203: "Non-authoritative information",
  204: "No content",
};

// Export the set of Success Codes
utils.successCodes = successCodes;

// 
// Checks if a directory exists. If not, creates that directory
//
utils.statOrMkdir = function (path, callback) {
  fs.stat(path, function (err, stats) {
    if (err) {
      fs.mkdir(path, 0755, function (err) {
        if (err) {
          callback(err);
          return;
        }
        
        callback(null, path);
      });
      return;
    }
    
    callback(null, path);
  });
}
 
//
// Core method that actually sends requests to Rackspace.
// This method is designed to be flexible w.r.t. arguments 
// and continuation passing given the wide range of different
// requests required to fully implement the CloudFiles API.
// 
// Continuations: 
//   1. 'callback': The callback passed into every node-cloudfiles method
//   2. 'success':  A callback that will only be called on successful requests.
//                  This is used throughout node-cloudfiles to conditionally
//                  do post-request processing such as JSON parsing.
//
// Possible Arguments (1 & 2 are equivalent):
//   1. utils.rackspace('some-fully-qualified-url', callback, success)
//   2. utils.rackspace('GET', 'some-fully-qualified-url', callback, success)
//   3. utils.rackspace('DELETE', 'some-fully-qualified-url', callback, success)
//   4. utils.rackspace({ method: 'POST', uri: 'some-url', body: { some: 'body'} }, callback, success)
//
utils.rackspace = function () {
  var args = Array.prototype.slice.call(arguments),
      success = (typeof(args[args.length - 1]) === 'function') && args.pop(),
      callback = (typeof(args[args.length - 1]) === 'function') && args.pop(),
      uri, method, requestBody, responseBodyStream, headers = {};
      
  // Now that we've popped off the two callbacks
  // We can make decisions about other arguments
  if (args.length == 1) {
    
    if(typeof args[0] === 'string') {
      // If we got a string assume that it's the URI 
      method = 'GET';
      uri = args[0];
    }
    else {
      method = args[0]['method'] || 'GET';
      uri = args[0]['uri'];
      requestBody = args[0]['body'];
      headers = args[0]['headers'] || {};
      responseBodyStream = args[0]['responseBodyStream'] || null;
    }
  }
  else {
    method = args[0];
    uri = args[1];
  }
  
  // Append the X-Auth-Token header for Rackspace authentication
  headers['X-AUTH-TOKEN'] = cloudfiles.config.authToken;

  var serverOptions = {
    uri: uri,
    method: method,
    headers: headers
  };
  
  if (typeof requestBody !== 'undefined' && !serverOptions.headers['Content-Type']) {
    serverOptions.headers['Content-Type'] = 'application/json';
    serverOptions.body = JSON.stringify(requestBody);
  } 
  else if (typeof requestBody !== 'undefined') {
    serverOptions.body = requestBody;
  }
  
  if (responseBodyStream) {
    serverOptions.responseBodyStream = responseBodyStream;
  }
  
  request(serverOptions, function (err, res, body) {
    if (err) {
      if (callback) {
        callback(err);
      }
      return;
    }
    
    var statusCode = res.statusCode.toString();
    if (Object.keys(failCodes).indexOf(statusCode) !== -1) {
      if (callback) {
        callback(new Error('Rackspace Error (' + statusCode + '): ' + failCodes[statusCode]));
      }
      return;
    }

    success(body, res);
  });
};

var contentTypeOptions = '-i -H "Content-Type: {{content-type}}" ',
    authTokenOptions   = '-i -H "X-AUTH-TOKEN:{{auth-token}}" ',
    curlOptions        = '-X {{method}} {{uri}}',
    fileOptions        = '-T {{filename}} ';

utils.rackspaceCurl = function (options, callback, success) {
  var command = 'curl ', error = '', data = '';
  if (options.contentType) {
    command += contentTypeOptions.replace('{{content-type}}', options.contentType);
  }
  
  if (options.filename) {
    command += fileOptions.replace('{{filename}}', options.filename);
  }
  
  command += authTokenOptions.replace('{{auth-token}}', cloudfiles.config.authToken);
  command += curlOptions.replace('{{method}}', options.method).replace('{{uri}}', options.uri);

  var child = exec(command, function (error, stdout, stderr) {
    if (error) {
      callback(error);
    }
    
    try {
      var statusCode = stdout.match(/HTTP\/1.1\s(\d+)/)[1];
      if (Object.keys(failCodes).indexOf(statusCode.toString()) !== -1) {
        callback(new Error('Rackspace Error (' + statusCode + '): ' + failCodes[statusCode]));
        return;
      }
    
      success(null, { statusCode: statusCode });
    }
    catch (ex) {
      callback(ex); 
    }
  });
};

//
// Helper method that concats the string params into a url
// to request against the authenticated node-cloudfiles
// storageUrl. 
//
utils.storageUrl = function () {
  var args = Array.prototype.slice.call(arguments),
      json = (typeof(args[args.length - 1]) === 'boolean') && args.pop();
  
  return [cloudfiles.config.storageUrl].concat(args).join('/') + (json ? '?format=json' : '');
};

//
// Helper method that concats the string params into a url
// to request against the authenticated node-cloudfiles
// cdnUrl. 
//
utils.cdnUrl = function () {
  var args = Array.prototype.slice.call(arguments),
      json = (typeof(args[args.length - 1]) === 'boolean') && args.pop();
  
  return [cloudfiles.config.cdnUrl].concat(args).join('/') + (json ? '?format=json' : '');
};