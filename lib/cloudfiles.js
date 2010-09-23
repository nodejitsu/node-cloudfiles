/*
 * cloudfiles.js: Wrapper for node-cloudfiles object
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

require.paths.unshift(__dirname); 

var cloudfiles = exports;

// Core
cloudfiles.config          = require('cloudfiles/config').config;
cloudfiles.setAuth         = require('cloudfiles/core').setAuth;

// Containers
cloudfiles.Container       = require('cloudfiles/container').Container; 
cloudfiles.createContainer = require('cloudfiles/core').createContainer;
cloudfiles.getContainers   = require('cloudfiles/core').getContainers;
cloudfiles.getContainer    = require('cloudfiles/core').getContainer;

// Storage Object
cloudfiles.StorageObject   = require('cloudfiles/storage-object').StorageObject;
cloudfiles.getFiles        = require('cloudfiles/core').getFiles;
