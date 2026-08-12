/**
 * Sprint 56-F — generate Phase 1 remaining 5 icons in one batch + audit.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  createImageProvider,
  getProviderEnv,
  saveImageFile,
} from '../image-factory/engine';
import {
  checkProviderGate,
  printProviderNotConfigured,
} from '../image-factory/providerGate';
import { INGREDIENT_IMAGE_SPEC } from '../ingredient-factory/config';
import {
  buildPhase1BatchPrompt,
  buildRenderProfileFromMetrics,
} from './convenienceIconRenderProfile';
import { analyzeReferenceSet } from './analyzeIngredientPng';
import { PHASE1_BATCH_GENERATION } from './convenienceIconStyleLock';
import { auditConvenienceIconReview } from './auditConvenienceIconReview';
import { approveSaladMaster } from './approveSaladMaster';
import { PATHS, REFERENCE_INGREDIENT_KEYS } from './config';
import { writePhase1BatchReviewHtml } from './writeReviewHtml';
import { scaleReviewPngToBbox } from './scaleReviewPngCenter';

function sha256File(abs: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
}

type TargetResult = {
  iconKey: string;
  reviewFile: string;
  ok: boolean;
  skipped?: boolean;
  error?: string;
  audit?: ReturnType<typeof auditConvenienceIconReview>;
};

export async function generatePhase1BatchRemaining(): Promise<{
  ok: boolean;
  results: TargetResult[];
  error?: string;
}> {
  if (PHASE1_BATCH_GENERATION.approvedSprint !== '56-F') {
    return { ok: false, results: [], error: 'Phase 1 batch generation not approved for this sprint' };
  }

  const masterPaths = [
    PATHS.cupRamenMaster,
    PATHS.cupRiceMaster,
    PATHS.triangleKimbapMaster,
    PATHS.milkMaster,
    PATHS.saladMaster,
  ];
  for (const p of masterPaths) {
    if (!fs.existsSync(p)) {
      return { ok: false, results: [], error: `Missing master at ${p}` };
    }
  }

  if (!fs.existsSync(PATHS.saladMaster)) {
    const saladApprove = approveSaladMaster();
    if (!saladApprove.ok) {
      return {
        ok: false,
        results: [],
        error: saladApprove.error ?? 'salad master approval failed',
      };
    }
  }

  const hashesBefore = {
    cup_ramen: sha256File(PATHS.cupRamenMaster),
    cup_rice: sha256File(PATHS.cupRiceMaster),
    triangle_kimbap: sha256File(PATHS.triangleKimbapMaster),
    milk: sha256File(PATHS.milkMaster),
    salad: sha256File(PATHS.saladMaster),
  };

  const metrics = analyzeReferenceSet(PATHS.ingredientsDir, [...REFERENCE_INGREDIENT_KEYS]);
  const profile = buildRenderProfileFromMetrics(metrics);

  fs.mkdirSync(PATHS.generatedRoot, { recursive: true });
  fs.mkdirSync(path.join(PATHS.generatedRoot, 'prompts'), { recursive: true });
  fs.writeFileSync(PATHS.renderProfileJson, JSON.stringify(profile, null, 2), 'utf8');
  fs.writeFileSync(PATHS.metricsJson, JSON.stringify(metrics, null, 2), 'utf8');

  const env = getProviderEnv(PATHS.appRoot);
  const gate = checkProviderGate(env);
  if (!gate.ready) {
    printProviderNotConfigured(gate);
    return { ok: false, results: [], error: gate.status };
  }

  const provider = createImageProvider(env);
  const results: TargetResult[] = [];

  for (const target of PHASE1_BATCH_GENERATION.targets) {
    const outAbs = path.join(PATHS.reviewDir, target.reviewFile);
    if (fs.existsSync(outAbs)) {
      console.log(`Skip ${target.reviewFile} — already exists`);
      const audit = auditConvenienceIconReview({
        abs: outAbs,
        iconKey: target.iconKey,
        profile,
        linearScale: 1,
        targetBboxMinPct: PHASE1_BATCH_GENERATION.targetBboxMinPct,
        targetBboxMaxPct: PHASE1_BATCH_GENERATION.targetBboxMaxPct,
      });
      results.push({
        iconKey: target.iconKey,
        reviewFile: target.reviewFile,
        ok: true,
        skipped: true,
        audit,
      });
      continue;
    }

    const prompt = buildPhase1BatchPrompt(target.iconKey, profile);
    const promptPath = path.join(
      PATHS.generatedRoot,
      'prompts',
      `${target.iconKey}_v1.md`,
    );
    fs.writeFileSync(promptPath, `# ${target.iconKey} v1 (Sprint 56-F)\n\n${prompt}\n`, 'utf8');

    console.log(`Generating ${target.reviewFile} via ${provider.name}…`);

    try {
      const gen = await provider.generateImage({
        assetKey: target.assetKey,
        subject: target.iconKey,
        prompt,
        width: INGREDIENT_IMAGE_SPEC.width,
        height: INGREDIENT_IMAGE_SPEC.height,
        format: INGREDIENT_IMAGE_SPEC.format,
      });

      if (!gen.bytes?.length) {
        results.push({
          iconKey: target.iconKey,
          reviewFile: target.reviewFile,
          ok: false,
          error: 'empty image bytes',
        });
        continue;
      }

      fs.mkdirSync(PATHS.reviewDir, { recursive: true });
      const saved = saveImageFile({
        bytes: Buffer.from(gen.bytes),
        absolutePath: outAbs,
        force: true,
      });
      if (saved.status === 'error') {
        results.push({
          iconKey: target.iconKey,
          reviewFile: target.reviewFile,
          ok: false,
          error: saved.error,
        });
        continue;
      }

      const scaled = scaleReviewPngToBbox(
        outAbs,
        target.assetKey,
        PHASE1_BATCH_GENERATION.targetBboxMinPct,
        PHASE1_BATCH_GENERATION.targetBboxMaxPct,
      );
      console.log(`Scaled ${target.iconKey} ${scaled.linearScale}x → bbox ${scaled.bboxPct}%`);

      const audit = auditConvenienceIconReview({
        abs: outAbs,
        iconKey: target.iconKey,
        profile,
        linearScale: scaled.linearScale,
        targetBboxMinPct: PHASE1_BATCH_GENERATION.targetBboxMinPct,
        targetBboxMaxPct: PHASE1_BATCH_GENERATION.targetBboxMaxPct,
      });

      results.push({
        iconKey: target.iconKey,
        reviewFile: target.reviewFile,
        ok: true,
        audit,
      });
    } catch (err) {
      results.push({
        iconKey: target.iconKey,
        reviewFile: target.reviewFile,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (sha256File(PATHS.cupRamenMaster) !== hashesBefore.cup_ramen) {
    return { ok: false, results, error: 'cup_ramen master changed during batch' };
  }
  if (sha256File(PATHS.cupRiceMaster) !== hashesBefore.cup_rice) {
    return { ok: false, results, error: 'cup_rice master changed during batch' };
  }
  if (sha256File(PATHS.triangleKimbapMaster) !== hashesBefore.triangle_kimbap) {
    return { ok: false, results, error: 'triangle_kimbap master changed during batch' };
  }
  if (sha256File(PATHS.milkMaster) !== hashesBefore.milk) {
    return { ok: false, results, error: 'milk master changed during batch' };
  }
  if (sha256File(PATHS.saladMaster) !== hashesBefore.salad) {
    return { ok: false, results, error: 'salad master changed during batch' };
  }

  const auditReport = {
    sprint: '56-F',
    generatedAt: new Date().toISOString(),
    mastersCount: 5,
    batchReviewCount: results.filter((r) => r.ok).length,
    pendingMasterApproval: results.filter((r) => r.ok).length,
    autoApproved: false,
    productionWired: false,
    icons: Object.fromEntries(
      results
        .filter((r) => r.audit)
        .map((r) => [
          r.iconKey,
          {
            reviewFile: r.reviewFile,
            grade: r.audit!.grade,
            bboxPct: r.audit!.bboxPct,
            linearScale: r.audit!.linearScale,
            masterFamilyDistance: r.audit!.masterFamilyDistance,
            backgroundRgb: r.audit!.metrics.backgroundRgb,
            paddingTopPct: Number(r.audit!.metrics.paddingTopPct.toFixed(1)),
            paddingBottomPct: Number(r.audit!.metrics.paddingBottomPct.toFixed(1)),
            foregroundPixelRatio: Number(
              (r.audit!.metrics.foregroundPixelRatio * 100).toFixed(1),
            ),
            fileBytes: r.audit!.metrics.fileBytes,
            reasons: r.audit!.reasons,
            skippedExisting: r.skipped ?? false,
            generationOk: r.ok,
            error: r.error ?? null,
          },
        ]),
    ),
  };

  fs.writeFileSync(PATHS.batchAuditJson, JSON.stringify(auditReport, null, 2), 'utf8');

  let existingApproved: Record<string, unknown> = {};
  if (fs.existsSync(PATHS.approvedMastersJson)) {
    existingApproved = JSON.parse(fs.readFileSync(PATHS.approvedMastersJson, 'utf8')) as Record<
      string,
      unknown
    >;
  }

  const approvedUpdate = {
    ...existingApproved,
    phase1BatchReview: {
      sprint: '56-F',
      reviewOnly: true,
      masterAutoApproval: false,
      icons: PHASE1_BATCH_GENERATION.targets.map((t) => t.iconKey),
      auditFile: 'PHASE1_BATCH_AUDIT.json',
    },
    productionWired: false,
    registryWired: false,
    uiWired: false,
  };
  fs.writeFileSync(PATHS.approvedMastersJson, JSON.stringify(approvedUpdate, null, 2), 'utf8');

  writePhase1BatchReviewHtml({ profile, audits: results });

  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    return {
      ok: false,
      results,
      error: `batch had ${failed.length} failures: ${failed.map((f) => f.iconKey).join(', ')}`,
    };
  }

  return { ok: true, results };
}
