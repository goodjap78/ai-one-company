import { generateCupRamenV15Pilot } from '../generateV15Pilot';

generateCupRamenV15Pilot()
  .then((result) => {
    if (!result.ok) {
      console.error('v1.5 pilot failed:', result.error ?? 'unknown');
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
