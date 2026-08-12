import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETE_KEY = '@hankki/onboarding_complete';

export async function isOnboardingComplete(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function setOnboardingComplete(complete = true): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, complete ? 'true' : 'false');
}
