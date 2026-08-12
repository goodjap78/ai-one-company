import { approvePhase1FinalMasters } from '../approvePhase1FinalMasters';

const result = approvePhase1FinalMasters();
if (!result.ok) {
  console.error('Approve Phase 1 final masters failed:', result.error ?? 'unknown');
  process.exit(1);
}
