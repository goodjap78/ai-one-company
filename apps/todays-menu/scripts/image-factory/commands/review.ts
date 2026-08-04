/**
 * npm run hero:review
 * Build generated/image-factory/review/index.html preview report.
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildImageQueue, loadImageQueue, writeImageQueue } from '../buildImageQueue';
import { PATHS } from '../config';
import { writeReviewIndexHtml } from '../writeReviewHtml';
import { writeSideDishReviewHtml } from '../writeSideDishReviewHtml';

async function main(): Promise<void> {
  console.log('\n========== hero:review (IMG-2A) ==========');
  const queue = loadImageQueue() ?? buildImageQueue();
  if (!loadImageQueue()) writeImageQueue(queue);

  const rel = writeReviewIndexHtml(queue);
  const sideRel = await writeSideDishReviewHtml();
  const abs = path.join(PATHS.appRoot, rel);
  console.log(`Preview → ${rel}`);
  console.log(`Side dishes → ${sideRel}`);
  console.log(`Open: http://127.0.0.1:8765/index.html`);
  console.log(`Side dishes: http://127.0.0.1:8765/side-dishes.html`);
  console.log(
    `Waiting approval: ${queue.items.filter((i) => i.status === 'completed').length}`,
  );
  console.log('==========================================\n');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
