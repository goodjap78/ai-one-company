export function estimateStepMinutes(
  totalCookingMinutes: number,
  totalSteps: number,
): number | null {
  if (totalCookingMinutes <= 0 || totalSteps <= 0) return null;
  return Math.max(1, Math.round(totalCookingMinutes / totalSteps));
}

export function buildProgressBar(currentStep: number, totalSteps: number, blocks = 8): string {
  if (totalSteps <= 0) return '░'.repeat(blocks) + ' 0%';

  const percent = Math.round((currentStep / totalSteps) * 100);
  const filled = Math.min(blocks, Math.max(0, Math.round((currentStep / totalSteps) * blocks)));

  return `${'█'.repeat(filled)}${'░'.repeat(blocks - filled)} ${percent}%`;
}
