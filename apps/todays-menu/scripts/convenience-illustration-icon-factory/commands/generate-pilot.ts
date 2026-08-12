import { generateCupRamenPilot } from '../generatePilot';

generateCupRamenPilot()
  .then((result) => {
    if (!result.ok) {
      console.error('Pilot generate failed:', result.error ?? 'unknown');
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
