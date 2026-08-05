/**
 * Static HTTP server for combo-factory review assets.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { PATHS } from './config';
import { getComboReviewPort } from './writeComboV2ReviewHtml';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.json': 'application/json',
  '.md': 'text/plain; charset=utf-8',
};

const REVIEW_ROOT = path.resolve(PATHS.reviewDir);
const HISTORY_ROOT = path.resolve(PATHS.generatedRoot, 'history');

function send404(res: http.ServerResponse): void {
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
}

function resolveSafeFile(urlPath: string): string | null {
  const rel = urlPath === '/' ? '/combo-pilots-v2.html' : urlPath;
  const abs = path.resolve(REVIEW_ROOT, rel.replace(/^\//, ''));
  if (abs.startsWith(REVIEW_ROOT) || abs.startsWith(HISTORY_ROOT)) {
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return abs;
  }
  return null;
}

const server = http.createServer((req, res) => {
  const fileAbs = resolveSafeFile((req.url ?? '/').split('?')[0]);
  if (!fileAbs) {
    send404(res);
    return;
  }

  const ext = path.extname(fileAbs).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME[ext] ?? 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  fs.createReadStream(fileAbs).pipe(res);
});

const port = getComboReviewPort();
server.listen(port, '127.0.0.1', () => {
  console.log(`Combo review server → http://127.0.0.1:${port}/combo-pilots-v2.html`);
  console.log(`HACK batch 1 → http://127.0.0.1:${port}/hack-batch-1.html`);
  console.log(`HACK batch 2 → http://127.0.0.1:${port}/hack-batch-2.html`);
  console.log(`HACK batch 3 → http://127.0.0.1:${port}/hack-batch-3.html`);
  console.log(`EASY_SET batch 1 → http://127.0.0.1:${port}/easy-set-batch-1.html`);
  console.log(`Serving review: ${REVIEW_ROOT}`);
  console.log(`Serving history: ${HISTORY_ROOT}`);
});
