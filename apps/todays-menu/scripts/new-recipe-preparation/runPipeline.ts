#!/usr/bin/env npx tsx
/**
 * HANKKI v1.1 — New Recipe Preparation Pipeline
 *
 * Usage:
 *   npm run prepare:new-recipes
 *   npm run prepare:new-recipes -- --since recipe_0408
 *   npm run prepare:new-recipes -- --ids recipe_0408,recipe_0409
 *   npm run prepare:new-recipes -- --dry-run
 *   npm run prepare:new-recipes -- --full-catalog
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runRegistryUpdater } from '../ProductionPipeline/modules/registryUpdater';
import { parsePipelineArgs } from './parseArgs';
import { resolveScope } from './resolveScope';
import { runCatalogIntegrity, assertScopedRecipesExist } from './catalogIntegrity';
import { runConsistencyGate } from './consistencyGate';
import { runAudienceSafety, runAutoDiscoveryPolicy } from './audienceSafety';
import {
  auditHeroAndStepImages,
  runScopedImageNormalize,
  sumBytes,
  avgBytes,
  APP_ROOT,
} from './imageAudit';
import { runRequiredTests, failedTests } from './runTests';
import type { PreparationReport, Severity } from './types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = path.join(APP_ROOT, 'scripts/reports/new-recipe-preparation-latest.json');

function mb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function partitionFindings(findings: ReturnType<typeof runConsistencyGate>) {
  const bySeverity: Record<Severity, typeof findings> = {
    CRITICAL: [],
    HIGH: [],
    MEDIUM: [],
    LOW: [],
  };
  for (const f of findings) bySeverity[f.severity].push(f);
  return bySeverity;
}

function printReport(report: PreparationReport): void {
  console.log('\nHANKKI_NEW_RECIPE_PREPARATION_REPORT');
  console.log(`SCOPE: ${report.scope.label}`);
  console.log(`RECIPES_CHECKED: ${report.scope.recipesChecked}`);
  console.log('');
  console.log('CONSISTENCY:');
  console.log(`CRITICAL: ${report.consistency.critical}`);
  console.log(`HIGH: ${report.consistency.high}`);
  console.log(`MEDIUM: ${report.consistency.medium}`);
  console.log(`LOW: ${report.consistency.low}`);
  console.log('');
  console.log(`BABY_CHECKED: ${report.audience.babyChecked}`);
  console.log(`TODDLER_CHECKED: ${report.audience.toddlerChecked}`);
  console.log(`ELEMENTARY_CHECKED: ${report.audience.elementaryChecked}`);
  console.log('');
  console.log(`HERO_FOUND: ${report.hero.found}`);
  console.log(`HERO_OPTIMIZED: ${report.hero.optimized}`);
  console.log(`HERO_MISSING: ${report.hero.missing}`);
  console.log('');
  console.log(`STEP_FOUND: ${report.step.found}`);
  console.log(`STEP_OPTIMIZED: ${report.step.optimized}`);
  console.log(`STEP_MISSING: ${report.step.missing}`);
  console.log('');
  console.log(`REGISTRY_SYNC: ${report.registrySync.mealsUpdated || report.registrySync.stepsUpdated ? 'updated' : 'unchanged'}${report.dryRun ? ' (dry-run)' : ''}`);
  console.log(`IMAGE_SIZE_BEFORE: ${mb(report.imageSize.mealsBefore + report.imageSize.stepsBefore)} (heroes ${mb(report.imageSize.mealsBefore)}, steps ${mb(report.imageSize.stepsBefore)})`);
  console.log(`IMAGE_SIZE_AFTER: ${mb(report.imageSize.mealsAfter + report.imageSize.stepsAfter)} (heroes ${mb(report.imageSize.mealsAfter)}, steps ${mb(report.imageSize.stepsAfter)})`);
  console.log(`IMAGE_SAVED: ${mb(report.imageSize.savedBytes)}`);
  console.log('');
  console.log('TEST_RESULTS:');
  for (const t of report.tests) {
    console.log(`  ${t.passed ? 'PASS' : 'FAIL'} ${t.name}`);
  }
  console.log('');
  if (report.warnings.length) {
    console.log('WARNINGS:');
    for (const w of report.warnings.slice(0, 20)) console.log(`  - ${w}`);
    if (report.warnings.length > 20) {
      console.log(`  ... +${report.warnings.length - 20} more`);
    }
  } else {
    console.log('WARNINGS: none');
  }
  console.log('');
  if (report.blockers.length) {
    console.log('BLOCKERS:');
    for (const b of report.blockers.slice(0, 30)) console.log(`  - ${b}`);
    if (report.blockers.length > 30) {
      console.log(`  ... +${report.blockers.length - 30} more`);
    }
  } else {
    console.log('BLOCKERS: none');
  }
  console.log('');
  console.log(`PIPELINE_RESULT: ${report.pipelineResult}`);
}

function main(): number {
  const args = parsePipelineArgs(process.argv.slice(2));
  const scope = resolveScope(args);
  const blockers: string[] = [];
  const warnings: string[] = [];

  console.log(`HANKKI new-recipe preparation — ${args.dryRun ? 'DRY RUN' : 'RUN'}`);
  console.log(`scope: ${scope.label} (${scope.recipeIds.length} recipes)\n`);

  const missingScoped = assertScopedRecipesExist(scope.recipeIds);
  if (missingScoped.length) {
    blockers.push(`unknown scoped recipe ids: ${missingScoped.join(', ')}`);
  }

  // STEP 1 — catalog integrity (global)
  const catalog = runCatalogIntegrity();
  blockers.push(...catalog.blockers);

  // STEP 2 — consistency (scoped)
  const findings = runConsistencyGate(scope.recipes);
  const partitioned = partitionFindings(findings);
  for (const f of partitioned.CRITICAL) {
    blockers.push(`[${f.recipeId}] ${f.code}: ${f.issue}`);
  }
  for (const f of partitioned.HIGH) {
    blockers.push(`[${f.recipeId}] ${f.code}: ${f.issue}`);
  }
  for (const f of partitioned.MEDIUM) {
    warnings.push(`[${f.recipeId}] ${f.code}: ${f.issue}`);
  }
  for (const f of partitioned.LOW) {
    warnings.push(`[${f.recipeId}] ${f.code}: ${f.issue}`);
  }

  // STEP 3 — audience / child safety
  const audience = runAudienceSafety(scope.recipes);
  blockers.push(...audience.blockers);
  warnings.push(...audience.warnings);

  // STEP 4 — auto-discovery policy
  blockers.push(...runAutoDiscoveryPolicy(scope.recipes));

  // STEP 5 — registry sync BEFORE image audit so on-disk heroes/steps are require()'d
  let registrySync = {
    mealsUpdated: false,
    stepsUpdated: false,
    dryRun: args.dryRun,
  };
  if (!args.dryRun) {
    const reg = runRegistryUpdater();
    registrySync = {
      mealsUpdated: reg.mealsUpdated || reg.ingredientsUpdated,
      stepsUpdated: reg.stepsUpdated,
      dryRun: false,
    };
  } else {
    warnings.push('registry sync skipped (dry-run); file-present keys treated as pending sync');
  }

  // STEP 6 — hero / step audit (+ normalize)
  const imageAudit = auditHeroAndStepImages(scope.recipes);
  blockers.push(...imageAudit.blockers);
  warnings.push(...imageAudit.warnings);

  const heroBeforeBytes = sumBytes(imageAudit.heroes.filter((h) => !h.missing));
  const stepBeforeBytes = sumBytes(imageAudit.steps.filter((s) => !s.missing));

  let normalizePlans = imageAudit.heroKeysToNormalize.length || imageAudit.stepKeysToNormalize.length
    ? runScopedImageNormalize({
        heroKeys: imageAudit.heroKeysToNormalize,
        stepKeys: imageAudit.stepKeysToNormalize,
        dryRun: args.dryRun,
      })
    : { plans: [], normalizeLog: null };

  if (normalizePlans.error) {
    blockers.push(`image normalize failed: ${normalizePlans.error}`);
  }

  // Re-audit after normalize for size report (non-dry-run only when changes made)
  let heroesAfter = imageAudit.heroes;
  let stepsAfter = imageAudit.steps;
  if (!args.dryRun && normalizePlans.plans.some((p) => p.action === 'normalize')) {
    const refreshed = auditHeroAndStepImages(scope.recipes);
    heroesAfter = refreshed.heroes;
    stepsAfter = refreshed.steps;
  }

  const heroOptimizedCount = normalizePlans.plans.filter(
    (p) => p.kind === 'hero' && p.action === 'normalize',
  ).length;
  const stepOptimizedCount = normalizePlans.plans.filter(
    (p) => p.kind === 'step' && p.action === 'normalize',
  ).length;

  const heroAfterBytes = sumBytes(heroesAfter.filter((h) => !h.missing));
  const stepAfterBytes = sumBytes(stepsAfter.filter((s) => !s.missing));

  // STEP 9 — tests (full regression; runs in dry-run too)
  const tests = runRequiredTests();
  for (const t of failedTests(tests)) {
    blockers.push(`test failed: ${t.name} (exit ${t.exitCode})`);
  }

  const report: PreparationReport = {
    generatedAt: new Date().toISOString(),
    dryRun: args.dryRun,
    scope: {
      mode: scope.mode,
      label: scope.label,
      recipesChecked: scope.recipeIds.length,
    },
    consistency: {
      critical: partitioned.CRITICAL.length,
      high: partitioned.HIGH.length,
      medium: partitioned.MEDIUM.length,
      low: partitioned.LOW.length,
      findings,
    },
    audience: {
      babyChecked: audience.babyChecked,
      toddlerChecked: audience.toddlerChecked,
      elementaryChecked: audience.elementaryChecked,
      blockers: audience.blockers,
    },
    hero: {
      found: imageAudit.heroes.filter((h) => !h.missing).length,
      optimized: heroOptimizedCount,
      missing: imageAudit.heroes.filter((h) => h.missing).length,
      planned: normalizePlans.plans.filter((p) => p.kind === 'hero'),
    },
    step: {
      found: imageAudit.steps.filter((s) => !s.missing).length,
      optimized: stepOptimizedCount,
      missing: imageAudit.steps.filter((s) => s.missing).length,
      planned: normalizePlans.plans.filter((p) => p.kind === 'step'),
    },
    registrySync,
    imageSize: {
      mealsBefore: heroBeforeBytes,
      mealsAfter: heroAfterBytes,
      stepsBefore: stepBeforeBytes,
      stepsAfter: stepAfterBytes,
      savedBytes: Math.max(0, heroBeforeBytes + stepBeforeBytes - heroAfterBytes - stepAfterBytes),
      scopedHeroAvgBefore: avgBytes(imageAudit.heroes),
      scopedHeroAvgAfter: avgBytes(heroesAfter),
      scopedStepAvgBefore: avgBytes(imageAudit.steps),
      scopedStepAvgAfter: avgBytes(stepsAfter),
    },
    tests,
    warnings,
    blockers,
    pipelineResult: blockers.length ? 'FAIL' : 'PASS',
  };

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  if (!args.dryRun) {
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');
  } else {
    fs.writeFileSync(
      REPORT_PATH.replace(/\.json$/, '-dry-run.json'),
      JSON.stringify(report, null, 2),
      'utf8',
    );
  }

  printReport(report);
  return report.pipelineResult === 'PASS' ? 0 : 1;
}

process.exitCode = main();
