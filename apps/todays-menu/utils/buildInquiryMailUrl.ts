import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const PUBLIC_SUPPORT_EMAIL = 'goodjap78@gmail.com';

function resolveAppVersion(): string {
  return (
    Constants.expoConfig?.version ??
    Constants.nativeApplicationVersion ??
    '—'
  );
}

function resolveOsLabel(): string {
  if (Platform.OS === 'ios') return 'iOS';
  if (Platform.OS === 'android') return 'Android';
  return Platform.OS;
}

export function buildInquiryMailUrl(): string {
  const body = [
    '안녕하세요. 한끼 앱 문의입니다.',
    '',
    '문의 내용:',
    '',
    '',
    '--------------------',
    `앱 버전: ${resolveAppVersion()}`,
    `운영체제: ${resolveOsLabel()}`,
  ].join('\n');

  const params = new URLSearchParams({
    subject: '[한끼 문의]',
    body,
  });

  return `mailto:${PUBLIC_SUPPORT_EMAIL}?${params.toString()}`;
}
