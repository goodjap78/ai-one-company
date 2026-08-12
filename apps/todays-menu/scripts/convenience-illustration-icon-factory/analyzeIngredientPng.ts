/**
 * Sprint 56-A — measure production ingredient PNG render metrics (no guessing).
 */
import fs from 'node:fs';
import path from 'node:path';
import sizeOf from 'image-size';
import { PNG } from 'pngjs';

export type Rgb = { r: number; g: number; b: number; a: number };

export type IngredientPngMetrics = {
  iconKey: string;
  fileBytes: number;
  width: number;
  height: number;
  colorType: string;
  hasAlphaChannel: boolean;
  cornerSamples: Rgb[];
  backgroundRgb: { r: number; g: number; b: number };
  backgroundAlphaMean: number;
  backgroundPolicy: 'opaque_uniform' | 'transparent' | 'mixed';
  foregroundPixelRatio: number;
  bbox: { left: number; top: number; right: number; bottom: number };
  bboxWidth: number;
  bboxHeight: number;
  bboxAreaRatio: number;
  paddingTopPct: number;
  paddingLeftPct: number;
  paddingRightPct: number;
  paddingBottomPct: number;
  shadowBand: {
    bottomRowStart: number;
    pixelCount: number;
    meanDarkening: number;
  };
};

function sampleEdgeBackground(png: PNG): { rgb: Rgb; samples: Rgb[] } {
  const w = png.width;
  const h = png.height;
  const samples: Rgb[] = [];
  const push = (x: number, y: number) => {
    const idx = (y * w + x) * 4;
    samples.push({
      r: png.data[idx],
      g: png.data[idx + 1],
      b: png.data[idx + 2],
      a: png.data[idx + 3],
    });
  };
  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 1; y < h - 1; y++) {
    push(0, y);
    push(w - 1, y);
  }
  const r = Math.round(samples.reduce((s, p) => s + p.r, 0) / samples.length);
  const g = Math.round(samples.reduce((s, p) => s + p.g, 0) / samples.length);
  const b = Math.round(samples.reduce((s, p) => s + p.b, 0) / samples.length);
  const a = Math.round(samples.reduce((s, p) => s + p.a, 0) / samples.length);
  return { rgb: { r, g, b, a }, samples };
}

function colorDist(a: Rgb, b: { r: number; g: number; b: number }): number {
  return Math.max(
    Math.abs(a.r - b.r),
    Math.abs(a.g - b.g),
    Math.abs(a.b - b.b),
  );
}

function readPng(abs: string): PNG {
  return PNG.sync.read(fs.readFileSync(abs), { skipRescale: true });
}

export function analyzeIngredientPng(abs: string, iconKey: string): IngredientPngMetrics {
  const fileBytes = fs.statSync(abs).size;
  const dims = sizeOf(fs.readFileSync(abs));
  const png = readPng(abs);
  const w = png.width;
  const h = png.height;

  const edge = sampleEdgeBackground(png);
  const cornerSamples = edge.samples.slice(0, 8);
  const bgR = edge.rgb.r;
  const bgG = edge.rgb.g;
  const bgB = edge.rgb.b;
  const backgroundAlphaMean = edge.rgb.a;

  const cornerSpread = Math.max(
    ...cornerSamples.map((p) => colorDist(p, { r: bgR, g: bgG, b: bgB })),
  );

  let transparentCorners = cornerSamples.filter((p) => p.a < 250).length;
  let backgroundPolicy: IngredientPngMetrics['backgroundPolicy'];
  if (transparentCorners >= 6) {
    backgroundPolicy = 'transparent';
  } else if (cornerSpread <= 12 && backgroundAlphaMean >= 250) {
    backgroundPolicy = 'opaque_uniform';
  } else {
    backgroundPolicy = 'mixed';
  }

  const THRESH = 22;
  const marginX = Math.floor(w * 0.03);
  const marginY = Math.floor(h * 0.03);
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  let foreground = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const onBorder =
        x < marginX ||
        x >= w - marginX ||
        y < marginY ||
        y >= h - marginY;
      const idx = (y * w + x) * 4;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      const a = png.data[idx + 3];
      const isFg =
        !onBorder &&
        (a < 250 ||
          colorDist({ r, g, b, a }, { r: bgR, g: bgG, b: bgB }) > THRESH);
      if (!isFg) continue;
      foreground += 1;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (foreground === 0) {
    minX = 0;
    minY = 0;
    maxX = w - 1;
    maxY = h - 1;
  }

  const bboxWidth = maxX - minX + 1;
  const bboxHeight = maxY - minY + 1;
  const bboxAreaRatio = (bboxWidth * bboxHeight) / (w * h);
  const foregroundPixelRatio = foreground / (w * h);

  const shadowStart = Math.floor(h * 0.82);
  let shadowPixels = 0;
  let shadowDarkSum = 0;
  for (let y = shadowStart; y < h; y++) {
    for (let x = minX; x <= maxX; x++) {
      const idx = (y * w + x) * 4;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      const a = png.data[idx + 3];
      if (a < 20) continue;
      const dark =
        (bgR + bgG + bgB) / 3 - (r + g + b) / 3;
      if (dark > 8 && dark < 90) {
        shadowPixels += 1;
        shadowDarkSum += dark;
      }
    }
  }

  return {
    iconKey,
    fileBytes,
    width: dims.width ?? w,
    height: dims.height ?? h,
    colorType: png.colorType === 6 ? 'rgba' : `type_${png.colorType}`,
    hasAlphaChannel: png.colorType === 6,
    cornerSamples,
    backgroundRgb: { r: bgR, g: bgG, b: bgB },
    backgroundAlphaMean,
    backgroundPolicy,
    foregroundPixelRatio,
    bbox: { left: minX, top: minY, right: maxX, bottom: maxY },
    bboxWidth,
    bboxHeight,
    bboxAreaRatio,
    paddingTopPct: (minY / h) * 100,
    paddingLeftPct: (minX / w) * 100,
    paddingRightPct: ((w - 1 - maxX) / w) * 100,
    paddingBottomPct: ((h - 1 - maxY) / h) * 100,
    shadowBand: {
      bottomRowStart: shadowStart,
      pixelCount: shadowPixels,
      meanDarkening:
        shadowPixels > 0 ? shadowDarkSum / shadowPixels : 0,
    },
  };
}

export function analyzeReferenceSet(
  ingredientsDir: string,
  keys: string[],
): IngredientPngMetrics[] {
  return keys.map((key) =>
    analyzeIngredientPng(path.join(ingredientsDir, `${key}.png`), key),
  );
}
