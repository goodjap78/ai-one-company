import { generatePhase1BatchRemaining } from '../generatePhase1BatchRemaining';

generatePhase1BatchRemaining()
  .then((result) => {
    if (!result.ok) {
      console.error('Phase 1 batch failed:', result.error ?? 'unknown');
      for (const r of result.results) {
        if (!r.ok) console.error(`  ${r.iconKey}: ${r.error}`);
        if (r.audit) {
          console.log(
            `  ${r.iconKey}: ${r.audit.grade} bbox ${r.audit.bboxPct}% scale ${r.audit.linearScale}x`,
          );
        }
      }
      process.exit(1);
    }
    for (const r of result.results) {
      if (r.audit) {
        console.log(
          `${r.iconKey}: ${r.audit.grade} · bbox ${r.audit.bboxPct}% · scale ${r.audit.linearScale}x · family ${r.audit.masterFamilyDistance}`,
        );
      }
    }
    console.log('Phase 1 batch complete — review only, no master auto-approval');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
