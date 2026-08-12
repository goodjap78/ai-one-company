import { generateTriangleKimbapV11Pilot } from '../generateTriangleKimbapV11Pilot';

generateTriangleKimbapV11Pilot()
  .then((result) => {
    if (!result.ok) {
      console.error('triangle_kimbap v1.1 pilot failed:', result.error ?? 'unknown');
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
