/**
 * Server-only env for Coupang Partners proxy.
 * Never import this module from React Native client code.
 */
import fs from 'node:fs';
import path from 'node:path';

export type ShoppingProxyEnv = {
  accessKey: string;
  secretKey: string;
  subId?: string;
  requestTimeoutMs: number;
};

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

function sanitizePartnerCredential(value: string): string {
  const trimmed = value.trim();
  // Coupang portal copy-paste sometimes wraps keys in angle brackets.
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export function loadShoppingProxyEnv(appRoot?: string): ShoppingProxyEnv | null {
  // Production serverless: platform env only — no filesystem .env.
  if (appRoot && process.env.NODE_ENV !== 'production') {
    loadDotEnv(path.join(appRoot, '.env'));
  }

  const accessKeyRaw = process.env.COUPANG_PARTNERS_ACCESS_KEY;
  const secretKeyRaw = process.env.COUPANG_PARTNERS_SECRET_KEY;
  const accessKey = accessKeyRaw ? sanitizePartnerCredential(accessKeyRaw) : undefined;
  const secretKey = secretKeyRaw ? sanitizePartnerCredential(secretKeyRaw) : undefined;

  if (!accessKey || !secretKey) {
    return null;
  }

  const subId = process.env.COUPANG_PARTNERS_SUB_ID?.trim() || undefined;
  const timeoutRaw = Number(process.env.COUPANG_PARTNERS_TIMEOUT_MS ?? 12000);
  const requestTimeoutMs =
    Number.isFinite(timeoutRaw) && timeoutRaw > 0 ? timeoutRaw : 12000;

  return {
    accessKey,
    secretKey,
    subId,
    requestTimeoutMs,
  };
}

export function isShoppingProxyConfigured(appRoot?: string): boolean {
  return loadShoppingProxyEnv(appRoot) !== null;
}
