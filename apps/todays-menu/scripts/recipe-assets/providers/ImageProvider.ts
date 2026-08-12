import type { ImageGenerateRequest, ImageGenerateResult } from '../types';

/**
 * Pluggable image generation provider.
 * Connect a real API later via IMAGE_PROVIDER + IMAGE_API_KEY.
 * Never store API keys in source.
 */
export interface ImageProvider {
  readonly name: string;
  readonly isConfigured: boolean;
  generateImage(request: ImageGenerateRequest): Promise<ImageGenerateResult>;
}
