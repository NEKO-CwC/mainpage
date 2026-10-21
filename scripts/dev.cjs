'use strict';
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const files = new Set(require('./public-files.cjs'));
const root = path.resolve(__dirname, '..');
const argument = process.argv.indexOf('--port');
const port = Number(argument >= 0 ? process.argv[argument + 1] : process.env.PORT || 4173);
const hostArgument = process.argv.indexOf('--host');
const host = hostArgument >= 0 ? process.argv[hostArgument + 1] : '127.0.0.1';
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT / --port must be an integer from 1 to 65535.');
if (!host || host.startsWith('--')) throw new Error('--host requires a hostname or IP address.');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
const server = http.createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: 'GET, HEAD' }); response.end('Method not allowed\n'); return; }
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
  catch { response.writeHead(400); response.end('Bad request\n'); return; }
  const file = pathname === '/' ? 'index.html' : pathname.slice(1);
  if (!files.has(file)) { response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end('404 — Public file not found\n'); return; }
  try {
    const data = await fs.readFile(path.join(root, file));
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] });
    response.end(request.method === 'HEAD' ? undefined : data);
  } catch (error) {
    console.error(`Cannot serve ${file}:`, error.message); response.writeHead(500); response.end('Public file unavailable\n');
  }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, host, () => console.log(`NCUHOME: http://${host}:${port} (public allowlist only)`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
