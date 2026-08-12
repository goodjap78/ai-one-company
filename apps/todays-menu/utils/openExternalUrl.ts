import { Alert, Linking } from 'react-native';

export async function openExternalUrl(
  url: string,
  options?: { failureTitle?: string; failureMessage?: string },
): Promise<boolean> {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      throw new Error('cannot open url');
    }
    await Linking.openURL(url);
    return true;
  } catch {
    Alert.alert(
      options?.failureTitle ?? '열 수 없어요',
      options?.failureMessage ?? '잠시 후 다시 시도해 주세요.',
    );
    return false;
  }
}
