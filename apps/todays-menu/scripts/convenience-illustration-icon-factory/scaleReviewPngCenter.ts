/**
 * Center-scale review PNG on warm cream background (design lock).
 */
import fs from 'node:fs';
import { PNG } from 'pngjs';
import { analyzeIngredientPng } from './analyzeIngredientPng';

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
    return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
  };

  const c00 = p(x0, y0);
  const c10 = p(x1, y0);
  const c01 = p(x0, y1);
  const c11 = p(x1, y1);

  const mix = (a: number, b: number, t: number) => a * (1 - t) + b * t;
  const r = mix(mix(c00.r, c10.r, tx), mix(c01.r, c11.r, tx), ty);
  const g = mix(mix(c00.g, c10.g, tx), mix(c01.g, c11.g, tx), ty);
  const b = mix(mix(c00.b, c10.b, tx), mix(c01.b, c11.b, tx), ty);
  const a = mix(mix(c00.a, c10.a, tx), mix(c01.a, c11.a, tx), ty);

  return { r: Math.round(r), g: Math.round(g), b: Math.round(b), a: Math.round(a) };
}

export function scaleReviewPngCenter(abs: string, linearScale: number, iconKey: string): {
  bboxPct: number;
} {
  const src = PNG.sync.read(fs.readFileSync(abs), { skipRescale: true });
  const w = src.width;
  const h = src.height;
  const meta = analyzeIngredientPng(abs, iconKey);
  const bg = meta.backgroundRgb;

  const out = new PNG({ width: w, height: h });
  const cx = w / 2;
  const cy = h / 2;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const srcX = (x - cx) / linearScale + cx;
      const srcY = (y - cy) / linearScale + cy;
      const sample = sampleBilinear(src.data, w, h, srcX, srcY);
      const isBg =
        sample.a < 250 && colorDist(sample.r, sample.g, sample.b, bg) <= 22;
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

  fs.writeFileSync(abs, PNG.sync.write(out));
  const scaled = analyzeIngredientPng(abs, iconKey);
  return { bboxPct: Number((scaled.bboxAreaRatio * 100).toFixed(1)) };
}

/** Scale until bbox within target or max scale reached. */
export function scaleReviewPngToBbox(
  abs: string,
  iconKey: string,
  minPct: number,
  maxPct: number,
  minLinear = 1.1,
  maxLinear = 1.85,
): { linearScale: number; bboxPct: number } {
  const backup = fs.readFileSync(abs);
  let bestScale = 1;
  let bestBbox = analyzeIngredientPng(abs, iconKey).bboxAreaRatio * 100;

  for (let scale = minLinear; scale <= maxLinear + 0.001; scale += 0.05) {
    const rounded = Number(scale.toFixed(2));
    fs.writeFileSync(abs, backup);
    const { bboxPct } = scaleReviewPngCenter(abs, rounded, iconKey);
    if (bboxPct >= minPct && bboxPct <= maxPct) {
      return { linearScale: rounded, bboxPct };
    }
    if (Math.abs(bboxPct - (minPct + maxPct) / 2) < Math.abs(bestBbox - (minPct + maxPct) / 2)) {
      bestScale = rounded;
      bestBbox = bboxPct;
    }
  }

  fs.writeFileSync(abs, backup);
  if (bestScale > 1) {
    scaleReviewPngCenter(abs, bestScale, iconKey);
  }
  const final = analyzeIngredientPng(abs, iconKey);
  return {
    linearScale: bestScale,
    bboxPct: Number((final.bboxAreaRatio * 100).toFixed(1)),
  };
}
