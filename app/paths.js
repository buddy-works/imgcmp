const fs = require('fs');
const path = require('path');

const isImg = p => /\.(jpg|jpeg|png|svg)$/i.test(p);

const isJpg = p => /\.(jpg|jpeg)$/i.test(p);

const isPng = p => /\.png$/i.test(p);

const isSvg = p => /\.svg$/i.test(p);

const getFileInfo = name => new Promise((resolve, reject) => {
  fs.stat(name, (err, info) => {
    if (err) reject(err);
    else {
      resolve({
        name,
        isJpg: isJpg(name),
        isPng: isPng(name),
        isSvg: isSvg(name),
        size: info.size,
        modTime: info.mtime,
        changeTime: info.ctime,
        accessTime: info.atime,
      });
    }
  });
});

const getPaths = dir => new Promise((resolve, reject) => {
  fs.readdir(dir, {
    withFileTypes: true,
  }, (err, paths) => {
    if (err) reject(err);
    else {
      const promises = [];
      for (let i = 0; i < paths.length; i += 1) {
        const p = paths[i];
        const name = path.join(dir, p.name);
        if (p.isDirectory()) {
          promises.push(getPaths(name));
        } else if (p.isFile() && isImg(name)) {
          promises.push(getFileInfo(name));
        }
      }
      Promise.all(promises).then((arr) => {
        let result = [];
        for (let i = 0; i < arr.length; i += 1) {
          const item = arr[i];
          if (typeof item === 'string') result.push(item);
          else result = result.concat(item);
        }
        resolve(result);
      }).catch(reject);
    }
  });
});

module.exports = getPaths;
