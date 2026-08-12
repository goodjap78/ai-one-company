/**
 * Env presence check — SET/NOT SET only. Never prints values.
 */
import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '..');

function loadDotEnv(envPath: string): void {
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadDotEnv(path.join(APP_ROOT, '.env'));

function status(name: string): string {
  const v = process.env[name]?.trim();
  return v ? 'SET' : 'NOT SET';
}

console.log(`COUPANG_PARTNERS_ACCESS_KEY: ${status('COUPANG_PARTNERS_ACCESS_KEY')}`);
console.log(`COUPANG_PARTNERS_SECRET_KEY: ${status('COUPANG_PARTNERS_SECRET_KEY')}`);
console.log(
  `UPSTASH_REDIS_REST_KV_REST_API_URL: ${status('UPSTASH_REDIS_REST_KV_REST_API_URL')}`,
);
console.log(
  `UPSTASH_REDIS_REST_KV_REST_API_TOKEN: ${status('UPSTASH_REDIS_REST_KV_REST_API_TOKEN')}`,
);
console.log(`UPSTASH_REDIS_REST_URL: ${status('UPSTASH_REDIS_REST_URL')}`);
console.log(`UPSTASH_REDIS_REST_TOKEN: ${status('UPSTASH_REDIS_REST_TOKEN')}`);
console.log(`SHOPPING_PROXY_ALLOWED_ORIGINS: ${status('SHOPPING_PROXY_ALLOWED_ORIGINS')}`);
console.log(`EXPO_PUBLIC_SHOPPING_API_BASE_URL: ${status('EXPO_PUBLIC_SHOPPING_API_BASE_URL')}`);
console.log(`SHOPPING_PROXY_PRODUCTION_BASE_URL: ${status('SHOPPING_PROXY_PRODUCTION_BASE_URL')}`);
