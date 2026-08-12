/**
 * OpenAI Images API provider (reusable).
 *
 * Env:
 *   IMAGE_PROVIDER=openai
 *   IMAGE_API_KEY=sk-...
 *
 * Does not generate until explicitly called. Keys never logged.
 */
import type { ImageGenerateRequest, ImageGenerateResult } from '../types';
import type { ImageProvider } from './ImageProvider';

const OPENAI_IMAGES_URL = 'https://api.openai.com/v1/images/generations';

export class OpenAIProvider implements ImageProvider {
  readonly name = 'openai';
  readonly isConfigured: boolean;

  constructor(private readonly apiKey: string | undefined) {
    this.isConfigured = Boolean(apiKey?.trim());
  }

  async generateImage(
    request: ImageGenerateRequest,
  ): Promise<ImageGenerateResult> {
    if (!this.isConfigured || !this.apiKey) {
      return {
        status: 'disabled',
        error:
          'OpenAIProvider is not configured. Set IMAGE_PROVIDER=openai and IMAGE_API_KEY in .env',
      };
    }

    const size = pickOpenAiSize(request.width, request.height);

    try {
      const response = await fetch(OPENAI_IMAGES_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: request.prompt,
          n: 1,
          size,
          response_format: 'b64_json',
          quality: 'hd',
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        return {
          status: 'error',
          error: `OpenAI API ${response.status}: ${truncate(body, 400)}`,
        };
      }

      const json = (await response.json()) as {
        data?: Array<{ b64_json?: string; revised_prompt?: string }>;
      };
      const b64 = json.data?.[0]?.b64_json;
      if (!b64) {
        return { status: 'error', error: 'OpenAI response missing b64_json' };
      }

      return {
        status: 'ok',
        bytes: Buffer.from(b64, 'base64'),
        mimeType: 'image/jpeg',
        meta: {
          provider: this.name,
          size,
          revisedPrompt: json.data?.[0]?.revised_prompt,
        },
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

function pickOpenAiSize(width: number, height: number): string {
  const ratio = width / height;
  if (Math.abs(ratio - 16 / 9) < 0.05) return '1792x1024';
  if (Math.abs(ratio - 9 / 16) < 0.05) return '1024x1792';
  return '1024x1024';
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n)}…`;
}
