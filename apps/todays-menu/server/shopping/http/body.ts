import { SHOPPING_PROXY_MAX_BODY_BYTES } from './constants';
import { shoppingErrorResponse } from './errors';

export type BodyReadResult =
  | { ok: true; raw: string }
  | { ok: false; status: number; json: { error: string; message?: string } };

export function readBoundedBody(
  chunks: Buffer[],
  maxBytes = SHOPPING_PROXY_MAX_BODY_BYTES,
): BodyReadResult {
  let total = 0;
  for (const chunk of chunks) {
    total += chunk.length;
    if (total > maxBytes) {
      return {
        ok: false,
        ...shoppingErrorResponse(413, 'SHOPPING_PAYLOAD_TOO_LARGE'),
      };
    }
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  return { ok: true, raw };
}

export function parseJsonBody(raw: string): unknown {
  if (!raw.trim()) return {};
  return JSON.parse(raw) as unknown;
}
