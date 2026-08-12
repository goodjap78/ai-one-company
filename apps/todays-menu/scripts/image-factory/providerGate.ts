/**
 * Sprint IMG-2B — shared provider readiness check.
 * Never logs API key values.
 */
import type { ProviderEnv } from './engine/loadEnv';

export type ProviderGate =
  | { ready: true; provider: string }
  | {
      ready: false;
      status: 'PROVIDER_NOT_CONFIGURED' | 'API_KEY_MISSING';
      provider: string | undefined;
      missing: string[];
      envHint: string;
      /** Present when gemini is selected but GEMINI_API_KEY is empty. */
      geminiReady?: boolean;
    };

const ENV_HINT_OPENAI = [
  'Required in apps/todays-menu/.env:',
  '  IMAGE_PROVIDER=openai',
  '  IMAGE_API_KEY=sk-...',
  '',
  'Or for Gemini:',
  '  IMAGE_PROVIDER=gemini',
  '  GEMINI_API_KEY=...',
  '',
  'Dry-run (--dry-run) works without an API key.',
  'Do not commit real API keys.',
].join('\n');

const ENV_HINT_GEMINI = [
  'Required in apps/todays-menu/.env:',
  '  IMAGE_PROVIDER=gemini',
  '  GEMINI_API_KEY=...',
  '',
  'Dry-run (--dry-run) works without GEMINI_API_KEY.',
  'Do not commit real API keys.',
].join('\n');

const ALLOWED = new Set(['openai', 'mock', 'gemini']);

/**
 * Provider must be gemini|openai|mock; real generate needs the matching key.
 */
export function checkProviderGate(env: ProviderEnv): ProviderGate {
  const provider = env.provider?.trim().toLowerCase() || undefined;

  if (!provider) {
    const missing = ['IMAGE_PROVIDER'];
    if (!env.openaiApiKey && !env.geminiApiKey) {
      missing.push('IMAGE_API_KEY or GEMINI_API_KEY');
    }
    return {
      ready: false,
      status: 'PROVIDER_NOT_CONFIGURED',
      provider,
      missing,
      envHint: ENV_HINT_OPENAI,
    };
  }

  if (!ALLOWED.has(provider)) {
    return {
      ready: false,
      status: 'PROVIDER_NOT_CONFIGURED',
      provider,
      missing: ['IMAGE_PROVIDER (must be gemini|openai|mock)'],
      envHint: ENV_HINT_OPENAI,
    };
  }

  if (provider === 'mock') {
    return { ready: true, provider };
  }

  if (provider === 'gemini') {
    if (!env.geminiApiKey?.trim()) {
      return {
        ready: false,
        status: 'API_KEY_MISSING',
        provider,
        missing: ['GEMINI_API_KEY'],
        envHint: ENV_HINT_GEMINI,
        geminiReady: true,
      };
    }
    return { ready: true, provider };
  }

  // openai | mock
  if (!env.openaiApiKey?.trim() && !env.apiKey?.trim()) {
    return {
      ready: false,
      status: 'API_KEY_MISSING',
      provider,
      missing: ['IMAGE_API_KEY'],
      envHint: ENV_HINT_OPENAI,
    };
  }

  return { ready: true, provider };
}

export function printProviderNotConfigured(
  gate: Extract<ProviderGate, { ready: false }>,
): void {
  if (gate.status === 'API_KEY_MISSING' && gate.geminiReady) {
    console.log('\nGEMINI_PROVIDER_READY');
    console.log('API_KEY_MISSING');
    console.log(`IMAGE_PROVIDER=${gate.provider ?? '(unset)'}`);
    console.log('GEMINI_API_KEY=(missing)');
    console.log('\nRequired in apps/todays-menu/.env:');
    console.log('  IMAGE_PROVIDER=gemini');
    console.log('  GEMINI_API_KEY=...');
    console.log('\nNo images generated. Queue statuses left unchanged.');
    console.log('No production assets written. No fake images created.\n');
    return;
  }

  if (gate.status === 'API_KEY_MISSING') {
    console.log('\nPROVIDER_READY');
    console.log('API_KEY_MISSING');
    console.log(`IMAGE_PROVIDER=${gate.provider ?? '(unset)'}`);
    console.log('IMAGE_API_KEY=(missing)');
    console.log('\nRequired in apps/todays-menu/.env:');
    console.log('  IMAGE_PROVIDER=openai');
    console.log('  IMAGE_API_KEY=sk-...');
    console.log('\nNo images generated. Queue statuses left unchanged.');
    console.log('No production assets written. No fake images created.\n');
    return;
  }

  console.log(`\nstatus: ${gate.status}`);
  console.log(`IMAGE_PROVIDER=${gate.provider ?? '(unset)'}`);
  console.log(`missing: ${gate.missing.join(', ')}`);
  console.log('\n' + gate.envHint + '\n');
  console.log('No images generated. Queue statuses left unchanged for skipped/approved items.');
  console.log('No production assets written. No fake images created.\n');
}
