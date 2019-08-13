const async = require('async');
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const imageminGiflossy = require('imagemin-giflossy');
const imageminSvgo = require('imagemin-svgo');
const fs = require('fs');
const { exec } = require('child_process');

let pluginPng;
let pluginJpg;
let pluginGif;
let pluginSvg;

const saveFile = (name, buffer) => new Promise((resolve, reject) => {
  fs.writeFile(name, buffer, (err) => {
    if (err) reject(err);
    else resolve();
  });
});

const setSystemTime = datetime => new Promise((resolve, reject) => {
  exec(`date --set="${datetime}"`, (err) => {
    if (err) reject(err);
    else resolve();
  });
});

const fixTimes = (name, changeTime, modTime, accessTime) => new Promise((resolve, reject) => {
  setSystemTime(changeTime.toISOString())
    .then(() => {
      fs.utimes(name, accessTime, modTime, (err) => {
        if (err) reject(err);
        else resolve();
      });
    }).catch(reject);
});

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

const cmpPng = (level, name) => new Promise((resolve) => {
  imagemin([name], {
    plugins: [
      getPluginPng(),
    ],
  }).then((result) => {
    resolve(result[0].data);
  });
});

const getPluginGif = (level) => {
  if (!pluginGif) {
    let lossy = 20;
    if (level >= 3) lossy = 200;
    else if (level >= 2) lossy = 100;
    pluginGif = imageminGiflossy({
      lossy,
    });
  }
  return pluginGif;
};

const cmpGif = (level, name) => new Promise((resolve) => {
  imagemin([name], {
    plugins: [
      getPluginGif(level),
    ],
  }).then((result) => {
    resolve(result[0].data);
  });
});

const getPluginSvg = () => {
  if (!pluginSvg) {
    pluginSvg = imageminSvgo();
  }
  return pluginSvg;
};

const cmpSvg = (level, name) => new Promise((resolve) => {
  imagemin([name], {
    plugins: [
      getPluginSvg(),
    ],
  }).then((result) => {
    resolve(result[0].data);
  });
});

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

const cmpJpg = (level, name) => new Promise((resolve) => {
  imagemin([name], {
    plugins: [
      getPluginJpg(level),
    ],
  }).then((result) => {
    resolve(result[0].data);
  });
});

const cmpFile = (level, data) => new Promise((resolve, reject) => {
  let p;
  let newSize;
  if (data.isJpg) p = cmpJpg(level, data.name);
  else if (data.isPng) p = cmpPng(level, data.name);
  else if (data.isGif) p = cmpGif(level, data.name);
  else if (data.isSvg) p = cmpSvg(level, data.name);
  else {
    reject(new Error('Wrong file type'));
    return;
  }
  p.then((buffer) => {
    newSize = buffer.length;
    const percent = Math.round((data.size - newSize) / data.size * 100);
    if (percent <= 0) {
      resolve(percent);
      return;
    }
    saveFile(data.name, buffer)
      .then(() => fixTimes(data.name, data.changeTime, data.modTime, data.accessTime))
      .then(() => resolve(percent))
      .catch(reject);
  });
});

const cmp = (files, level, output, outputError) => {
  const start = Date.now();
  const hrstart = process.hrtime();
  async.eachSeries(files, (data, cb) => {
    output(`${data.name}...`, false, true);
    const startFile = Date.now();
    cmpFile(level, data).then((percent) => {
      const time = Date.now() - startFile;
      let changes = `${percent}%`;
      if (percent <= 0) changes = 'no changes';
      output(`done in ${time}ms (${changes})`);
      cb();
    }).catch(cb);
  }, (err) => {
    if (err) {
      outputError(err);
      return;
    }
    const hrend = process.hrtime(hrstart);
    const ms = hrend[0] + hrend[1] / 1000000;
    setSystemTime(new Date(start + ms))
      .then(() => {
        output(`Finished in ${ms}ms`, true);
      })
      .catch((err2) => {
        outputError(err2, true);
      });
  });
};

module.exports = cmp;
