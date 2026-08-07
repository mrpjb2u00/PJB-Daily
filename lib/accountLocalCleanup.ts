import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVED_EMAIL_KEY = '@pjb_last_email';
const TASK_DRAFT_KEY = 'draft:task:new';
const NOTE_DRAFT_KEY = 'draft:note:new';
const DAILY_BRIEFING_PREFIX = '@pjb_daily_briefing_viewed';
const SUPABASE_AUTH_KEYS = [
  'sb-cgpmkbzjhrfrlurwnfvv-auth-token',
  'sb-cgpmkbzjhrfrlurwnfvv-auth-token-code-verifier',
  'sb-cgpmkbzjhrfrlurwnfvv-auth-token-user',
];

function getDailyBriefingUserPrefix(userId: string): string {
  return `${DAILY_BRIEFING_PREFIX}:${userId}:`;
}

export async function clearAccountLocalState(userId?: string | null): Promise<void> {
  const keysToRemove = new Set<string>([
    SAVED_EMAIL_KEY,
    TASK_DRAFT_KEY,
    NOTE_DRAFT_KEY,
    ...SUPABASE_AUTH_KEYS,
  ]);

  let allKeys: readonly string[] = [];
  try {
    allKeys = await AsyncStorage.getAllKeys();
  } catch {
    allKeys = [];
  }

  const dailyBriefingUserPrefix = userId ? getDailyBriefingUserPrefix(userId) : null;

  allKeys.forEach((key) => {
    if (dailyBriefingUserPrefix && key.startsWith(dailyBriefingUserPrefix)) {
      keysToRemove.add(key);
    }
  });

  if (keysToRemove.size === 0) return;

  await AsyncStorage.multiRemove(Array.from(keysToRemove));
}
