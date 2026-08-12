import { generateCupRamenSimplifiedPilot } from '../generateSimplifyPilot';

generateCupRamenSimplifiedPilot()
  .then((result) => {
    if (!result.ok) {
      console.error('Simplify pilot failed:', result.error ?? 'unknown');
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
