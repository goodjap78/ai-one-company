import { DISABLED_PROVIDER_MESSAGE } from '../config';
import type { ImageGenerateRequest, ImageGenerateResult } from '../types';
import type { ImageProvider } from './ImageProvider';

/**
 * Default provider — safely refuses generation until an API is wired.
 */
export class DisabledImageProvider implements ImageProvider {
  readonly name = 'disabled';
  readonly isConfigured = false;

  async generateImage(
    _request: ImageGenerateRequest,
  ): Promise<ImageGenerateResult> {
    return {
      status: 'disabled',
      error: DISABLED_PROVIDER_MESSAGE,
    };
  }
}

export function createImageProvider(): ImageProvider {
  const providerName = process.env.IMAGE_PROVIDER?.trim();
  const apiKey = process.env.IMAGE_API_KEY?.trim();

  // Future: switch(providerName) { case 'openai': return new OpenAIImageProvider(apiKey) }
  if (providerName && apiKey) {
    // No concrete provider implemented yet — stay disabled but report intent.
    console.warn(
      `[recipe-assets] IMAGE_PROVIDER="${providerName}" is set, but no provider implementation is wired yet.`,
    );
  }

  return new DisabledImageProvider();
}
