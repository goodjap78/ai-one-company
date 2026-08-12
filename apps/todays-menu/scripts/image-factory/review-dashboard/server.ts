/**
 * Sprint REVIEW-1 — HANKKI Image Review Dashboard server.
 *
 * Internal admin only. Not part of the consumer Expo app.
 *
 * Launch:
 *   npm run hero:dashboard
 *   → http://localhost:4710
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { PATHS } from '../config';
import { loadDashboardState } from './dashboardState';
import {
  approveRecipe,
  listDashboardCards,
  regenerateRecipe,
  rejectRecipe,
  reopenRejected,
  selectVersion,
  setQualityScore,
} from './actions';
import { resolveHistoryAbsolutePath } from './historyStore';
import { resolveCandidatePath } from '../reviewStore';
import {
  buildImageQueue,
  loadImageQueue,
} from '../buildImageQueue';

const PUBLIC_DIR = path.join(
  PATHS.appRoot,
  'scripts/image-factory/review-dashboard/public',
);
const PORT = Number(process.env.HANKKI_REVIEW_DASHBOARD_PORT || 4710);

function sendJson(
  res: http.ServerResponse,
  status: number,
  body: unknown,
): void {
  const json = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(json);
}

function sendFile(
  res: http.ServerResponse,
  abs: string,
  contentType: string,
): void {
  if (!fs.existsSync(abs)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }
  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
  });
  fs.createReadStream(abs).pipe(res);
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function parseJsonBody(
  req: http.IncomingMessage,
): Promise<Record<string, unknown>> {
  const raw = await readBody(req);
  if (!raw.trim()) return {};
  return JSON.parse(raw) as Record<string, unknown>;
}

function mimeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.js') return 'application/javascript; charset=utf-8';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.svg') return 'image/svg+xml';
  return 'application/octet-stream';
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
    const { pathname } = url;
    const method = req.method || 'GET';

    if (method === 'GET' && pathname === '/api/health') {
      sendJson(res, 200, {
        ok: true,
        sprint: 'REVIEW-1',
        reviewDir: PATHS.reviewDir,
      });
      return;
    }

    if (method === 'GET' && pathname === '/api/cards') {
      const includeRejected = url.searchParams.get('includeRejected') === '1';
      const state = loadDashboardState();
      sendJson(res, 200, {
        promptVersion: state.promptVersion,
        estimatedCostUsdPerImage: state.estimatedCostUsdPerImage,
        cards: listDashboardCards({ includeRejected }),
      });
      return;
    }

    const historyMatch = pathname.match(
      /^\/api\/history\/([0-9]{3})\/(\d+)$/,
    );
    if (method === 'GET' && historyMatch) {
      const recipeId = historyMatch[1];
      const version = Number(historyMatch[2]);
      const abs = resolveHistoryAbsolutePath(recipeId, version);
      if (!abs) {
        res.writeHead(404);
        res.end('Version not found');
        return;
      }
      sendFile(res, abs, 'image/jpeg');
      return;
    }

    const candidateMatch = pathname.match(/^\/api\/candidate\/([0-9]{3})$/);
    if (method === 'GET' && candidateMatch) {
      const recipeId = candidateMatch[1];
      const queue = loadImageQueue() ?? buildImageQueue();
      const item = queue.items.find((i) => i.recipeId === recipeId);
      if (!item) {
        res.writeHead(404);
        res.end('Recipe not found');
        return;
      }
      sendFile(
        res,
        resolveCandidatePath(recipeId, item.heroImageKey),
        'image/jpeg',
      );
      return;
    }

    if (method === 'POST' && pathname === '/api/approve') {
      const body = await parseJsonBody(req);
      const recipeId = String(body.recipeId || '');
      const version =
        body.version != null ? Number(body.version) : undefined;
      const result = approveRecipe(recipeId, version);
      sendJson(res, result.ok ? 200 : 400, result);
      return;
    }

    if (method === 'POST' && pathname === '/api/reject') {
      const body = await parseJsonBody(req);
      const result = rejectRecipe(String(body.recipeId || ''));
      sendJson(res, 200, result);
      return;
    }

    if (method === 'POST' && pathname === '/api/regenerate') {
      const body = await parseJsonBody(req);
      const feedbackIds = Array.isArray(body.feedbackIds)
        ? body.feedbackIds.map(String)
        : [];
      const otherText =
        typeof body.otherText === 'string' ? body.otherText : undefined;
      const result = await regenerateRecipe(String(body.recipeId || ''), {
        feedbackIds,
        otherText,
      });
      sendJson(res, result.ok ? 200 : 400, {
        ok: result.ok,
        message: result.message,
        newVersion: result.newVersion,
        feedbackAppend: result.feedbackAppend,
        providerStatus: result.generate.providerStatus,
        written: result.generate.written,
      });
      return;
    }

    if (method === 'POST' && pathname === '/api/score') {
      const body = await parseJsonBody(req);
      const recipeId = String(body.recipeId || '');
      const updated = setQualityScore(recipeId, {
        starScore:
          body.starScore != null ? Number(body.starScore) : undefined,
        pointScore:
          body.pointScore != null ? Number(body.pointScore) : undefined,
      });
      sendJson(res, 200, { ok: true, state: updated });
      return;
    }

    if (method === 'POST' && pathname === '/api/select-version') {
      const body = await parseJsonBody(req);
      const updated = selectVersion(
        String(body.recipeId || ''),
        Number(body.version),
      );
      sendJson(res, 200, { ok: true, state: updated });
      return;
    }

    if (method === 'POST' && pathname === '/api/reopen') {
      const body = await parseJsonBody(req);
      const updated = reopenRejected(String(body.recipeId || ''));
      sendJson(res, 200, { ok: true, state: updated });
      return;
    }

    // Static UI
    let filePath = pathname === '/' ? '/index.html' : pathname;
    if (filePath.includes('..')) {
      res.writeHead(400);
      res.end('Bad path');
      return;
    }
    const abs = path.join(PUBLIC_DIR, filePath);
    if (!abs.startsWith(PUBLIC_DIR)) {
      res.writeHead(400);
      res.end('Bad path');
      return;
    }
    sendFile(res, abs, mimeFor(abs));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    sendJson(res, 500, { ok: false, message });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('\n========== HANKKI Image Review Dashboard (REVIEW-1) ==========');
  console.log(`URL:        http://127.0.0.1:${PORT}`);
  console.log(`Review dir: ${PATHS.reviewDir}`);
  console.log('Internal admin only — not part of the consumer app.');
  console.log('==============================================================\n');
});
