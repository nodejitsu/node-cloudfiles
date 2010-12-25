# node-cloudfiles

A client implementation for Rackspace CloudFiles in node.js

## Installation

### Installing npm (node package manager)
<pre>
  curl http://npmjs.org/install.sh | sh
</pre>

### Installing node-cloudfiles
<pre>
  npm install cloudfiles
</pre>

### [Getting Rackspace Account][4]

## Usage

The node-cloudfiles library is compliant with the [Rackspace CloudFiles API][0]. Using node-cloudfiles is easy for a variety of scenarios: authenticating, creating and working with both containers and storage objects.

### Getting Started
Before we can do anything with cloudfiles, we have to create a client with valid credentials. Cloudfiles will authenticate for you automatically: 
<pre>
  var cloudfiles = require('cloudfiles');
  var config = {
    auth : {
      username: 'your-username',
      apiKey: 'your-api-key'
    }
  };
  var client = cloudfiles.createClient(config);
</pre>

### Working with Containers
Rackspace Cloudfiles divides files into 'Containers'. These are very similar to S3 Buckets if you are more familiar with Amazon. There are a couple of simple operations exposed by node-cloudfiles:

<pre>
  // Creating a container
  client.createContainer({ name: 'myContainer' }, function (err, container) {
    // Listing files in the Container 
    container.getFiles(function (err, files) {
      
    });
  });
</pre>

### Uploading and Downloading Files
Each Container has a set of 'StorageObjects' (or files) which can be retrieved via a Cloudfiles client. Files are downloaded to a local file cache that can be configured per client.

<pre>
  // Uploading a file
  client.addFile('myContainer', 'remoteName.txt', 'path/to/local/file.txt', function (err, uploaded) {
    // File has been uploaded
  });
  
  // Downloading a file
  client.getFile('myContainer', 'remoteName.txt', function (err, file) {
    // File has been downloaded
    
    // Save it to a location outside the cache
    file.save({ local: 'path/to/local/file.txt' }, function (err, filename) {
      // File has been saved.
    });
    
  });
</pre>

## Roadmap

1. Implement Storage Object metadata APIs.  

## Run Tests
All of the node-cloudservers tests are written in [vows][2], and cover all of the use cases described above. You will need to add your Rackspace API username and API key to test/data/test-config.json before running tests:
<pre>
  {
    "auth": {
      "username": "your-username",
      "apiKey": "your-apikey"
    }
  }
</pre>

Once you have valid Rackspace credentials you can run tests with [vows][2]:
<pre>
  vows test/*-test.js --spec
</pre>

#### Author: [Charlie Robbins](http://www.charlierobbins.com)
#### Contributors: [Fedor Indutny](http://github.com/donnerjack13589)

[0]: http://docs.rackspacecloud.com/files/api/cf-devguide-latest.pdf
[1]: http://nodejitsu.com
[2]: http://vowsjs.org
[3]: http://blog.nodejitsu.com/nodejs-cloud-server-in-three-minutes
[4]: http://www.rackspacecloud.com/1469-0-3-13.html