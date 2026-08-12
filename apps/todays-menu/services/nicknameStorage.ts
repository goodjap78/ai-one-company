import AsyncStorage from '@react-native-async-storage/async-storage';

const NICKNAME_KEY = '@todays_menu/nickname';

export async function getNickname(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(NICKNAME_KEY);
  } catch {
    return null;
  }
}

export async function saveNickname(nickname: string): Promise<void> {
  await AsyncStorage.setItem(NICKNAME_KEY, nickname.trim());
}
