import { generateCupRicePilot } from '../generateCupRicePilot';

generateCupRicePilot()
  .then((result) => {
    if (!result.ok) {
      console.error('cup_rice pilot failed:', result.error ?? 'unknown');
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
