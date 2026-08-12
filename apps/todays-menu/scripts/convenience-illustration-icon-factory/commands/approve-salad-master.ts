import { approveSaladMaster } from '../approveSaladMaster';

const result = approveSaladMaster();
if (!result.ok) {
  console.error('Approve salad master failed:', result.error ?? 'unknown');
  process.exit(1);
}
