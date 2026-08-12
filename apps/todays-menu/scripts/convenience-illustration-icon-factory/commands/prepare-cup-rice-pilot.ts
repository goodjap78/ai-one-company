import { prepareCupRicePilotPrompt } from '../prepareCupRicePilot';

const result = prepareCupRicePilotPrompt();
if (!result.ok) {
  console.error('Prepare cup_rice pilot failed:', result.error ?? 'unknown');
  process.exit(1);
}
