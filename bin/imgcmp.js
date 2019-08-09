#!/usr/bin/env node

const program = require('commander');
const fs = require('fs');
const path = require('path');
const colors = require('colors');
const cmp = require('../app/cmp');

/**
 * @param {String} txt
 */
const outputError = (txt) => {
  console.error(colors.red(txt));
  process.exit(1);
};

/**
 * @param {String} txt
 * @param {Boolean} [exit]
 */
const output = (txt, exit) => {
  if (txt) console.log(txt);
  if (exit) process.exit(0);
};

program
  .version(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json')).toString('utf8')).version, '-v, --version')
  .usage('[options] path')
  .option('-l, --level [value]', 'compression level [1-3], 3 being the hardest', parseInt, 2)
  .parse(process.argv);

if (program.level < 1) program.level = 1;
else if (program.level > 3) program.level = 3;

if (program.args.length !== 1) {
  program.outputHelp();
  output(null, true);
}

const p = program.args[0];
try {
  if (!fs.statSync(p).isDirectory()) {
    outputError('Path is not a directory');
  }
} catch (e) {
  outputError('Path is not existing');
}

cmp(path.resolve(p), program.level, output, outputError);
