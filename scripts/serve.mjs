// Zero-dependency static server for the production build in apps/web/dist.
// Used by `npm start` to preview/serve the built SPA locally or on any host
// (Railway, Docker, VPS). Vercel does not need this — it serves dist directly.
//
//   node scripts/serve.mjs            # serves apps/web/dist on :3000
//   PORT=8080 node scripts/serve.mjs  # custom port
//
// Every unknown path falls back to index.html so client-side routes work.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = join(root, 'apps', 'web', 'dist');
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

const send = (res, status, body, type) => {
  res.statusCode = status;
  res.setHeader('Content-Type', type);
  if (type.includes('javascript') || type.includes('css') || type.startsWith('image')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  res.end(body);
};

const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]).replace(/\0/g, '');
    let file = resolve(join(dist, urlPath === '/' ? 'index.html' : urlPath));

    // Block path traversal outside dist.
    if (!file.startsWith(dist + sep) && file !== dist) {
      return send(res, 403, 'Forbidden', 'text/plain; charset=utf-8');
    }

    try {
      const info = await stat(file);
      if (info.isDirectory()) throw new Error('directory');
      const body = await readFile(file);
      return send(res, 200, body, MIME[extname(file)] || 'application/octet-stream');
    } catch {
      // SPA fallback — every route renders the app shell.
      const body = await readFile(join(dist, 'index.html'));
      return send(res, 200, body, MIME['.html']);
    }
  } catch {
    send(res, 500, 'Internal Server Error', 'text/plain; charset=utf-8');
  }
});

server.listen(port, host, () => {
  console.log(`ClaimGrid preview serving apps/web/dist at http://${host}:${port}`);
});
