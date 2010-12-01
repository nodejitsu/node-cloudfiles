/*
 * cloudfiles.js: Wrapper for node-cloudfiles object
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

require.paths.unshift(__dirname); 

var cloudfiles = exports;

// Resources
cloudfiles.Config           = require('cloudfiles/config').Config;
cloudfiles.Container        = require('cloudfiles/container').Container; 
cloudfiles.StorageObject    = require('cloudfiles/storage-object').StorageObject;

// Core methods
cloudfiles.createClient     = require('cloudfiles/core').createClient;
cloudfiles.Cloudfiles       = require('cloudfiles/core').Cloudfiles;

// Mime types
cloudfiles.mime             = require('cloudfiles/mime').mime;