/**
 * Sprint IMG-2 — Reusable Image Production Engine types.
 *
 * Portable: no HANKKI / Expo imports. Safe to copy into other AI Company apps.
 */

export type ImageQueueStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'approved'
  | 'rejected';

export type ImageGenerateRequest = {
  /** Stable asset key (filename stem). */
  assetKey: string;
  /** Human-readable subject (e.g. dish name). */
  subject: string;
  /** Full prompt text sent to the provider. */
  prompt: string;
  width: number;
  height: number;
  /** Preferred mime / extension without leading dot. */
  format: 'jpg' | 'png';
};

export type ImageGenerateResult = {
  status: 'ok' | 'disabled' | 'error';
  /** Raw image bytes when status === 'ok'. */
  bytes?: Buffer;
  mimeType?: string;
  error?: string;
  /** Provider-specific metadata for audit logs. */
  meta?: Record<string, unknown>;
};

export type EnginePaths = {
  /** Directory for produced binary files (project-defined). */
  outputDir: string;
  /** Optional review / staging directory. */
  reviewDir?: string;
};

export type HeroSpec = {
  width: number;
  height: number;
  format: 'jpg';
  aspectRatio: '16:9';
};

/** Default HANKKI / mobile meal hero spec (reusable). */
export const DEFAULT_HERO_SPEC: HeroSpec = {
  width: 1344,
  height: 768,
  format: 'jpg',
  aspectRatio: '16:9',
};
