import { generateTriangleKimbapPilot } from '../generateTriangleKimbapPilot';

generateTriangleKimbapPilot()
  .then((result) => {
    if (!result.ok) {
      console.error('triangle_kimbap pilot failed:', result.error ?? 'unknown');
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
