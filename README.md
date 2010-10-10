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

### Authenticating
Before we can do anything with cloudfiles, we have to authenticate. Authenticating is simple:
<pre>
  var cloudfiles = require('cloudfiles');
  var example = {
    auth : {
      username: 'your-username',
      apiKey: 'your-api-key'
    }
  };
  cloudfiles.setAuth(example.auth, function () {
    // Work with Rackspace Cloudfiles from here
  });
</pre>

## Roadmap

1. Finish writing this README.md and sample usage
2. Implement Storage Object metadata APIs.  
3. Implement outgoing request pooling to increase concurrency.

## Run Tests
All of the node-cloudfiles tests are written in [vows][2], and cover all of the use cases described above.
<pre>
  vows test/*-test.js --spec
</pre>

#### Author: [Charlie Robbins](http://www.charlierobbins.com)

[0]: http://docs.rackspacecloud.com/files/api/cf-devguide-latest.pdf
[1]: http://nodejitsu.com
[2]: http://vowsjs.org
[3]: http://blog.nodejitsu.com/nodejs-cloud-server-in-three-minutes
[4]: http://www.rackspacecloud.com/1469-0-3-13.html