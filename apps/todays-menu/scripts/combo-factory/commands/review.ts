/**
 * npm run combo:review
 * Build v1/v2 comparison page and print HTTP review URL.
 */
import path from 'node:path';
import { PATHS } from '../config';
import { loadComboQueue } from '../buildQueue';
import { writeComboReviewHtml } from '../writeReviewHtml';
import { getComboReviewPort, writeComboV2ReviewHtml } from '../writeComboV2ReviewHtml';

function main(): void {
  console.log('\n========== combo:review ==========');
  const queue = loadComboQueue();
  if (queue) {
    writeComboReviewHtml(queue);
  }
  const rel = writeComboV2ReviewHtml();
  const port = getComboReviewPort();
  const awaiting = queue?.items.filter((i) => i.status === 'completed').length ?? 0;

  console.log(`v2 comparison → ${rel}`);
  console.log(`Review URL: http://127.0.0.1:${port}/combo-pilots-v2.html`);
  console.log(`Start server: npm run combo:review:serve`);
  console.log(`Awaiting approval: ${awaiting}`);
  console.log('==================================\n');
}

main();
