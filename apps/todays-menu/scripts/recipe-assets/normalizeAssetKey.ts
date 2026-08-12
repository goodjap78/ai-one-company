import { ASSET_KEY_PATTERN } from './config';

/** lowercase, underscore-only asset key. */
export function normalizeAssetKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export function isValidAssetKey(key: string): boolean {
  return ASSET_KEY_PATTERN.test(key);
}

/** Extract meal key from `assets/meals/kimchi_stew.jpg` → `kimchi_stew`. */
export function heroKeyFromImagePath(imagePath: string): string {
  const base = imagePath.split(/[/\\]/).pop() ?? imagePath;
  return normalizeAssetKey(base.replace(/\.[^.]+$/, ''));
}

export function ingredientFilename(iconKey: string): string {
  return `${normalizeAssetKey(iconKey)}.png`;
}

export function stepFilename(imageKey: string): string {
  return `${normalizeAssetKey(imageKey)}.jpg`;
}
