/**
 * Google Gemini image generation via generateContent (native fetch).
 * Same Pattern as OpenAIProvider — no separate SDK required.
 *
 * Env:
 *   IMAGE_PROVIDER=gemini
 *   GEMINI_API_KEY=...
 * Optional:
 *   GEMINI_IMAGE_MODEL=gemini-2.5-flash-image
 *
 * Does not generate until explicitly called. Keys never logged.
 */
import type { ImageGenerateRequest, ImageGenerateResult } from '../types';
import type { ImageProvider } from './ImageProvider';

/**
 * Image-capable Gemini models only (Nano Banana / flash-image family).
 * Do not use text-only models such as gemini-2.0-flash or gemini-pro.
 */
export const GEMINI_IMAGE_CAPABLE_MODELS = [
  'gemini-2.5-flash-image',
  'gemini-3.1-flash-image',
  'gemini-2.5-flash-image-preview',
] as const;

const DEFAULT_MODEL: (typeof GEMINI_IMAGE_CAPABLE_MODELS)[number] =
  'gemini-2.5-flash-image';

type GeminiInlineData = {
  mimeType?: string;
  mime_type?: string;
  data?: string;
};

type GeminiPart = {
  text?: string;
  inlineData?: GeminiInlineData;
  inline_data?: GeminiInlineData;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
  error?: { message?: string; status?: string; code?: number };
};

export class GeminiImageProvider implements ImageProvider {
  readonly name = 'gemini';
  readonly isConfigured: boolean;
  private readonly model: string;

  constructor(
    private readonly apiKey: string | undefined,
    model?: string,
  ) {
    this.isConfigured = Boolean(apiKey?.trim());
    const requested =
      model?.trim() || process.env.GEMINI_IMAGE_MODEL?.trim() || DEFAULT_MODEL;
    this.model = resolveImageCapableModel(requested);
  }

  async generateImage(
    request: ImageGenerateRequest,
  ): Promise<ImageGenerateResult> {
    if (!this.isConfigured || !this.apiKey) {
      return {
        status: 'disabled',
        error:
          'GeminiImageProvider is not configured. Set IMAGE_PROVIDER=gemini and GEMINI_API_KEY in .env',
      };
    }

    const aspectRatio = pickAspectRatio(request.width, request.height);
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${encodeURIComponent(this.model)}:generateContent`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'x-goog-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: request.prompt }],
            },
          ],
          generationConfig: {
            // Require image in the response (text optional for captions).
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: {
              aspectRatio,
            },
          },
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        return {
          status: 'error',
          error: `Gemini API ${response.status}: ${truncate(body, 400)}`,
        };
      }

      const json = (await response.json()) as GeminiResponse;
      if (json.error?.message) {
        return {
          status: 'error',
          error: `Gemini API error: ${json.error.message}`,
        };
      }

      const parts = json.candidates?.[0]?.content?.parts ?? [];
      const inline = findInlineImage(parts);
      if (!inline?.data) {
        return {
          status: 'error',
          error: 'Gemini response missing inline image data',
        };
      }

      let bytes = Buffer.from(inline.data, 'base64');
      let mimeType =
        inline.mimeType || inline.mime_type || detectMimeFromMagic(bytes);

      const coerced = await coerceToRequestedFormat(bytes, mimeType, request.format);
      bytes = coerced.bytes;
      mimeType = coerced.mimeType;

      return {
        status: 'ok',
        bytes,
        mimeType,
        meta: {
          provider: this.name,
          model: this.model,
          aspectRatio,
          mimeType,
          format: request.format,
          coerced: coerced.coerced,
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

function resolveImageCapableModel(requested: string): string {
  const lower = requested.toLowerCase();
  if (lower.includes('image') || lower.includes('imagen')) {
    return requested;
  }
  console.warn(
    `[gemini] GEMINI_IMAGE_MODEL="${requested}" does not look image-capable; ` +
      `using ${DEFAULT_MODEL}`,
  );
  return DEFAULT_MODEL;
}

function findInlineImage(parts: GeminiPart[]): GeminiInlineData | undefined {
  for (const part of parts) {
    const inline = part.inlineData || part.inline_data;
    if (inline?.data) return inline;
  }
  return undefined;
}

function detectMimeFromMagic(bytes: Buffer): string {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    return 'image/jpeg';
  }
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'image/png';
  }
  return 'application/octet-stream';
}

/**
 * Align bytes with request.format so review paths (*.jpg / *.png) match content.
 * Uses optional `sharp` when installed; otherwise keeps compatible bytes as-is.
 */
async function coerceToRequestedFormat(
  bytes: Buffer,
  mimeType: string,
  format: 'jpg' | 'png',
): Promise<{ bytes: Buffer; mimeType: string; coerced: boolean }> {
  const magic = detectMimeFromMagic(bytes);
  const wantJpeg = format === 'jpg';
  const wantPng = format === 'png';
  const isJpeg = magic === 'image/jpeg' || mimeType.includes('jpeg');
  const isPng = magic === 'image/png' || mimeType.includes('png');

  if (wantJpeg && isJpeg) {
    return { bytes, mimeType: 'image/jpeg', coerced: false };
  }
  if (wantPng && isPng) {
    return { bytes, mimeType: 'image/png', coerced: false };
  }

  try {
    const sharpMod = await import('sharp').catch(() => null);
    if (!sharpMod?.default) {
      return {
        bytes,
        mimeType: isPng ? 'image/png' : isJpeg ? 'image/jpeg' : mimeType,
        coerced: false,
      };
    }
    const sharp = sharpMod.default;
    if (wantJpeg) {
      const out = await sharp(bytes).jpeg({ quality: 90 }).toBuffer();
      return { bytes: out, mimeType: 'image/jpeg', coerced: true };
    }
    if (wantPng) {
      const out = await sharp(bytes).png().toBuffer();
      return { bytes: out, mimeType: 'image/png', coerced: true };
    }
  } catch {
    // keep original
  }

  return {
    bytes,
    mimeType: isPng ? 'image/png' : isJpeg ? 'image/jpeg' : mimeType,
    coerced: false,
  };
}

function pickAspectRatio(width: number, height: number): string {
  const ratio = width / height;
  if (Math.abs(ratio - 16 / 9) < 0.08) return '16:9';
  if (Math.abs(ratio - 9 / 16) < 0.08) return '9:16';
  if (Math.abs(ratio - 4 / 3) < 0.08) return '4:3';
  if (Math.abs(ratio - 3 / 4) < 0.08) return '3:4';
  if (Math.abs(ratio - 1) < 0.08) return '1:1';
  return '16:9';
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n)}…`;
}
