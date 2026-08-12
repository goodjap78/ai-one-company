/**
 * Measure reference ingredient PNGs and write CONVENIENCE_ICON_RENDER_PROFILE.json
 */
import fs from 'node:fs';
import {
  analyzeReferenceSet,
  type IngredientPngMetrics,
} from './analyzeIngredientPng';
import {
  buildRenderProfileFromMetrics,
  type ConvenienceIconRenderProfile,
} from './convenienceIconRenderProfile';
import { PATHS, REFERENCE_INGREDIENT_KEYS } from './config';

function main(): void {
  const metrics = analyzeReferenceSet(
    PATHS.ingredientsDir,
    [...REFERENCE_INGREDIENT_KEYS],
  );

  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  fs.writeFileSync(PATHS.metricsJson, JSON.stringify(metrics, null, 2), 'utf8');

  const profile = buildRenderProfileFromMetrics(metrics);
  fs.writeFileSync(
    PATHS.renderProfileJson,
    JSON.stringify(profile, null, 2),
    'utf8',
  );

  console.log('Reference ingredient metrics —', REFERENCE_INGREDIENT_KEYS.join(', '));
  for (const m of metrics) {
    console.log(
      `  ${m.iconKey}: ${m.width}x${m.height} bg=rgb(${m.backgroundRgb.r},${m.backgroundRgb.g},${m.backgroundRgb.b}) policy=${m.backgroundPolicy} bboxArea=${(m.bboxAreaRatio * 100).toFixed(1)}% fg=${(m.foregroundPixelRatio * 100).toFixed(1)}% pad T${m.paddingTopPct.toFixed(1)} B${m.paddingBottomPct.toFixed(1)}`,
    );
  }
  console.log('\nCONVENIENCE_ICON_RENDER_PROFILE');
  console.log(`  background: ${profile.background.policy} rgb(${profile.background.rgb.r},${profile.background.rgb.g},${profile.background.rgb.b})`);
  console.log(
    `  bbox area mean ${(profile.layout.bboxAreaRatioMean * 100).toFixed(1)}% (${(profile.layout.bboxAreaRatioMin * 100).toFixed(1)}–${(profile.layout.bboxAreaRatioMax * 100).toFixed(1)})`,
  );
  console.log(`  written: ${PATHS.renderProfileJson}`);
}

main();

export type { IngredientPngMetrics, ConvenienceIconRenderProfile };
