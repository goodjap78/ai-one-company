/**
 * Shared CLI bootstrap for Production Pipeline commands.
 */
import { runValidationEngine } from '../modules/validationEngine';
import { mergeAndPersistState } from '../modules/dashboard';
import type { PipelineState } from '../types';

export function persistAfterModule(
  moduleKey: keyof PipelineState['lastModules'],
  label: string,
): void {
  const { stats, validation } = runValidationEngine();
  mergeAndPersistState({ [moduleKey]: label }, stats, validation);
}
