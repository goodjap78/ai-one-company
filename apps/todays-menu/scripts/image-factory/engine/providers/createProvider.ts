/**
 * Provider factory — switch implementations via IMAGE_PROVIDER.
 * Never hardcode API keys.
 */
import { getProviderEnv, type ProviderEnv } from '../loadEnv';
import type { ImageProvider } from './ImageProvider';
import { GeminiImageProvider } from './GeminiImageProvider';
import { MockProvider } from './MockProvider';
import { OpenAIProvider } from './OpenAIProvider';

class DisabledProvider implements ImageProvider {
  readonly name = 'disabled';
  readonly isConfigured = false;

  async generateImage() {
    return {
      status: 'disabled' as const,
      error:
        'No image provider configured.\n' +
        'Set IMAGE_PROVIDER=gemini|openai|mock in .env\n' +
        '  gemini → GEMINI_API_KEY\n' +
        '  openai → IMAGE_API_KEY\n' +
        'Engine is prepared — real generation is opt-in.',
    };
  }
}

export function createImageProvider(
  env?: ProviderEnv,
  appRoot?: string,
): ImageProvider {
  const resolved = env ?? getProviderEnv(appRoot);
  const name = (resolved.provider ?? '').toLowerCase();

  if (name === 'mock') {
    return new MockProvider();
  }

  if (name === 'openai') {
    return new OpenAIProvider(resolved.openaiApiKey ?? resolved.apiKey);
  }

  if (name === 'gemini') {
    return new GeminiImageProvider(resolved.geminiApiKey ?? resolved.apiKey);
  }

  if (name) {
    console.warn(
      `[image-engine] Unknown IMAGE_PROVIDER="${resolved.provider}". Falling back to disabled.`,
    );
  }

  return new DisabledProvider();
}

export type { ImageProvider } from './ImageProvider';
export { GeminiImageProvider } from './GeminiImageProvider';
export { MockProvider } from './MockProvider';
export { OpenAIProvider } from './OpenAIProvider';
