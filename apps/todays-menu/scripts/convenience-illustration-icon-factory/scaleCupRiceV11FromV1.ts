/**
 * Sprint 56-B.1 — programmatic scale-up of cup_rice v1 (design lock, no AI).
 */
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import { analyzeIngredientPng, analyzeReferenceSet } from './analyzeIngredientPng';
import { buildRenderProfileFromMetrics } from './convenienceIconRenderProfile';
import { CUP_RICE_V11_GENERATION } from './convenienceIconStyleLock';
import {
  CUP_RICE_V1_FILE,
  CUP_RICE_V11_FILE,
  PATHS,
  REFERENCE_INGREDIENT_KEYS,
} from './config';
import { writeConveniencePilotReviewHtml } from './writeReviewHtml';

function colorDist(
  r: number,
  g: number,
  b: number,
  bg: { r: number; g: number; b: number },
): number {
  return Math.max(Math.abs(r - bg.r), Math.abs(g - bg.g), Math.abs(b - bg.b));
}

function sampleBilinear(
  data: Buffer,
  w: number,
  h: number,
  x: number,
  y: number,
): { r: number; g: number; b: number; a: number } {
  const fx = Math.max(0, Math.min(w - 1, x));
  const fy = Math.max(0, Math.min(h - 1, y));
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(w - 1, x0 + 1);
  const y1 = Math.min(h - 1, y0 + 1);
  const tx = fx - x0;
  const ty = fy - y0;

  const p = (px: number, py: number) => {
    const i = (py * w + px) * 4;
    return {
      r: data[i],
      g: data[i + 1],
      b: data[i + 2],
      a: data[i + 3],
    };
  };

  const c00 = p(x0, y0);
  const c10 = p(x1, y0);
  const c01 = p(x0, y1);
  const c11 = p(x1, y1);

  const r =
    c00.r * (1 - tx) * (1 - ty) +
    c10.r * tx * (1 - ty) +
    c01.r * (1 - tx) * ty +
    c11.r * tx * ty;
  const g =
    c00.g * (1 - tx) * (1 - ty) +
    c10.g * tx * (1 - ty) +
    c01.g * (1 - tx) * ty +
    c11.g * tx * ty;
  const b =
    c00.b * (1 - tx) * (1 - ty) +
    c10.b * tx * (1 - ty) +
    c01.b * (1 - tx) * ty +
    c11.b * tx * ty;
  const a =
    c00.a * (1 - tx) * (1 - ty) +
    c10.a * tx * (1 - ty) +
    c01.a * (1 - tx) * ty +
    c11.a * tx * ty;

  return { r: Math.round(r), g: Math.round(g), b: Math.round(b), a: Math.round(a) };
}

export function scaleCupRiceV11FromV1(linearScale: number): {
  ok: boolean;
  v11Path?: string;
  bboxPct?: number;
  error?: string;
} {
  const v1Abs = path.join(PATHS.reviewDir, CUP_RICE_V1_FILE);
  if (!fs.existsSync(v1Abs)) {
    return { ok: false, error: `Missing ${CUP_RICE_V1_FILE}` };
  }

  const v11Abs = path.join(PATHS.reviewDir, CUP_RICE_V11_FILE);
  const src = PNG.sync.read(fs.readFileSync(v1Abs), { skipRescale: true });
  const w = src.width;
  const h = src.height;
  const v1m = analyzeIngredientPng(v1Abs, 'cup_rice_v1');
  const bg = v1m.backgroundRgb;

  const out = new PNG({ width: w, height: h });
  const cx = w / 2;
  const cy = h / 2;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const srcX = (x - cx) / linearScale + cx;
      const srcY = (y - cy) / linearScale + cy;
      const sample = sampleBilinear(src.data, w, h, srcX, srcY);
      const isBg = sample.a < 250 && colorDist(sample.r, sample.g, sample.b, bg) <= 22;
      const idx = (y * w + x) * 4;
      if (isBg) {
        out.data[idx] = bg.r;
        out.data[idx + 1] = bg.g;
        out.data[idx + 2] = bg.b;
        out.data[idx + 3] = 255;
      } else {
        out.data[idx] = sample.r;
        out.data[idx + 1] = sample.g;
        out.data[idx + 2] = sample.b;
        out.data[idx + 3] = 255;
      }
    }
  }

  fs.mkdirSync(PATHS.reviewDir, { recursive: true });
  fs.writeFileSync(v11Abs, PNG.sync.write(out));

  const metrics = analyzeReferenceSet(PATHS.ingredientsDir, [...REFERENCE_INGREDIENT_KEYS]);
  const profile = buildRenderProfileFromMetrics(metrics);
  writeConveniencePilotReviewHtml({
    profile,
    cupRiceV1Abs: v1Abs,
    cupRiceHighlightAbs: v11Abs,
  });

  const v11m = analyzeIngredientPng(v11Abs, 'cup_rice_v11');
  return {
    ok: true,
    v11Path: v11Abs,
    bboxPct: Number((v11m.bboxAreaRatio * 100).toFixed(1)),
  };
}

/** Pick linear scale within 12–18% to land bbox in 33–38%. */
export function scaleCupRiceV11Auto(): {
  ok: boolean;
  linearScale?: number;
  v11Path?: string;
  bboxPct?: number;
  error?: string;
} {
  if (CUP_RICE_V11_GENERATION.approvedSprint !== '56-B.1') {
    return { ok: false, error: 'not approved' };
  }

  const minScale = 1 + CUP_RICE_V11_GENERATION.scaleUpPctMin / 100;
  const maxScale = 1 + CUP_RICE_V11_GENERATION.scaleUpPctMax / 100;

  let best: { scale: number; bbox: number; path: string } | null = null;

  for (let scale = minScale; scale <= maxScale + 0.001; scale += 0.02) {
    const rounded = Number(scale.toFixed(2));
    const result = scaleCupRiceV11FromV1(rounded);
    if (!result.ok || !result.bboxPct || !result.v11Path) {
      return { ok: false, error: result.error ?? 'scale failed' };
    }
    const bbox = result.bboxPct;
    if (
      bbox >= CUP_RICE_V11_GENERATION.targetBboxMinPct &&
      bbox <= CUP_RICE_V11_GENERATION.targetBboxMaxPct
    ) {
      return {
        ok: true,
        linearScale: rounded,
        v11Path: result.v11Path,
        bboxPct: bbox,
      };
    }
    if (
      !best ||
      Math.abs(bbox - 35.5) < Math.abs(best.bbox - 35.5)
    ) {
      best = { scale: rounded, bbox, path: result.v11Path };
    }
  }

  if (best) {
    return {
      ok: true,
      linearScale: best.scale,
      v11Path: best.path,
      bboxPct: best.bbox,
    };
  }

  return { ok: false, error: 'no scale factor produced output' };
}
