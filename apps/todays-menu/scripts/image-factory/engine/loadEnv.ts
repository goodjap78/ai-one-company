/**
 * Load IMAGE_PROVIDER + provider-specific API keys from process.env / .env.
 * Never hardcode secrets. Never log API keys.
 *
 * OpenAI / mock: IMAGE_API_KEY
 * Gemini:        GEMINI_API_KEY
 */
import fs from 'node:fs';
import path from 'node:path';

export type ProviderEnv = {
  provider: string | undefined;
  /**
   * Active key for the selected provider.
   * gemini → GEMINI_API_KEY · openai|mock → IMAGE_API_KEY
   */
  apiKey: string | undefined;
  openaiApiKey: string | undefined;
  geminiApiKey: string | undefined;
};

/**
 * Best-effort `.env` loader (KEY=VALUE lines). Does not override existing env.
 */
export function loadDotEnv(envPath: string): void {
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

export function getProviderEnv(appRoot?: string): ProviderEnv {
  if (appRoot) {
    loadDotEnv(path.join(appRoot, '.env'));
  }

  const provider = process.env.IMAGE_PROVIDER?.trim() || undefined;
  const openaiApiKey = process.env.IMAGE_API_KEY?.trim() || undefined;
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim() || undefined;
  const name = provider?.toLowerCase();

  let apiKey: string | undefined;
  if (name === 'gemini') {
    apiKey = geminiApiKey;
  } else if (name === 'openai' || name === 'mock') {
    apiKey = openaiApiKey;
  } else {
    apiKey = openaiApiKey ?? geminiApiKey;
  }

  return {
    provider,
    apiKey,
    openaiApiKey,
    geminiApiKey,
  };
}
