/**
 * Normalize provider output to exact HANKKI hero dimensions (1344×768 JPEG).
 */
import Jimp from 'jimp-compact';
import { DEFAULT_HERO_SPEC } from './types';

export async function normalizeHeroBytes(bytes: Buffer): Promise<Buffer> {
  const image = await Jimp.read(bytes);
  const resized = image
    .cover(DEFAULT_HERO_SPEC.width, DEFAULT_HERO_SPEC.height)
    .quality(90);
  return resized.getBufferAsync(Jimp.MIME_JPEG);
}
