#!/usr/bin/env node

const program = require('commander');
const fs = require('fs');
const path = require('path');
const colors = require('colors');
const cmp = require('../app/cmp');

const outputError = (err) => {
  let msg;
  if (typeof err === 'object') {
    msg = err.message;
    if (process.env.DEBUG === '1') console.log(err.stack);
  } else {
    msg = err;
  }
  console.error(colors.red(msg));
  process.exit(1);
};

const output = (txt, exit, noNewLine) => {
  if (txt && !noNewLine) console.log(txt);
  else if (txt && noNewLine) process.stdout.write(txt);
  if (exit) process.exit(0);
};

program
  .version(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json')).toString('utf8')).version, '-v, --version')
  .usage('[options] sourcePath destinationPath')
  .option('-l, --level <number>', 'compression level [1-3], 3 being the hardest', val => parseInt(val, 10), 2)
  .option('-f, --force', 'compress all found files, even without changes')
  .parse(process.argv);

if (program.level < 1) program.level = 1;
else if (program.level > 3) program.level = 3;
if (!program.force) program.force = false;

if (program.args.length !== 2) {
  program.outputHelp();
  output(null, true);
}

let source = program.args[0];
let dest = program.args[1];
try {
  if (!fs.statSync(source).isDirectory()) {
    outputError('Source path is not a directory');
  }
} catch (e) {
  outputError('Source path is not existing');
}

source = path.resolve(source);
dest = path.resolve(dest);

cmp(source, dest, program.level, program.force, output, outputError);
