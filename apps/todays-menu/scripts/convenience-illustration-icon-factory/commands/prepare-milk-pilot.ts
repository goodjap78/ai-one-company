import { prepareMilkPilotPrompt } from '../prepareMilkPilot';

const result = prepareMilkPilotPrompt();
if (!result.ok) {
  console.error('Prepare milk pilot failed:', result.error ?? 'unknown');
  process.exit(1);
}
