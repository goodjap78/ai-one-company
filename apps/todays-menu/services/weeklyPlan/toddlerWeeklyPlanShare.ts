import type { RefObject } from 'react';
import { toddlerWeeklyPlanCopy as copy } from '../../constants/toddlerWeeklyPlanCopy';
import {
  captureWeeklyPlanShareCard,
  saveWeeklyPlanShareImage,
  shareWeeklyPlanShareImage,
  type WeeklyPlanShareResult,
} from './weeklyPlanShare';

export type { WeeklyPlanShareResult };

export { isWeeklyPlanShareCancelError } from './weeklyPlanShare';

export async function captureToddlerWeeklyShareCard(viewRef: RefObject<unknown>): Promise<string> {
  return captureWeeklyPlanShareCard(viewRef, 'hankki-toddler-weekly-plan');
}

export async function saveToddlerWeeklyShareImage(uri: string): Promise<WeeklyPlanShareResult> {
  return saveWeeklyPlanShareImage(uri);
}

export async function shareToddlerWeeklyShareImage(
  uri: string,
  shareText: string = copy.shareText,
): Promise<WeeklyPlanShareResult> {
  return shareWeeklyPlanShareImage(uri, shareText);
}
