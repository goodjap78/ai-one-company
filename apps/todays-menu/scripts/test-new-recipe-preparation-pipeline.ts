/**
 * Smoke test for new-recipe-preparation pipeline (dry-run, full catalog).
 * Run: npm run test:new-recipe-preparation-pipeline
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');

let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
  } else {
    console.log(`✅ ${msg}`);
  }
}

console.log('New recipe preparation pipeline smoke — start\n');

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const proc = spawnSync(npmCmd, ['run', 'prepare:new-recipes', '--', '--dry-run'], {
  cwd: APP_ROOT,
  encoding: 'utf8',
  shell: process.platform === 'win32',
});

assert(proc.status === 0, `dry-run exit 0 (got ${proc.status})`);
assert(
  (proc.stdout ?? '').includes('HANKKI_NEW_RECIPE_PREPARATION_REPORT'),
  'console report banner present',
);

const reportPath = path.join(
  APP_ROOT,
  'scripts/reports/new-recipe-preparation-latest-dry-run.json',
);
assert(fs.existsSync(reportPath), 'dry-run JSON report written');

if (fs.existsSync(reportPath)) {
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as {
    dryRun: boolean;
    scope: { recipesChecked: number };
    pipelineResult: string;
  };
  assert(report.dryRun === true, 'report dryRun=true');
  assert(report.scope.recipesChecked === 34, `auto scope 34 recipes since 0484 (got ${report.scope.recipesChecked})`);
  assert(report.pipelineResult === 'PASS', `pipeline PASS on current catalog (got ${report.pipelineResult})`);
}

console.log(`\nDone — ${failed ? 'FAIL' : 'PASS'}`);
process.exitCode = failed ? 1 : 0;
