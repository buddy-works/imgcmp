const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const imageminGifsicle = require('imagemin-gifsicle');
const imageminSvgo = require('imagemin-svgo');
const fs = require('fs-extra');
const crypto = require('crypto');
const path = require('path');
const Meta = require('./meta');
const paths = require('../app/paths');

let pluginPng;
let pluginJpg;
let pluginGif;
let pluginSvg;

// save file content to disc
const saveFile = (name, buffer) => new Promise((resolve, reject) => {
  fs.ensureDir(path.dirname(name))
    .then(() => {
      fs.writeFile(name, buffer, (err) => {
        if (err) reject(err);
        else resolve();
      });
    }).catch(reject);
});

// PNG
const getPluginPng = (level) => {
  if (!pluginPng) {
    let quality = [0.8, 0.9];
    if (level >= 3) quality = [0.4, 0.5];
    else if (level >= 2) quality = [0.6, 0.7];
    pluginPng = imageminPngquant({
      quality,
    });
  }
  return pluginPng;
};

// GIF
const getPluginGif = (level) => {
  if (!pluginGif) {
    let colors = 256;
    if (level >= 3) colors = 128;
    else if (level >= 2) colors = 192;
    pluginGif = imageminGifsicle({
      optimizationLevel: level,
      colors,
    });
  }
  return pluginGif;
};

// SVG
const getPluginSvg = () => {
  if (!pluginSvg) {
    pluginSvg = imageminSvgo();
  }
  return pluginSvg;
};

// JPG
const getPluginJpg = (level) => {
  if (!pluginJpg) {
    let quality = 80;
    if (level >= 3) quality = 40;
    else if (level >= 2) quality = 60;
    pluginJpg = imageminMozjpeg({
      quality,
    });
  }
  return pluginJpg;
};

// compress file using imagemin & plugins
const min = (level, name) => new Promise((resolve, reject) => {
  imagemin([name], {
    glob: false,
    plugins: [
      getPluginSvg(),
      getPluginJpg(level),
      getPluginGif(level),
      getPluginPng(level),
    ],
  }).then((result) => {
    if (result && result.length > 0) resolve(result[0].data);
    else resolve();
  }).catch(reject);
});

const getSha1AndSize = filePath => new Promise((resolve, reject) => {
  const rs = fs.createReadStream(filePath);
  const sha1 = crypto.createHash('sha1');
  let size = 0;
  rs.on('error', reject);
  rs.on('data', (data) => {
    size += data.length;
    sha1.update(data);
  });
  rs.on('close', () => {
    resolve({
      hash: sha1.digest('hex'),
      size,
    });
  });
});

// compress file
const cmpFile = (meta, source, dest, level, force, fileData) => new Promise((resolve, reject) => {
  // first get sha1 & size of file
  getSha1AndSize(fileData.name)
    .then((obj) => {
      // if we didnt force compression and file didnt changed - move on
      if (!force && !meta.hasFileChanged(fileData.shortName, obj.hash)) {
        resolve(0);
        return;
      }
      // compress
      min(level, fileData.name).then((buffer) => {
        if (!buffer) {
          resolve(-1);
          return;
        }
        const newSize = buffer.length;
        // count percent of change
        const percent = !obj.size ? 0 : Math.round((obj.size - newSize) / obj.size * 100);
        // save to disc
        saveFile(path.join(dest, fileData.shortName), buffer)
          .then(() => {
            // save to meta
            meta.saveFile(fileData.shortName, obj.hash);
            resolve(percent);
          }).catch(reject);
      }).catch(reject);
    }).catch(reject);
});

const timeStart = () => process.hrtime();

const timeEnd = (ts) => {
  const hr = process.hrtime(ts);
  return Math.round((hr[0] + hr[1] / 1000000000) * 1000);
};

const ensureDest = (dest, force) => new Promise((resolve, reject) => {
  if (force) fs.emptyDir(dest).then(resolve).catch(reject);
  else fs.ensureDir(dest).then(resolve).catch(reject);
});

const getAllowedTypes = (types) => {
  const all = {
    jpg: true,
    png: true,
    gif: true,
    svg: true,
  };
  let r = [];
  for (let i = 0; i < types.length; i += 1) {
    const t = types[i];
    if (all[t]) {
      r.push(t);
      all[t] = false;
    }
  }
  if (!r.length) r = Object.keys(all);
  return r;
};

const getImageTester = (types) => {
  for (let i = 0; i < types.length; i += 1) {
    if (types[i] === 'jpg') {
      types.push('jpeg');
      break;
    }
  }
  const r = new RegExp(`\\.(${types.join('|')})$`, 'i');
  return p => r.test(p);
};

const cmp = (source, dest, level, force, types, output, outputError) => {
  const allowedTypes = getAllowedTypes(types);
  const meta = new Meta(dest);
  const isMetaNew = meta.isNew();
  const isMetaChangedLevel = meta.saveLevel(level);
  const isMetaChangedSource = meta.saveSource(source);
  if (isMetaNew) {
    force = true;
    output('First time running');
  } else if (isMetaChangedLevel) {
    force = true;
    output('Changing level of compression - forcing refresh all');
  } else if (isMetaChangedSource) {
    force = true;
    output('Changing source path - forcing refresh all');
  }
  output(`Source: ${source}`);
  output(`Destination: ${dest}`);
  output(`Compression Level: ${level}`);
  output(`Types: ${allowedTypes}`);
  output(`Force: ${force}`);

  const wholeStart = timeStart();
  // get image tester
  const isImg = getImageTester(allowedTypes);
  // ensure dest exists
  ensureDest(dest, force).then(() => {
    // get files
    paths(source, isImg, (fileData, done) => {
      // try to compress each file found
      cmpFile(meta, source, dest, level, force, fileData).then((percent) => {
        let changes = `-${percent}%`;
        if (percent === 0) changes = 'no changes';
        else if (percent < 0) changes = 'ignored';
        output(`${fileData.shortName} ${changes}`);
        done();
      }).catch(outputError);
    }).then(() => {
      // save meta changes to disc
      meta.saveChanges().then(() => {
        const wholeTime = timeEnd(wholeStart);
        output(`Finished in ${wholeTime}ms`, true);
      }).catch(outputError);
    }).catch(outputError);
  }).catch(outputError);
};

module.exports = cmp;
