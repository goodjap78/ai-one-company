/**
 * Sprint CONTENT-CENTER-1 — HANKKI Content Center (internal).
 *
 * Launch: npm run content-center → http://127.0.0.1:4720
 * Does NOT touch consumer app UI / recipe data / Home / Recipe Detail.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { PATHS } from '../image-factory/config';
import {
  approveRecipe,
  regenerateRecipe,
  rejectRecipe,
  selectVersion,
} from '../image-factory/review-dashboard/actions';
import { resolveHistoryAbsolutePath } from '../image-factory/review-dashboard/historyStore';
import { resolveCandidatePath } from '../image-factory/reviewStore';
import {
  buildImageQueue,
  loadImageQueue,
} from '../image-factory/buildImageQueue';
import {
  getContentRecipeDetail,
  listContentRecipes,
  resolveIngredientIconAbsolute,
  resolveIngredientReviewAbsolute,
  type ContentListStatus,
} from './readiness';
import { listIngredientReviewCards, approveAllReviewedIngredients } from './ingredientReviews';
import { HERO_REGEN_FEEDBACK_OPTIONS } from '../image-factory/heroRegenFeedback';
import { getProductionProgress } from './productionProgress';
import { getScaleProgress } from './scaleProgress';
import { runIngredientApprove } from '../ingredient-factory/runApprove';

const PUBLIC_DIR = path.join(
  PATHS.appRoot,
  'scripts/content-center/public',
);
const PORT = Number(process.env.HANKKI_CONTENT_CENTER_PORT || 4720);

function sendJson(
  res: http.ServerResponse,
  status: number,
  body: unknown,
): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(body, null, 2));
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
  return 'application/octet-stream';
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
    const { pathname } = url;
    const method = req.method || 'GET';

    if (method === 'GET' && pathname === '/api/ingredient-reviews') {
      const firstFive = url.searchParams.get('firstFive') === '1';
      const all = url.searchParams.get('all') === '1' || !firstFive;
      const cards = listIngredientReviewCards(
        firstFive
          ? {
              keys: [
                'onion',
                'garlic',
                'green_onion',
                'pork',
                'egg',
              ],
            }
          : { all: true },
      );
      const awaiting = cards.filter((c) => c.status === 'review').length;
      sendJson(res, 200, {
        ok: true,
        cards: firstFive
          ? cards.filter((c) =>
              ['onion', 'garlic', 'green_onion', 'pork', 'egg'].includes(
                c.iconKey,
              ),
            )
          : cards,
        summary: {
          total: cards.length,
          review: awaiting,
          exists: cards.filter((c) => c.status === 'exists').length,
          missing: cards.filter((c) => c.status === 'missing').length,
        },
        all,
      });
      return;
    }

    if (method === 'GET' && pathname === '/api/health') {
      sendJson(res, 200, {
        ok: true,
        sprint: 'CONTENT-CENTER-1',
        reviewDir: PATHS.reviewDir,
      });
      return;
    }

    if (method === 'GET' && pathname === '/api/regen-feedback-options') {
      sendJson(res, 200, {
        ok: true,
        options: HERO_REGEN_FEEDBACK_OPTIONS.map((o) => ({
          id: o.id,
          label: o.label,
        })),
      });
      return;
    }

    if (method === 'GET' && pathname === '/api/scale-progress') {
      sendJson(res, 200, {
        ok: true,
        progress: getScaleProgress(),
        production: getProductionProgress(),
      });
      return;
    }

    if (method === 'GET' && pathname === '/api/production-progress') {
      sendJson(res, 200, { ok: true, production: getProductionProgress() });
      return;
    }

    if (method === 'GET' && pathname === '/api/recipes') {
      const filter = (url.searchParams.get('filter') ||
        'all') as ContentListStatus | 'all';
      sendJson(res, 200, listContentRecipes(filter));
      return;
    }

    const detailMatch = pathname.match(/^\/api\/recipes\/([0-9]{3})$/);
    if (method === 'GET' && detailMatch) {
      const detail = getContentRecipeDetail(detailMatch[1]);
      if (!detail) {
        sendJson(res, 404, { ok: false, message: 'Recipe not found' });
        return;
      }
      sendJson(res, 200, { ok: true, recipe: detail });
      return;
    }

    const historyMatch = pathname.match(
      /^\/api\/history\/([0-9]{3})\/(\d+)$/,
    );
    if (method === 'GET' && historyMatch) {
      const abs = resolveHistoryAbsolutePath(
        historyMatch[1],
        Number(historyMatch[2]),
      );
      if (!abs) {
        res.writeHead(404);
        res.end('Not found');
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
        res.end('Not found');
        return;
      }
      sendFile(
        res,
        resolveCandidatePath(recipeId, item.heroImageKey),
        'image/jpeg',
      );
      return;
    }

    const iconMatch = pathname.match(/^\/api\/ingredient-icon\/([^/]+)$/);
    if (method === 'GET' && iconMatch) {
      const abs = resolveIngredientIconAbsolute(
        decodeURIComponent(iconMatch[1]),
      );
      if (!abs) {
        res.writeHead(404);
        res.end('Icon not found');
        return;
      }
      sendFile(res, abs, 'image/png');
      return;
    }

    const reviewIconMatch = pathname.match(
      /^\/api\/ingredient-review\/([^/]+)$/,
    );
    if (method === 'GET' && reviewIconMatch) {
      const abs = resolveIngredientReviewAbsolute(
        decodeURIComponent(reviewIconMatch[1]),
      );
      if (!abs) {
        res.writeHead(404);
        res.end('Review icon not found');
        return;
      }
      sendFile(res, abs, 'image/png');
      return;
    }

    if (method === 'POST' && pathname === '/api/ingredient-approve') {
      const body = await parseJsonBody(req);
      const iconKey = String(body.iconKey || '').trim();
      if (!iconKey) {
        sendJson(res, 400, { ok: false, message: 'iconKey required' });
        return;
      }
      // Single key only — Hero-style individual approve for one icon
      const result = runIngredientApprove({
        decision: 'approve',
        iconKey,
        force: true,
      });
      sendJson(res, 200, {
        ok: result.promoted.includes(iconKey),
        message: result.promoted.includes(iconKey)
          ? `Approved ${iconKey} → assets/ingredients/${iconKey}.png`
          : `Approve did not promote ${iconKey}`,
        ...result,
      });
      return;
    }

    if (method === 'POST' && pathname === '/api/ingredient-approve-all') {
      // Ingredient Library only — never batch-approve Hero Images
      const result = approveAllReviewedIngredients();
      sendJson(res, result.ok || result.promoted.length > 0 ? 200 : 400, result);
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
      const recipeId = String(body.recipeId || '');
      // Single recipe only — never batch from this UI
      const feedbackIds = Array.isArray(body.feedbackIds)
        ? body.feedbackIds.map(String)
        : [];
      const otherText =
        typeof body.otherText === 'string' ? body.otherText : undefined;
      const result = await regenerateRecipe(recipeId, {
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

    if (method === 'POST' && pathname === '/api/select-version') {
      const body = await parseJsonBody(req);
      const recipeId = String(body.recipeId || '');
      const detail = getContentRecipeDetail(recipeId);
      const updated = selectVersion(
        recipeId,
        Number(body.version),
        detail?.heroImageKey,
      );
      sendJson(res, 200, { ok: true, state: updated });
      return;
    }

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
    // Never echo secrets
    const safe = message.replace(/AIza[0-9A-Za-z_-]+/g, '[REDACTED]');
    sendJson(res, 500, { ok: false, message: safe });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('\n========== HANKKI Content Center (CONTENT-CENTER-1) ==========');
  console.log(`URL:        http://127.0.0.1:${PORT}`);
  console.log(`Review dir: ${PATHS.reviewDir}`);
  console.log('Internal developer tool — not part of the mobile app.');
  console.log('==============================================================\n');
});
