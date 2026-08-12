import { generateMilkPilot } from '../generateMilkPilot';

generateMilkPilot()
  .then((result) => {
    if (!result.ok) {
      console.error('milk pilot failed:', result.error ?? 'unknown');
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
