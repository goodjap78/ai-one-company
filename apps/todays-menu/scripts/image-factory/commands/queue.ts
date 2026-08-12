/**
 * npm run hero:queue
 * Build / refresh image-queue.json from hero-images.json + dashboard.
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildImageQueue, writeImageQueue } from '../buildImageQueue';
import { PATHS } from '../config';
import { getProviderEnv } from '../engine';
import { validateHeroProduction } from '../validateProduction';
import { buildProductionDashboardMarkdown } from '../writeProductionDashboard';

function main(): void {
  console.log('\n========== hero:queue (IMG-2) ==========');
  getProviderEnv(PATHS.appRoot);

  fs.mkdirSync(PATHS.reviewDir, { recursive: true });
  const queue = buildImageQueue({
    providerHint: process.env.IMAGE_PROVIDER ?? 'disabled',
  });
  const out = writeImageQueue(queue);
  console.log(`Queue → ${out}`);
  console.log(
    `Totals: queued=${queue.totals.queued} completed=${queue.totals.completed} approved=${queue.totals.approved} rejected=${queue.totals.rejected} failed=${queue.totals.failed}`,
  );

  const validation = validateHeroProduction();
  const dashboard = buildProductionDashboardMarkdown({ queue, validation });
  fs.writeFileSync(PATHS.dashboard, dashboard, 'utf8');
  console.log(`Dashboard → ${path.relative(PATHS.appRoot, PATHS.dashboard)}`);
  console.log(`Validation: ${validation.ok ? 'PASS' : 'FAIL'}`);
  console.log('=========================================\n');
  process.exitCode = validation.ok ? 0 : 1;
}

main();
