const fs = require('fs');
const path = require('path');
const async = require('async');

const getPaths = (dir, isImg, onFile, sourcePath) => new Promise((resolve, reject) => {
  // root dir
  let sp = sourcePath;
  if (!sp) sp = dir;
  // read dir
  fs.readdir(dir, {
    withFileTypes: true,
  }, (err, paths) => {
    if (err) reject(err);// exit with error
    else {
      // for each path in dir
      async.each(paths, (p, cb) => {
        const name = path.join(dir, p.name);
        if (p.isDirectory()) {
          // is directory - read recurrent
          getPaths(name, isImg, onFile, sp).then(cb).catch(cb);
        } else if (p.isFile() && isImg(name)) {
          // is image file - process
          onFile({
            name,
            shortName: name.replace(`${sp}${path.sep}`, ''),
          }, cb);
        } else cb();// ignore rest
      }, (err2) => {
        if (err2) reject(err2);
        else resolve();
      });
    }
  });
});

module.exports = getPaths;
