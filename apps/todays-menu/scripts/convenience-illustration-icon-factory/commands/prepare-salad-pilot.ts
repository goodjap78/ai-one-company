import { prepareSaladPilotPrompt } from '../prepareSaladPilot';

const result = prepareSaladPilotPrompt();
if (!result.ok) {
  console.error('Prepare salad pilot failed:', result.error ?? 'unknown');
  process.exit(1);
}
