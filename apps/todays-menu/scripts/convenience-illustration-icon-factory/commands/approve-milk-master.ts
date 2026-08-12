import { approveMilkMaster } from '../approveMilkMaster';

const result = approveMilkMaster();
if (!result.ok) {
  console.error('Approve milk master failed:', result.error ?? 'unknown');
  process.exit(1);
}
