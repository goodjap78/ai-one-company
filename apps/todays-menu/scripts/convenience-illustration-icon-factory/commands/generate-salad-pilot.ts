import { generateSaladPilot } from '../generateSaladPilot';

generateSaladPilot()
  .then((result) => {
    if (!result.ok) {
      console.error('salad pilot failed:', result.error ?? 'unknown');
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
