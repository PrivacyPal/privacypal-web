#!/usr/bin/env node
/* =========================================================
   PrivacyPal — local dev server (zero dependencies)
   Serves the static site over HTTP so pages that fetch()
   JSON (the Privacy Log, Newsroom, etc.) work locally —
   opening the .html files as file:// will NOT work.

     npm run serve            # http://localhost:8000
     npm run serve -- 3000    # custom port
     PORT=3000 npm run serve

   Ctrl-C to stop.
   ========================================================= */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.argv[2] || process.env.PORT || 8000);

const MIME = {
  '.html':'text/html; charset=utf-8', '.htm':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.xml':'application/xml; charset=utf-8', '.rss':'application/rss+xml; charset=utf-8',
  '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
  '.gif':'image/gif', '.webp':'image/webp', '.avif':'image/avif', '.ico':'image/x-icon',
  '.mp4':'video/mp4', '.webm':'video/webm',
  '.woff':'font/woff', '.woff2':'font/woff2', '.ttf':'font/ttf', '.otf':'font/otf',
  '.txt':'text/plain; charset=utf-8', '.md':'text/plain; charset=utf-8',
  '.pdf':'application/pdf',
};

function safeJoin(root, urlPath){
  const decoded = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  const resolved = path.normalize(path.join(root, decoded));
  // prevent path traversal outside ROOT
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
  return resolved;
}

const server = http.createServer((req, res) => {
  let target = safeJoin(ROOT, req.url === '/' ? '/index.html' : req.url);
  if (!target){ res.writeHead(403); return res.end('403 Forbidden'); }

  fs.stat(target, (err, stat) => {
    if (!err && stat.isDirectory()){ target = path.join(target, 'index.html'); }
    fs.readFile(target, (err2, buf) => {
      if (err2){
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(`<h1>404 Not Found</h1><p><code>${req.url}</code></p><p><a href="/">Home</a> &middot; <a href="/blog.html">The Privacy Log</a></p>`);
      }
      const type = MIME[path.extname(target).toLowerCase()] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
      res.end(buf);
    });
  });
});

server.listen(PORT, () => {
  console.log(`\n  PrivacyPal dev server running:\n`);
  console.log(`    Home         →  http://localhost:${PORT}/`);
  console.log(`    Privacy Log  →  http://localhost:${PORT}/blog.html`);
  console.log(`    RSS feed     →  http://localhost:${PORT}/blog/rss.xml`);
  console.log(`\n  Serving ${ROOT}`);
  console.log(`  Press Ctrl-C to stop.\n`);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE'){
    console.error(`\n  Port ${PORT} is already in use. Try another:  npm run serve -- ${PORT + 1}\n`);
    process.exit(1);
  }
  throw e;
});
