/**
 * Generates cuisine/category fallback PNGs for meal heroes.
 * These are solid warm tones — never another recipe's food photo.
 * Run: node scripts/generate-category-fallbacks.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'assets', 'meals');

const CATEGORY_FALLBACKS = [
  { name: 'category_korean.png', rgb: [255, 214, 186] },
  { name: 'category_japanese.png', rgb: [232, 240, 248] },
  { name: 'category_chinese.png', rgb: [255, 228, 200] },
  { name: 'category_western.png', rgb: [245, 232, 220] },
  { name: 'category_default.png', rgb: [255, 236, 220] },
];

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([length, typeBuf, data, crcBuf]);
}

function createSolidPng(width, height, [r, g, b]) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const row = Buffer.alloc(1 + width * 3);
  for (let x = 0; x < width; x += 1) {
    row[1 + x * 3] = r;
    row[2 + x * 3] = g;
    row[3 + x * 3] = b;
  }

  const raw = Buffer.alloc((1 + width * 3) * height);
  for (let y = 0; y < height; y += 1) {
    row.copy(raw, y * row.length);
  }

  const compressed = zlib.deflateSync(raw);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const item of CATEGORY_FALLBACKS) {
  const png = createSolidPng(800, 600, item.rgb);
  fs.writeFileSync(path.join(OUT_DIR, item.name), png);
  console.log(`Wrote ${item.name}`);
}
