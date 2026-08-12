/**
 * Lightweight image validators (no native deps).
 */
import fs from 'node:fs';

export type DetectedImageFormat = 'jpeg' | 'png' | 'unknown';

export type ImageFileCheck = {
  absolutePath: string;
  exists: boolean;
  extensionOk: boolean;
  extension: string;
  detectedFormat: DetectedImageFormat;
  formatMismatch: boolean;
  byteLength: number;
  isJpegMagic: boolean;
  width: number | null;
  height: number | null;
  /** Unreadable / truncated / unknown bytes */
  broken: boolean;
  issues: string[];
};

const SUPPORTED_EXT = new Set(['.jpg', '.jpeg', '.png']);

export function inspectImageFile(
  absolutePath: string,
  expected: { minWidth?: number; minHeight?: number; aspectHint?: '16:9' },
): ImageFileCheck {
  const issues: string[] = [];
  const ext = pathExt(absolutePath).toLowerCase();
  const extensionOk = SUPPORTED_EXT.has(ext);

  if (!extensionOk) {
    issues.push(`unsupported extension: ${ext || '(none)'}`);
  }

  if (!fs.existsSync(absolutePath)) {
    return {
      absolutePath,
      exists: false,
      extensionOk,
      extension: ext,
      detectedFormat: 'unknown',
      formatMismatch: false,
      byteLength: 0,
      isJpegMagic: false,
      width: null,
      height: null,
      broken: true,
      issues: [...issues, 'file missing'],
    };
  }

  const bytes = fs.readFileSync(absolutePath);
  const byteLength = bytes.length;
  if (byteLength < 100) {
    issues.push('file too small to be a valid photo');
  }

  const isJpegMagic = bytes[0] === 0xff && bytes[1] === 0xd8;
  const isPngMagic =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47;

  const detectedFormat: DetectedImageFormat = isJpegMagic
    ? 'jpeg'
    : isPngMagic
      ? 'png'
      : 'unknown';

  const expectsJpeg = ext === '.jpg' || ext === '.jpeg';
  const expectsPng = ext === '.png';
  const formatMismatch =
    (expectsJpeg && detectedFormat !== 'jpeg') ||
    (expectsPng && detectedFormat !== 'png');

  if (detectedFormat === 'unknown') {
    issues.push('unrecognized image magic header');
  } else if (formatMismatch) {
    issues.push(
      `format mismatch: extension ${ext} but bytes are ${detectedFormat}`,
    );
  }

  const dims = isJpegMagic
    ? readJpegSize(bytes)
    : isPngMagic
      ? readPngSize(bytes)
      : null;
  const width = dims?.width ?? null;
  const height = dims?.height ?? null;

  if (dims) {
    if (expected.minWidth && width !== null && width < expected.minWidth) {
      issues.push(`width ${width} < min ${expected.minWidth}`);
    }
    if (expected.minHeight && height !== null && height < expected.minHeight) {
      issues.push(`height ${height} < min ${expected.minHeight}`);
    }
    if (expected.aspectHint === '16:9' && width && height) {
      const ratio = width / height;
      if (Math.abs(ratio - 16 / 9) > 0.15) {
        issues.push(`aspect ${ratio.toFixed(3)} not ~16:9`);
      }
    }
  } else if (isJpegMagic || isPngMagic) {
    issues.push('could not parse image dimensions');
  }

  const broken =
    !extensionOk ||
    detectedFormat === 'unknown' ||
    byteLength < 100 ||
    issues.some((i) => i.includes('could not parse'));

  return {
    absolutePath,
    exists: true,
    extensionOk,
    extension: ext,
    detectedFormat,
    formatMismatch,
    byteLength,
    isJpegMagic,
    width,
    height,
    broken,
    issues,
  };
}

function pathExt(p: string): string {
  const i = p.lastIndexOf('.');
  return i >= 0 ? p.slice(i) : '';
}

function readPngSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 24) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/** Parse SOF0/SOF2 for JPEG dimensions. */
function readJpegSize(buf: Buffer): { width: number; height: number } | null {
  let offset = 2;
  while (offset < buf.length - 8) {
    if (buf[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buf[offset + 1];
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }
    const length = buf.readUInt16BE(offset + 2);
    // SOF0 / SOF2
    if (marker === 0xc0 || marker === 0xc2) {
      const height = buf.readUInt16BE(offset + 5);
      const width = buf.readUInt16BE(offset + 7);
      return { width, height };
    }
    offset += 2 + length;
  }
  return null;
}
