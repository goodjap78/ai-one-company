/**
 * npm run combo:approve -- --key=spicy_cheese_stir_noodles_combo
 */
import { runComboApprove } from '../runApprove';

function parseArgs(argv: string[]) {
  const key = argv.find((a) => a.startsWith('--key='))?.split('=')[1];
  const decisionRaw = argv.find((a) => a.startsWith('--decision='))?.split('=')[1];
  const approvedOnly = argv.includes('--approved-only');
  const force = argv.includes('--force');
  const decision =
    decisionRaw === 'reject' || decisionRaw === 'regenerate'
      ? decisionRaw
      : 'approve';
  return { key, decision, approvedOnly, force };
}

function main(): void {
  console.log('\n========== combo:approve (48-C) ==========');
  const args = parseArgs(process.argv.slice(2));
  const result = runComboApprove({
    decision: args.decision,
    imageKey: args.key,
    approvedOnly: args.approvedOnly,
    force: args.force,
  });
  console.log(`Touched: ${result.touched.join(', ')}`);
  console.log(`Promoted: ${result.promoted.join(', ')}`);
  console.log(`Registry updated: ${result.registryUpdated}`);
  console.log('========================================\n');
}

main();
