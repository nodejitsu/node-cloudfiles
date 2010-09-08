/*
 * cloudfiles.js: Wrapper for node-cloudfiles object
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */
 
var cloudfiles = exports;

// Core
cloudfiles.setAuth      = require('cloudfiles/core').setAuth;
cloudfiles.config       = require('cloudfiles/config').config;
