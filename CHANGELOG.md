## ChangeLog for: node-cloudfiles

### Version 0.2.0 - 12/25/2010
- Improved test coverage
- Pushed test config out of lib/ to test/data/test-config.json

#### Breaking Changes
- cloudfiles no longer exposes methods on the module itself. Replace cloudfiles.* with client.* where var client = cloudfiles.createClient(config).