const fs = require('fs');
const path = require('path');

function Meta(dest) {
  let data;
  let isNew = true;
  const configPath = path.join(dest, '.imgcmp');

  if (fs.existsSync(configPath)) {
    try {
      // read config if exists
      data = JSON.parse(fs.readFileSync(configPath).toString('utf8'));
      isNew = false;
    } catch (e) {
      data = {};
    }
  } else data = {};

  this.hasFileChanged = (shortName, hash) => {
    if (!data[shortName]) return true;// not in meta
    return data[shortName] !== hash;// hash has changed
  };

  this.saveFile = (shortName, hash) => {
    data[shortName] = hash;
  };

  this.saveChanges = () => new Promise((resolve, reject) => {
    // save to disc
    fs.writeFile(configPath, JSON.stringify(data, null, 2), (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  this.saveSource = (sourcePath) => {
    if (data.sourcePath !== sourcePath) {
      data.sourcePath = sourcePath;
      return true;
    }
    return false;
  };

  this.saveLevel = (level) => {
    if (data.level !== level) {
      data.level = level;
      return true;
    }
    return false;
  };

  this.isNew = () => isNew;
}

module.exports = Meta;
