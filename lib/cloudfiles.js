/*
 * cloudfiles.js: Wrapper for node-cloudfiles object
 *
 * (C) 2010 Nodejitsu Inc.
 * MIT LICENSE
 *
 */

var cloudfiles = exports;

//
// Load package information using `pkginfo`.
//
require('pkginfo')(module, 'version');

//
// Resources
//
cloudfiles.Config           = require('./cloudfiles/config').Config;
cloudfiles.Cloudfiles       = require('./cloudfiles/core').Cloudfiles;
cloudfiles.Container        = require('./cloudfiles/container').Container;
cloudfiles.StorageObject    = require('./cloudfiles/storage-object').StorageObject;

//
// Core methods
//
cloudfiles.createClient     = require('./cloudfiles/core').createClient;
