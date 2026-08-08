type EnvIssueCode =
  | 'missing_supabase_url'
  | 'invalid_supabase_url'
  | 'placeholder_supabase_url'
  | 'missing_supabase_anon_key'
  | 'placeholder_supabase_anon_key';

export type AppEnvState =
  | {
      valid: true;
      supabaseUrl: string;
      supabaseAnonKey: string;
      issues: [];
    }
  | {
      valid: false;
      supabaseUrl: null;
      supabaseAnonKey: null;
      issues: EnvIssueCode[];
    };

const PLACEHOLDER_SUPABASE_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_SUPABASE_ANON_KEY = 'placeholder-key';

function cleanEnvValue(value: string | undefined): string {
  return value?.trim() ?? '';
}

function isHttpsUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

export function validateAppEnv(): AppEnvState {
  const supabaseUrl = cleanEnvValue(process.env.EXPO_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = cleanEnvValue(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
  const issues: EnvIssueCode[] = [];

  if (!supabaseUrl) {
    issues.push('missing_supabase_url');
  } else if (supabaseUrl === PLACEHOLDER_SUPABASE_URL) {
    issues.push('placeholder_supabase_url');
  } else if (!isHttpsUrl(supabaseUrl)) {
    issues.push('invalid_supabase_url');
  }

  if (!supabaseAnonKey) {
    issues.push('missing_supabase_anon_key');
  } else if (supabaseAnonKey === PLACEHOLDER_SUPABASE_ANON_KEY) {
    issues.push('placeholder_supabase_anon_key');
  }

  if (issues.length > 0) {
    return {
      valid: false,
      supabaseUrl: null,
      supabaseAnonKey: null,
      issues,
    };
  }

  return {
    valid: true,
    supabaseUrl,
    supabaseAnonKey,
    issues: [],
  };
}

export const appEnv = validateAppEnv();
