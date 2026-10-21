'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const files = require('./public-files.cjs');
for (const file of files) {
  if (!fs.statSync(path.join(root, file)).isFile()) throw new Error(`Missing public file: ${file}`);
}
const scripts = [...files.filter(file => file.endsWith('.js')), ...fs.readdirSync(__dirname).filter(file => file.endsWith('.cjs')).map(file => `scripts/${file}`)];
for (const file of scripts) {
  const result = spawnSync(process.execPath, ['--check', path.join(root,file)], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${file}: ${result.stderr}`);
}
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  const value = match[1];
  if (!value.startsWith('#') && !value.startsWith('data:') && !files.includes(value)) throw new Error(`Unlisted public resource: ${value}`);
}
console.log(`Check passed: ${files.length} public files, ${scripts.length} JavaScript syntax checks, local resource references.`);
