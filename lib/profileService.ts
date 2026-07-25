import { supabase } from '@/lib/supabaseClient';

const PROFILE_TABLE = 'profiles';

export interface Profile {
  id: string;
  username: string | null;
  firstName: string | null;
  birthdayMonth: number | null;
  birthdayDay: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface ProfileRow {
  id: string;
  username: string | null;
  first_name: string | null;
  birthday_month: number | null;
  birthday_day: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProfileUpdate {
  id: string;
  username: string;
  firstName: string;
  birthdayMonth: number | null;
  birthdayDay: number | null;
}

function rowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
    firstName: row.first_name,
    birthdayMonth: row.birthday_month,
    birthdayDay: row.birthday_day,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchProfile(userId: string): Promise<{ profile: Profile | null; error?: string }> {
  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select('id, username, first_name, birthday_month, birthday_day, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) return { profile: null, error: error.message };
  return { profile: data ? rowToProfile(data as ProfileRow) : null };
}

export async function ensureProfile(userId: string): Promise<{ profile: Profile | null; error?: string }> {
  const { error } = await supabase
    .from(PROFILE_TABLE)
    .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true });

  if (error) return { profile: null, error: error.message };
  return fetchProfile(userId);
}

export async function saveProfile(update: ProfileUpdate): Promise<{ profile: Profile | null; error?: string }> {
  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .upsert({
      id: update.id,
      username: update.username,
      first_name: update.firstName,
      birthday_month: update.birthdayMonth,
      birthday_day: update.birthdayDay,
    }, { onConflict: 'id' })
    .select('id, username, first_name, birthday_month, birthday_day, created_at, updated_at')
    .single();

  if (error) return { profile: null, error: error.message };
  return { profile: rowToProfile(data as ProfileRow) };
}
