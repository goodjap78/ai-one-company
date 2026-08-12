/**
 * Sprint IMG-2 — HANKKI queue / review types (app adapter layer).
 */
import type { ImageQueueStatus } from './engine/types';

export type { ImageQueueStatus };

export type ImageQueueItem = {
  recipeId: string;
  recipeName: string;
  heroImageKey: string;
  promptFile: string;
  outputFile: string;
  status: ImageQueueStatus;
  /** ISO timestamps */
  updatedAt: string;
  error?: string;
  reviewDir?: string;
  candidateFile?: string;
};

export type ImageQueueFile = {
  generatedAt: string;
  sprint: 'IMG-2';
  sourceManifest: string;
  providerHint: string;
  totals: {
    recipes: number;
    queued: number;
    processing: number;
    completed: number;
    failed: number;
    approved: number;
    rejected: number;
  };
  items: ImageQueueItem[];
};

export type ReviewMeta = {
  recipeId: string;
  recipeName: string;
  heroImageKey: string;
  status: ImageQueueStatus;
  createdAt: string;
  updatedAt: string;
  candidateRelative: string;
  productionRelative: string;
  provider?: string;
  notes?: string;
  decision?: 'approve' | 'reject' | 'regenerate';
};

export type ProductionDashboardStats = {
  recipes: number;
  imagesGenerated: number;
  waitingApproval: number;
  approved: number;
  rejected: number;
  missing: number;
  failed: number;
  progressPercent: number;
};
