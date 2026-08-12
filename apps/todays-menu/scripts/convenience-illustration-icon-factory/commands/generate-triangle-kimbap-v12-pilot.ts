import { generateTriangleKimbapV12Pilot } from '../generateTriangleKimbapV12Pilot';

generateTriangleKimbapV12Pilot()
  .then((result) => {
    if (!result.ok) {
      console.error('triangle_kimbap v1.2 pilot failed:', result.error ?? 'unknown');
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
