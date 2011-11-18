# node-cloudfiles

A client implementation for Rackspace CloudFiles in node.js

## Installation

### Installing npm (node package manager)
``` bash
  $ curl http://npmjs.org/install.sh | sh
```

### Installing node-cloudfiles
``` bash
  $ npm install cloudfiles
```

### [Getting Rackspace Account][4]

## Usage

The node-cloudfiles library is compliant with the [Rackspace CloudFiles API][0]. Using node-cloudfiles is easy for a variety of scenarios: authenticating, creating and working with both containers and storage objects.

### Getting Started
Before we can do anything with cloudfiles, we have to create a client with valid credentials. Cloudfiles will authenticate for you automatically: 

``` js 
  var cloudfiles = require('cloudfiles');
  var config = {
    auth : {
      username: 'your-username',
      apiKey: 'your-api-key'
    }
  };
  
  var client = cloudfiles.createClient(config);
```

### Working with Containers
Rackspace Cloudfiles divides files into 'Containers'. These are very similar to S3 Buckets if you are more familiar with Amazon. There are a couple of simple operations exposed by node-cloudfiles:

``` js 
  // Creating a container
  client.setAuth(function () {
    client.createContainer('myContainer', function (err, container) {
      // Listing files in the Container 
      container.getFiles(function (err, files) {

      });
    });
  });
```

### Uploading and Downloading Files
Each Container has a set of 'StorageObjects' (or files) which can be retrieved via a Cloudfiles client. Files are downloaded to a local file cache that can be configured per client.

``` js 
  client.createContainer('myContainer', function (err, container) {
    //
    // Uploading a file
    //
    client.addFile('myContainer', { remote: 'remoteName.txt', local: 'path/to/local/file.txt' }, function (err, uploaded) {
      // File has been uploaded
    });
  
    //
    // Downloading a file
    //
    client.getFile('myContainer', 'remoteName.txt', function (err, file) {
      //
      // Save it to a location outside the cache
      //
      file.save({ local: 'path/to/local/file.txt' }, function (err, filename) {
        //
        // File has been saved.
        //
      });
    });
  });
```

## Authentication Service

Use the 'host' key in the auth configuration to specify the url to use for authentication:

``` js 
  var cloudfiles = require('cloudfiles');
  var config = {
    auth : {
      username: 'your-username',
      apiKey: 'your-api-key',
      host : "lon.auth.api.rackspacecloud.com"
    }
  };

  var client = cloudfiles.createClient(config);
``` 

## Transfer over ServiceNet

Rackspace Cloud Servers have a private interface, known as ServiceNet, that is unmetered and has double the throughput of the public interface.  When transferring files between a Cloud Server and Cloud Files, ServiceNet can be used instead of the public interface.

By default, ServiceNet is not used.  To use ServiceNet for the transfer, set the 'servicenet' key to `true` in your client config:

``` js 
  var cloudfiles = require('cloudfiles');
  var config = {
    auth : {
      username: 'your-username',
      apiKey: 'your-api-key',
      host : "lon.auth.api.rackspacecloud.com"
    },
    servicenet: true
  };

  var client = cloudfiles.createClient(config);
``` 

NOTE: ServiceNet can only be used to transfer files between Cloud Servers and Cloud Files within the same datacenter.  Rackspace support can migrate both Cloud Servers and Cloud Files to the same datacenter if needed.

## Roadmap

1. Implement Storage Object metadata APIs.  

## Run Tests
All of the node-cloudservers tests are written in [vows][2], and cover all of the use cases described above. You will need to add your Rackspace API username and API key to test/fixtures/test-config.json before running tests:

``` js
  {
    "auth": {
      "username": "your-username",
      "apiKey": "your-apikey"
    }
  }
```

Once you have valid Rackspace credentials you can run tests with [vows][2]:

``` bash 
  vows test/*-test.js --spec
```

#### Author: [Charlie Robbins](http://www.charlierobbins.com)
#### Contributors: [Fedor Indutny](http://github.com/donnerjack13589), [aaronds](https://github.com/aaronds)

[0]: http://docs.rackspacecloud.com/files/api/cf-devguide-latest.pdf
[1]: http://nodejitsu.com
[2]: http://vowsjs.org
[3]: http://blog.nodejitsu.com/nodejs-cloud-server-in-three-minutes
[4]: http://www.rackspacecloud.com/1469-0-3-13.html
