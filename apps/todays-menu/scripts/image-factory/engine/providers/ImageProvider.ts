/**
 * Pluggable image generation provider (reusable across AI Company projects).
 * Never store API keys in source — read via env.
 */
import type { ImageGenerateRequest, ImageGenerateResult } from '../types';

export interface ImageProvider {
  readonly name: string;
  readonly isConfigured: boolean;
  generateImage(request: ImageGenerateRequest): Promise<ImageGenerateResult>;
}
