'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const files = require('./public-files.cjs');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
fs.rmSync(output, { recursive: true, force: true });
const versioned = new Map();
for (const file of files) {
  if (!/\.(?:css|js)$/.test(file)) continue;
  const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex').slice(0, 12);
  const extension = path.extname(file);
  versioned.set(file, `${file.slice(0, -extension.length)}.${hash}${extension}`);
}
for (const file of files) {
  if (file.includes('..') || path.isAbsolute(file)) throw new Error(`Unsafe public file: ${file}`);
  const destination = path.join(output, versioned.get(file) || file);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  if (file === 'index.html') {
    let html = fs.readFileSync(path.join(root, file), 'utf8');
    html = html.replace(/\b(src|href)="([^"]+)"/g, (attribute, name, value) => versioned.has(value) ? `${name}="${versioned.get(value)}"` : attribute);
    fs.writeFileSync(destination, html);
  } else fs.copyFileSync(path.join(root, file), destination);
}
console.log(`Built ${files.length} allowlisted public files to dist/; ${versioned.size} assets have content-hashed filenames. No source documents or tooling copied.`);
