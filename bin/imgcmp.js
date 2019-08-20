#!/usr/bin/env node

const program = require('commander');
const fs = require('fs');
const path = require('path');
const colors = require('colors');
const cmp = require('../app/cmp');
const paths = require('../app/paths');

/**
 * @param {String|Object} err
 */
const outputError = (err) => {
  let msg;
  if (typeof err === 'object') {
    msg = err.message;
    if (process.env.DEBUG === '1') console.log(err.stack);
  } else {
    msg = err;
  }
  console.log('');
  console.error(colors.red(msg));
  process.exit(1);
};

/**
 * @param {String} txt
 * @param {Boolean} [exit]
 * @param {Boolean} [noNewLine]
 */
const output = (txt, exit, noNewLine) => {
  if (txt && !noNewLine) console.log(txt);
  else if (txt && noNewLine) process.stdout.write(txt);
  if (exit) process.exit(0);
};

program
  .version(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json')).toString('utf8')).version, '-v, --version')
  .usage('[options] path')
  .option('-l, --level <number>', 'compression level [1-3], 3 being the hardest', val => parseInt(val, 10), 2)
  .option('-d, --date', 'restore mod & change date')
  .parse(process.argv);

if (program.level < 1) program.level = 1;
else if (program.level > 3) program.level = 3;
if (!program.date) program.date = false;

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

const dir = path.resolve(p);

output(`Directory: ${dir}`);
output(`Compression Level: ${program.level}`);
output(`Restore dates: ${program.date}`);

paths(dir).then((files) => {
  if (!files.length) {
    outputError('No files found (jpg, jpeg, png, svg)');
  } else {
    output(`${files.length} files found`);
    cmp(files, program.level, program.date, output, outputError);
  }
}).catch(outputError);
