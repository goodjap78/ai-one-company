/**
 * Dinner weekly plan share wrappers.
 */
import type { RefObject } from 'react';
import { elementaryDinnerWeeklyPlanCopy as copy } from '../../constants/elementaryDinnerWeeklyPlanCopy';
import {
  captureWeeklyPlanShareCard,
  saveWeeklyPlanShareImage,
  shareWeeklyPlanShareImage,
  type WeeklyPlanShareResult,
} from './weeklyPlanShare';

export type { WeeklyPlanShareResult };

export { isWeeklyPlanShareCancelError } from './weeklyPlanShare';

export async function captureElementaryDinnerShareCard(
  viewRef: RefObject<unknown>,
): Promise<string> {
  return captureWeeklyPlanShareCard(viewRef, 'hankki-elementary-dinner-week');
}

export async function saveElementaryDinnerShareImage(uri: string): Promise<WeeklyPlanShareResult> {
  return saveWeeklyPlanShareImage(uri);
}

export async function shareElementaryDinnerShareImage(uri: string): Promise<WeeklyPlanShareResult> {
  return shareWeeklyPlanShareImage(uri, copy.shareText);
}
