import { supabase, supabaseConfigured } from '@/lib/supabaseClient';

type DeleteAccountResponse = {
  status?: unknown;
  code?: unknown;
};

export type AccountDeletionResult =
  | { status: 'deleted' }
  | { status: 'owner_blocked' }
  | { status: 'unauthorized' }
  | { status: 'failed' };

function normalizeDeleteAccountResponse(data: unknown): AccountDeletionResult {
  const response = data as DeleteAccountResponse | null;

  if (response?.status === 'deleted') {
    return { status: 'deleted' };
  }

  if (response?.status === 'blocked' && response.code === 'owner_account') {
    return { status: 'owner_blocked' };
  }

  if (response?.status === 'error' && response.code === 'unauthorized') {
    return { status: 'unauthorized' };
  }

  return { status: 'failed' };
}

async function normalizeDeleteAccountError(error: unknown): Promise<AccountDeletionResult> {
  const context = error && typeof error === 'object' && 'context' in error
    ? (error as { context?: unknown }).context
    : null;

  if (context instanceof Response) {
    try {
      return normalizeDeleteAccountResponse(await context.clone().json());
    } catch {
      return { status: 'failed' };
    }
  }

  return { status: 'failed' };
}

export async function deleteCurrentAccount(): Promise<AccountDeletionResult> {
  if (!supabaseConfigured) {
    return { status: 'failed' };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return { status: 'unauthorized' };
  }

  const { data, error } = await supabase.functions.invoke('delete-account', {
    body: {},
  });

  if (error) {
    return normalizeDeleteAccountError(error);
  }

  return normalizeDeleteAccountResponse(data);
}
