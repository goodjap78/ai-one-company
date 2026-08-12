import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ConversationMemory } from '../../types/conversation';
import {
  createDefaultConversationMemory,
  MOCK_CONVERSATION_MEMORY,
} from './mockMemoryData';

const CONVERSATION_MEMORY_KEY = '@hankki/conversation_memory';
const USE_MOCK_SEED = __DEV__;

function isConversationMemory(value: unknown): value is ConversationMemory {
  if (!value || typeof value !== 'object') return false;

  const record = value as ConversationMemory;
  return (
    typeof record.conversationCount === 'number' &&
    typeof record.updatedAt === 'string' &&
    (record.lastGreeting === null || typeof record.lastGreeting === 'string') &&
    (record.lastRecommendation === null || typeof record.lastRecommendation === 'string')
  );
}

async function readConversationMemory(): Promise<ConversationMemory | null> {
  try {
    const raw = await AsyncStorage.getItem(CONVERSATION_MEMORY_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    return isConversationMemory(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function writeConversationMemory(memory: ConversationMemory): Promise<void> {
  await AsyncStorage.setItem(CONVERSATION_MEMORY_KEY, JSON.stringify(memory));
}

export async function getConversationMemory(): Promise<ConversationMemory> {
  const stored = await readConversationMemory();
  if (stored) return stored;

  if (USE_MOCK_SEED) {
    await writeConversationMemory(MOCK_CONVERSATION_MEMORY);
    return MOCK_CONVERSATION_MEMORY;
  }

  const fresh = createDefaultConversationMemory();
  await writeConversationMemory(fresh);
  return fresh;
}

export async function saveConversationMemory(
  patch: Partial<Omit<ConversationMemory, 'updatedAt'>>,
): Promise<ConversationMemory> {
  const current = await getConversationMemory();

  const next: ConversationMemory = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  await writeConversationMemory(next);
  return next;
}

export async function incrementConversationCount(): Promise<ConversationMemory> {
  const current = await getConversationMemory();
  return saveConversationMemory({
    conversationCount: current.conversationCount + 1,
  });
}

export async function recordGreeting(greeting: string): Promise<ConversationMemory> {
  return saveConversationMemory({ lastGreeting: greeting });
}

export async function recordRecommendation(recipeId: string): Promise<ConversationMemory> {
  return saveConversationMemory({ lastRecommendation: recipeId });
}
