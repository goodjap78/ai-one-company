/**
 * Sprint 57 — Write meal-time audit artifacts to generated/.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  buildRecipeMealTimeMetadataMap,
  listRecipeMealTimeMetadata,
} from '../../../data/recommendation/recipeMealTimeMetadata';
import {
  buildFoodTypeGapAnalysis,
  buildMealTimePoolSummary,
  totalExpansionGap070,
} from './computeMealTimePools';

export const MEAL_TIME_GENERATED_DIR = 'generated/meal-time-recommendation';

export type MealTimeAuditRecord = {
  recipeId: string;
  title: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  lateNight: number;
  primaryMealTime: string;
  scoringReason: {
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    lateNight: string[];
  };
  mainCategory: string;
  cookTime: number;
  difficulty: string;
  foodTypes: string[];
};

export function buildMealTimeAuditRecords(): MealTimeAuditRecord[] {
  return listRecipeMealTimeMetadata().map((e) => ({
    recipeId: e.recipeId,
    title: e.title,
    breakfast: e.fit.breakfast,
    lunch: e.fit.lunch,
    dinner: e.fit.dinner,
    lateNight: e.fit.lateNight,
    primaryMealTime: e.primaryMealTime,
    scoringReason: e.reasons,
    mainCategory: e.mainCategory,
    cookTime: e.cookTime,
    difficulty: e.difficulty,
    foodTypes: e.foodTypes,
  }));
}

export function buildMealTimeSummary() {
  const entries = listRecipeMealTimeMetadata();
  const poolSummary = buildMealTimePoolSummary(entries);
  const foodTypeGaps = buildFoodTypeGapAnalysis(entries);
  const topGaps = foodTypeGaps.filter((g) => g.gap > 0).slice(0, 20);

  return {
    recordedAt: new Date().toISOString(),
    sprint: '57',
    recipeCount: entries.length,
    poolSummary,
    totalGap070: totalExpansionGap070(entries),
    foodTypeGapTop: topGaps,
    foodTypeGapAll: foodTypeGaps,
    primaryMealTimeDistribution: {
      breakfast: entries.filter((e) => e.primaryMealTime === 'breakfast').length,
      lunch: entries.filter((e) => e.primaryMealTime === 'lunch').length,
      dinner: entries.filter((e) => e.primaryMealTime === 'dinner').length,
      lateNight: entries.filter((e) => e.primaryMealTime === 'lateNight').length,
    },
  };
}

export function writeMealTimeAuditArtifacts(appRoot: string): {
  auditPath: string;
  summaryPath: string;
  recipeCount: number;
} {
  const outDir = path.join(appRoot, MEAL_TIME_GENERATED_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  const audit = buildMealTimeAuditRecords();
  const summary = buildMealTimeSummary();

  const auditPath = path.join(outDir, 'meal-time-audit.json');
  const summaryPath = path.join(outDir, 'meal-time-summary.json');

  fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2), 'utf8');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');

  return { auditPath, summaryPath, recipeCount: buildRecipeMealTimeMetadataMap().size };
}
