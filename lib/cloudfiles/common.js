/*
 * core.js: Core functions for accessing Rackspace CloudFiles
 *
 * (C) 2010 Nodejitsu Inc.
 * MIT LICENSE
 *
 */

var fs = require('fs'),
    http = require('http'),
    https = require('https'),
    url = require('url'),
    mkdirpSync = require('../../vendor/mkdirp').mkdirpSync,
    request = require('request'),
    cloudfiles = require('../cloudfiles');

var common = exports;

//
// Failure HTTP Response codes based
// off Rackspace CloudFiles specification.
//
var failCodes = common.failCodes = {
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

//
// Success HTTP Response codes based
// off Rackspace CloudFiles specification.
//
var successCodes = common.successCodes = {
  200: "OK",
  202: "Accepted",
  203: "Non-authoritative information",
  204: "No content",
};

// 
// ### function statOrMkDirp (path)
// #### @path {string} Path to validate or create.
// Checks if a directory exists. If not, creates that directory
//
common.statOrMkdirp = function (path) {
  try { fs.statSync(path) }
  catch (ex) { mkdirpSync(path, 0755) }
  
  return path;
};

//
// ### function clone (obj)
// #### @obj {Object} Object to clone.
// Clones the specified object, `obj`.
//
common.clone = function (obj) {
  var clone = {};
  for (var i in obj) {
    clone[i] = obj[i];
  }
  return clone;
};

//
// ### function mixin (target, [source1,] [source2,])
// #### @target {Object} Target object to mixin to
// Mixes in the arguments to the `target` object.
//
common.mixin = function (target) {
  var objs = Array.prototype.slice.call(arguments, 1);
  objs.forEach(function (o) {
    Object.keys(o).forEach(function (k) {
      if (! o.__lookupGetter__(k)) {
        target[k] = o[k];
      }
    });
  });

  return target;
};

 
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
//   1. common.rackspace('some-fully-qualified-url', client, callback, success)
//   2. common.rackspace('GET', 'some-fully-qualified-url', client, callback, success)
//   3. common.rackspace('DELETE', 'some-fully-qualified-url', client, callback, success)
//   4. common.rackspace({ method: 'POST', uri: 'some-url', client: new Cloudfiles(), body: { some: 'body'} }, callback, success)
//
common.rackspace = function () {
  var args = Array.prototype.slice.call(arguments),
      success = (typeof(args[args.length - 1]) === 'function') && args.pop(),
      callback = (typeof(args[args.length - 1]) === 'function') && args.pop(),
      options = { headers: {} },
      client,
      download,
      upload,
      rstream;
      
  //
  // Now that we've popped off the two callbacks
  // We can make decisions about other arguments
  //
  if (args.length == 1) {  
    client          = args[0]['client'];
    options.headers = args[0]['headers'] || {};
    options.method  = args[0]['method']  || 'GET';
    options.body    = args[0]['body'];
    options.uri     = args[0]['uri'];
    
    //
    // Attempt to grab the `upload` or `download` streams
    // (if they exist).
    //
    upload   = args[0].upload;
    download = args[0].download;
  }
  else if (args.length === 2) {
    //
    // If we got a string assume that it's the URI 
    //
    client         = args[1];
    options.method = 'GET';
    options.uri    = args[0];
  }
  else {
    client         = args[2];
    options.method = args[0];
    options.uri    = args[1];
  }
  
  if (!client.authorized) {
    return callback(new Error('Cannot make Rackspace request if not authorized'));
  }
  
  //
  // Append the `x-auth-token` header for Rackspace authentication
  //
  options.headers['x-auth-token'] = client.config.authToken;

  //
  // If no `content-type` header has been sent then assume JSON.
  //
  if (typeof options.body !== 'undefined' && !options.headers['content-type']) {
    options.headers['content-type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  } 
  
  if (upload) {
    if (!options.headers['content-length']) {
      options.headers['transfer-encoding'] = 'chunked';
    }
  }
  
  rstream = request(options, function (err, res, body) {
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
  
  if (upload) {
    upload.pipe(rstream);
  }
  else if (download) {
    rstream.pipe(download);
  }
  
  return rstream;
};

// Runs a array of functions with callback argument
// And calls finish at the end of execution
common.runBatch = function (fns, finish) {
  var finished = 0,
      total = fns.length,
      errors = new Array(total),
      was_error = false,
      results = new Array(total);
      
  fns.forEach(function (fn, i) {
    var once = false;
    
    function next(err, value) {
      // Can be called only one time
      if (once) {
        return;      
      }
      
      once = true;
      
      // If have error - push them into errors
      if (err) {
        was_error = true;
        errors[i] = err;
      } 
      else {
        results[i] = value;
      }
            
      if (++finished === total) {
        finish(was_error ? errors : null, results);
      }
    }
    
    var value = fn(next);

    // If function returns value - it won't be working in async mode
    if (value !== undefined) {
      next(null, value);
    }
  });
  
  if (fns.length === 0) {
    finish(null, []);
  }
};
