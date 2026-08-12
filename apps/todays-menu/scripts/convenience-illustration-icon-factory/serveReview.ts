/**
 * Serve convenience illustration pilot review on port 8769.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { PATHS, REVIEW_PORT } from './config';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.png': 'image/png',
  '.json': 'application/json',
  '.md': 'text/markdown; charset=utf-8',
};

function safePath(root: string, urlPath: string): string | null {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const rel = decoded === '/' ? '/index.html' : decoded;
  const abs = path.normalize(path.join(root, rel));
  if (!abs.startsWith(root)) return null;
  return abs;
}

export function serveReview(): void {
  const roots = [
    { prefix: '', root: PATHS.reviewDir },
    { prefix: '/assets', root: path.join(PATHS.appRoot, 'assets') },
    { prefix: '/generated', root: path.join(PATHS.appRoot, 'generated') },
  ];

  const server = http.createServer((req, res) => {
    const url = req.url ?? '/';
    for (const { prefix, root } of roots) {
      if (prefix && !url.startsWith(prefix)) continue;
      const sub = prefix ? url.slice(prefix.length) || '/' : url;
      const abs = safePath(root, sub);
      if (!abs || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) continue;
      const ext = path.extname(abs);
      res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' });
      fs.createReadStream(abs).pipe(res);
      return;
    }
    res.writeHead(404);
    res.end('Not found');
  });

  server.listen(REVIEW_PORT, '127.0.0.1', () => {
    console.log(`Review server http://127.0.0.1:${REVIEW_PORT}/index.html`);
    console.log(`Root: ${PATHS.reviewDir}`);
  });
}
