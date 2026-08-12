/**
 * Mock provider — pipeline tests without external APIs.
 * Emits a small 16:9 PNG (saved as .jpg path for pipeline naming).
 * Not for production approval — use OpenAI for real food photos.
 *
 * IMAGE_PROVIDER=mock
 */
import zlib from 'node:zlib';
import type { ImageGenerateRequest, ImageGenerateResult } from '../types';
import type { ImageProvider } from './ImageProvider';

export class MockProvider implements ImageProvider {
  readonly name = 'mock';
  readonly isConfigured = true;

  async generateImage(
    request: ImageGenerateRequest,
  ): Promise<ImageGenerateResult> {
    // 64×36 ≈ 16:9 — enough for magic/aspect smoke tests; not food photography.
    const bytes = createSolidPng(64, 36, [0xf4, 0xa2, 0x61]);
    return {
      status: 'ok',
      bytes,
      mimeType: 'image/png',
      meta: {
        provider: this.name,
        assetKey: request.assetKey,
        subject: request.subject,
        note: 'Mock placeholder PNG — reject in review; not for production',
        width: 64,
        height: 36,
      },
    };
  }
}

function createSolidPng(
  width: number,
  height: number,
  rgb: [number, number, number],
): Buffer {
  const rowSize = 1 + width * 3;
  const raw = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * rowSize;
    raw[rowStart] = 0; // filter none
    for (let x = 0; x < width; x++) {
      const i = rowStart + 1 + x * 3;
      raw[i] = rgb[0];
      raw[i + 1] = rgb[1];
      raw[i + 2] = rgb[2];
    }
  }
  const compressed = zlib.deflateSync(raw);

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}
