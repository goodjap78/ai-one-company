import { prepareTriangleKimbapPilotPrompt } from '../prepareTriangleKimbapPilot';

const result = prepareTriangleKimbapPilotPrompt();
if (!result.ok) {
  console.error('Prepare triangle_kimbap pilot failed:', result.error ?? 'unknown');
  process.exit(1);
}
