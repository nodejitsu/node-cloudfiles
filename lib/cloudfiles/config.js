/*
 * config.js: Configuration information for your Rackspace Cloud account
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */
 
var Config = function () {

};
 
Config.prototype = {
  // Remark: Put your Rackspace API Key here
  auth: { 
     username: 'nodejitsudev', 
     apiKey: '96d15003f9503e24a9a43ee232c2d14d'
  },
  
  cdn: {
    ttl: 43200,        // Default X-TTL time-out to 12 hours,
    logRetention: true // Default X-LOG-RETENTION to true 
  }
};

exports.config = new (Config);



