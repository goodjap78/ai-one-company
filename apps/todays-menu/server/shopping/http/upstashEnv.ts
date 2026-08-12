/**
 * Resolve Upstash Redis REST credentials from process.env.
 * Never logs values — names and presence only.
 *
 * Priority (REST API URL + write token):
 * 1. Vercel Marketplace "Upstash for Redis" (hankki-shopping-proxy):
 *    UPSTASH_REDIS_REST_KV_REST_API_URL
 *    UPSTASH_REDIS_REST_KV_REST_API_TOKEN
 * 2. Standard @upstash/redis Redis.fromEnv() names:
 *    UPSTASH_REDIS_REST_URL
 *    UPSTASH_REDIS_REST_TOKEN
 * 3. Generic Vercel KV REST fallbacks:
 *    KV_REST_API_URL
 *    KV_REST_API_TOKEN
 *
 * Not used (wrong protocol / read-only):
 *    UPSTASH_REDIS_REST_REDIS_URL
 *    UPSTASH_REDIS_REST_KV_URL
 *    UPSTASH_REDIS_REST_KV_REST_API_READ_ONLY_TOKEN
 */

export type UpstashRestCredentials = {
  url: string;
  token: string;
};

function firstTrimmed(...candidates: Array<string | undefined>): string | undefined {
  for (const raw of candidates) {
    const value = raw?.trim();
    if (value) return value;
  }
  return undefined;
}

export function resolveUpstashRestCredentials(): UpstashRestCredentials | null {
  const url = firstTrimmed(
    process.env.UPSTASH_REDIS_REST_KV_REST_API_URL,
    process.env.UPSTASH_REDIS_REST_URL,
    process.env.KV_REST_API_URL,
  );
  const token = firstTrimmed(
    process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN,
    process.env.UPSTASH_REDIS_REST_TOKEN,
    process.env.KV_REST_API_TOKEN,
  );

  if (!url || !token) return null;
  return { url, token };
}

export function hasUpstashRedisEnv(): boolean {
  return resolveUpstashRestCredentials() !== null;
}
