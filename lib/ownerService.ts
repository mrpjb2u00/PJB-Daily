import { supabase } from '@/lib/supabaseClient';

const OWNER_AUTHORIZATION_ERROR = 'Could not verify owner access.';

export async function fetchIsOwner(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_owner');

  if (error) {
    throw new Error(OWNER_AUTHORIZATION_ERROR);
  }

  return data === true;
}

export { OWNER_AUTHORIZATION_ERROR };
