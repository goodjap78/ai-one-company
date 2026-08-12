import { generateCupRiceV11Pilot } from '../generateCupRiceV11Pilot';

generateCupRiceV11Pilot()
  .then((result) => {
    if (!result.ok) {
      console.error('cup_rice v1.1 failed:', result.error ?? 'unknown');
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
