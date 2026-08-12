import { approveCupRiceMaster } from '../approveCupRiceMaster';

const result = approveCupRiceMaster();
if (!result.ok) {
  console.error('Approve cup_rice master failed:', result.error ?? 'unknown');
  process.exit(1);
}
