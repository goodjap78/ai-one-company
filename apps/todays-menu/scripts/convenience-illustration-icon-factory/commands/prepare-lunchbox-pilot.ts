import { prepareLunchboxPilotPrompt } from '../prepareLunchboxPilot';

const result = prepareLunchboxPilotPrompt();
if (!result.ok) {
  console.error('Prepare lunchbox pilot failed:', result.error ?? 'unknown');
  process.exit(1);
}
