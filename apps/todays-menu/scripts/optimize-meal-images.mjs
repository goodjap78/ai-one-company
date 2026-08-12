/**
 * Optimizes Gold TOP5 hero photos for mobile bundling.
 * - Center-crops to 1:1
 * - Resizes to 1024×1024 (retina-safe hero)
 * - Exports JPEG (~80–200 KB per image)
 *
 * Usage:
 *   node scripts/optimize-meal-images.mjs <sourceDir>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'assets', 'meals');

const TOP5 = [
  'gold_kr_kimchi_jjigae',
  'gold_kr_samgyeopsal',
  'gold_kr_jeyuk_bokkeum',
  'gold_kr_bibimbap',
  'gold_kr_jjapaghetti',
];

const HERO_SIZE = 1024;
const JPEG_QUALITY = 82;

const sourceDir = process.argv[2];
if (!sourceDir || !fs.existsSync(sourceDir)) {
  console.error('Usage: node scripts/optimize-meal-images.mjs <sourceDir>');
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const mealId of TOP5) {
  const candidates = [
    path.join(sourceDir, `${mealId}.png`),
    path.join(sourceDir, `${mealId}.jpg`),
    path.join(sourceDir, `${mealId}.jpeg`),
  ];
  const input = candidates.find((p) => fs.existsSync(p));
  if (!input) {
    console.warn(`Skip ${mealId}: source not found`);
    continue;
  }

  const output = path.join(OUT_DIR, `${mealId}.jpg`);
  await sharp(input)
    .resize(HERO_SIZE, HERO_SIZE, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toFile(output);

  const { size } = fs.statSync(output);
  console.log(`Wrote ${mealId}.jpg (${Math.round(size / 1024)} KB)`);
}
