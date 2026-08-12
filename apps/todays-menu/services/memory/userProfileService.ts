import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SaveUserProfileInput, UserProfile } from '../../types/userProfile';
import { getNickname } from '../nicknameStorage';
import {
  createDefaultUserProfile,
  MOCK_USER_PROFILE,
} from './mockMemoryData';

const USER_PROFILE_KEY = '@hankki/user_profile';
const USE_MOCK_SEED = __DEV__;

function isUserProfile(value: unknown): value is UserProfile {
  if (!value || typeof value !== 'object') return false;

  const record = value as UserProfile;
  return (
    typeof record.nickname === 'string' &&
    typeof record.familySize === 'number' &&
    typeof record.hasKids === 'boolean' &&
    typeof record.cookingSkill === 'string' &&
    typeof record.preferredBudget === 'string' &&
    typeof record.spicyLevel === 'string' &&
    Array.isArray(record.allergies) &&
    Array.isArray(record.favoriteCategories) &&
    Array.isArray(record.dislikedIngredients) &&
    typeof record.updatedAt === 'string'
  );
}

async function readUserProfile(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_PROFILE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    return isUserProfile(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function writeUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
}

async function migrateFromNickname(): Promise<UserProfile | null> {
  const nickname = await getNickname();
  if (!nickname) return null;

  const profile = createDefaultUserProfile(nickname);
  await writeUserProfile(profile);
  return profile;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const stored = await readUserProfile();
  if (stored) return stored;

  const migrated = await migrateFromNickname();
  if (migrated) return migrated;

  if (USE_MOCK_SEED) {
    await writeUserProfile(MOCK_USER_PROFILE);
    return MOCK_USER_PROFILE;
  }

  return null;
}

export async function saveUserProfile(input: SaveUserProfileInput): Promise<UserProfile> {
  const current = (await readUserProfile()) ?? createDefaultUserProfile(input.nickname);

  const next: UserProfile = {
    ...current,
    ...input,
    nickname: input.nickname.trim(),
    updatedAt: new Date().toISOString(),
  };

  await writeUserProfile(next);
  return next;
}

export async function updateUserProfile(
  patch: Partial<Omit<UserProfile, 'updatedAt'>>,
): Promise<UserProfile | null> {
  const current = await getUserProfile();
  if (!current) return null;

  return saveUserProfile({ ...current, ...patch });
}
