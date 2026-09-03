/**
 * Capture / save / share for the elementary breakfast weekly plan card.
 * Native modules stay here so Node QA can import display helpers without loading them.
 */
import { Platform, Share } from 'react-native';
import type { RefObject } from 'react';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import {
  WEEKLY_PLAN_SHARE_OUTPUT_HEIGHT,
  WEEKLY_PLAN_SHARE_OUTPUT_WIDTH,
} from '../../constants/elementaryBreakfastShareCard';
import { elementaryBreakfastWeeklyPlanCopy as copy } from '../../constants/elementaryBreakfastWeeklyPlanCopy';

export type WeeklyPlanShareResult =
  | 'ok'
  | 'cancelled'
  | 'permission_denied'
  | 'unavailable'
  | 'failed';

export function isWeeklyPlanShareCancelError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  return (
    lower.includes('cancel') ||
    lower.includes('dismiss') ||
    lower.includes('user did not share')
  );
}

export async function captureElementaryBreakfastShareCard(
  viewRef: RefObject<unknown>,
): Promise<string> {
  const node = viewRef.current;
  if (!node) {
    throw new Error('share card is not mounted');
  }
  return captureRef(node, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
    fileName: 'hankki-elementary-breakfast-week',
    width: WEEKLY_PLAN_SHARE_OUTPUT_WIDTH,
    height: WEEKLY_PLAN_SHARE_OUTPUT_HEIGHT,
  });
}

export async function saveElementaryBreakfastShareImage(
  uri: string,
): Promise<WeeklyPlanShareResult> {
  try {
    const available = await MediaLibrary.isAvailableAsync();
    if (!available) return 'unavailable';

    const permission = await MediaLibrary.requestPermissionsAsync(true, ['photo']);
    if (!permission.granted) return 'permission_denied';

    await MediaLibrary.saveToLibraryAsync(uri);
    return 'ok';
  } catch (error) {
    if (isWeeklyPlanShareCancelError(error)) return 'cancelled';
    return 'failed';
  }
}

export async function shareElementaryBreakfastShareImage(
  uri: string,
): Promise<WeeklyPlanShareResult> {
  try {
    if (Platform.OS === 'ios') {
      const result = await Share.share({
        url: uri,
        message: copy.shareText,
      });
      if (result.action === Share.dismissedAction) return 'cancelled';
      return 'ok';
    }

    const available = await Sharing.isAvailableAsync();
    if (!available) return 'unavailable';

    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: copy.shareText,
      UTI: 'public.png',
    });
    return 'ok';
  } catch (error) {
    if (isWeeklyPlanShareCancelError(error)) return 'cancelled';
    return 'failed';
  }
}
