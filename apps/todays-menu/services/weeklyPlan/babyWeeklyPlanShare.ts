import type { RefObject } from 'react';
import { babyWeeklyPlanCopy as copy } from '../../constants/babyWeeklyPlanCopy';
import {
  captureWeeklyPlanShareCard,
  saveWeeklyPlanShareImage,
  shareWeeklyPlanShareImage,
  type WeeklyPlanShareResult,
} from './weeklyPlanShare';

export type { WeeklyPlanShareResult };

export { isWeeklyPlanShareCancelError } from './weeklyPlanShare';

export async function captureBabyWeeklyShareCard(viewRef: RefObject<unknown>): Promise<string> {
  return captureWeeklyPlanShareCard(viewRef, 'hankki-baby-weekly-plan');
}

export async function saveBabyWeeklyShareImage(uri: string): Promise<WeeklyPlanShareResult> {
  return saveWeeklyPlanShareImage(uri);
}

export async function shareBabyWeeklyShareImage(uri: string): Promise<WeeklyPlanShareResult> {
  return shareWeeklyPlanShareImage(uri, copy.shareText);
}
