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
function validStaticMailto(value) {
  if (!value.startsWith('mailto:')) return false;
  const address = value.slice(7);
  // Deliberately narrow: one plain ASCII address, with no encoded characters,
  // URI query, fragment, controls, whitespace, or recipient/header separators.
  if (address.length > 254 || !/^[a-z0-9._+-]+@[a-z0-9.-]+$/i.test(address)) return false;
  const [local, domain] = address.split('@');
  if (local.length > 64 || local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  const labels = domain.split('.');
  return labels.length > 1 && labels.every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label));
}
for (const match of html.matchAll(/\b(src|href)="([^"]+)"/g)) {
  const [, attribute, value] = match;
  if (attribute === 'href' && validStaticMailto(value)) continue;
  if (!value.startsWith('#') && value !== 'data:,' && !files.includes(value)) throw new Error(`Unlisted public resource: ${value}`);
}
console.log(`Check passed: ${files.length} public files, ${scripts.length} JavaScript syntax checks, local resource references.`);
