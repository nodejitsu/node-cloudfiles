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
     username: 'your-username', 
     apiKey: 'your-api-key'
  },
  
  cdn: {
    ttl: 43200,        // Default X-TTL time-out to 12 hours,
    logRetention: true // Default X-LOG-RETENTION to true 
  }
};

exports.config = new (Config);



