/**
 * Baby grocery checklist persistence — separate from weekly plan storage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { reconcileCheckedRowIds } from './babyGroceryChecklist';

export const BABY_GROCERY_CHECKLIST_STORAGE_KEY = '@hankki/baby_grocery_checklist';

const STORAGE_VERSION = 1;

export type BabyGroceryChecklistStoredState = {
  version: number;
  fingerprint: string;
  checkedRowIds: string[];
};

let memoryFingerprint: string | null = null;
let memoryCheckedRowIds = new Set<string>();

export function resetBabyGroceryChecklistMemoryForTests(): void {
  memoryFingerprint = null;
  memoryCheckedRowIds = new Set();
}

export async function loadBabyGroceryChecklistCheckedIds(
  fingerprint: string,
  validRowKeys: readonly string[],
): Promise<Set<string>> {
  if (memoryFingerprint === fingerprint) {
    return reconcileCheckedRowIds(
      [...memoryCheckedRowIds],
      validRowKeys,
      fingerprint,
      fingerprint,
    );
  }

  const raw = await AsyncStorage.getItem(BABY_GROCERY_CHECKLIST_STORAGE_KEY);
  if (!raw) {
    memoryFingerprint = fingerprint;
    memoryCheckedRowIds = new Set();
    return new Set();
  }

  try {
    const parsed = JSON.parse(raw) as BabyGroceryChecklistStoredState;
    if (parsed?.version !== STORAGE_VERSION) {
      memoryFingerprint = fingerprint;
      memoryCheckedRowIds = new Set();
      return new Set();
    }
    const checked = reconcileCheckedRowIds(
      parsed.checkedRowIds ?? [],
      validRowKeys,
      fingerprint,
      parsed.fingerprint ?? null,
    );
    memoryFingerprint = fingerprint;
    memoryCheckedRowIds = new Set(checked);
    return checked;
  } catch {
    memoryFingerprint = fingerprint;
    memoryCheckedRowIds = new Set();
    return new Set();
  }
}

export async function saveBabyGroceryChecklistCheckedIds(
  fingerprint: string,
  checkedRowIds: ReadonlySet<string>,
): Promise<void> {
  memoryFingerprint = fingerprint;
  memoryCheckedRowIds = new Set(checkedRowIds);
  const payload: BabyGroceryChecklistStoredState = {
    version: STORAGE_VERSION,
    fingerprint,
    checkedRowIds: [...checkedRowIds],
  };
  await AsyncStorage.setItem(BABY_GROCERY_CHECKLIST_STORAGE_KEY, JSON.stringify(payload));
}

export async function clearBabyGroceryChecklistStorage(): Promise<void> {
  memoryFingerprint = null;
  memoryCheckedRowIds = new Set();
  await AsyncStorage.removeItem(BABY_GROCERY_CHECKLIST_STORAGE_KEY);
}
