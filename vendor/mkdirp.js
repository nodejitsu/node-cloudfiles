var path = require('path');
var fs = require('fs');

exports.mkdirp = exports.mkdirP = function mkdirP (p, mode, f) {
    var cb = f || function () {};
    if (p.charAt(0) != '/') { cb(new Error('Relative path: ' + p)); return }
    
    var ps = path.normalize(p).split('/');
    path.exists(p, function (exists) {
        if (exists) cb(null);
        else mkdirP(ps.slice(0,-1).join('/'), mode, function (err) {
            if (err && err.code !== 'EEXIST') cb(err)
            else fs.mkdir(p, mode, function (err) {
                if (err && err.code !== 'EEXIST') cb(err)
                else cb()
            });
        });
    });
};

exports.mkdirpSync = exports.mkdirPSync = function mkdirPSync (p, mode) {
  if (p.charAt(0) != '/') { throw new Error('Relative path: ' + p); return; }
  
  var ps = path.normalize(p).split('/'),
      exists = path.existsSync(p);
  
  function tryMkdirSync () {
      try { fs.mkdirSync(p, mode); }
      catch (ex) { if (ex.code !== 'EEXIST') throw ex; }
  }
  
  if (exists) return;
  else {
      try { 
          mkdirPSync(ps.slice(0,-1).join('/'), mode); 
          tryMkdirSync();
      }
      catch (ex) {
        console.dir(ex);
          if (ex.code !== 'EEXIST') { throw ex; }
      } 
  }
}
