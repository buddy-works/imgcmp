#!/usr/bin/env node

const program = require('commander');
const fs = require('fs');
const path = require('path');

program
  .version(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json')).toString('utf8')).version, '-v, --version')
  .usage('[options] path')
  .option('-l, --level [value]', 'compression level [1-3], 3 being the hardest', parseInt, 2)
  .parse(process.argv);

if (program.level < 1) program.level = 1;
else if (program.level > 3) program.level = 3;

if (program.args.length !== 1) {
  console.error('Wrong number of parameters');
  process.exit(1);
}

const p = program.args[0];
try {
  if (!fs.statSync(p).isDirectory()) {
    console.error('Path is not a directory');
    process.exit(1);
  }
} catch (e) {
  console.error('Path is not existing');
  process.exit(1);
}

console.log('level', program.level);
console.log('dir', p);
