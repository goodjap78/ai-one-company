import { approveCupRamenMaster } from '../approveCupRamenMaster';

const result = approveCupRamenMaster();
if (!result.ok) {
  console.error('Approve master failed:', result.error ?? 'unknown');
  process.exit(1);
}
