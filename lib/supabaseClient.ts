import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appEnv } from '@/lib/env';

function createUnavailableSupabaseClient(): SupabaseClient {
  return new Proxy({} as SupabaseClient, {
    get() {
      throw new Error('Supabase is not configured.');
    },
  });
}

export const supabaseConfig = appEnv;
export const supabaseConfigured = appEnv.valid;

export const supabase = appEnv.valid
  ? createClient(appEnv.supabaseUrl, appEnv.supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : createUnavailableSupabaseClient();
