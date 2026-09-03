import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TestResult } from './types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '../..');

const REQUIRED_TESTS: Array<{ name: string; script: string }> = [
  { name: 'validate:hankki-recipes', script: 'validate:hankki-recipes' },
  { name: 'validate:recipe-metadata', script: 'validate:recipe-metadata' },
  { name: 'validate:hero-runtime', script: 'validate:hero-runtime' },
  { name: 'consistency', script: 'test:child-content-expansion-batch4' },
  { name: 'test:family-audience', script: 'test:family-audience' },
  { name: 'test:baby-food-policy', script: 'test:baby-food-policy' },
  { name: 'test:toddler-safety-policy', script: 'test:toddler-safety-policy' },
  { name: 'test:fridge-raid', script: 'test:fridge-raid' },
  { name: 'test:home-final-qa', script: 'test:home-final-qa' },
  { name: 'test:child-image-registry', script: 'test:child-image-registry' },
];

export function runRequiredTests(): TestResult[] {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  return REQUIRED_TESTS.map((t) => {
    const proc = spawnSync(npmCmd, ['run', t.script], {
      cwd: APP_ROOT,
      encoding: 'utf8',
      shell: process.platform === 'win32',
    });
    const exitCode = proc.status ?? 1;
    return {
      name: t.name,
      script: t.script,
      exitCode,
      passed: exitCode === 0,
    };
  });
}

export function failedTests(results: TestResult[]): TestResult[] {
  return results.filter((r) => !r.passed);
}
