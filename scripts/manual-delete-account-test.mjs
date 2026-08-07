import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const REQUIRED_STATUS = 'deleted';
const OWNER_BLOCK_CODE = 'owner_account';

function readPublicEnvFromDotenv(name) {
  const envPath = resolve(process.cwd(), '.env');

  try {
    const content = readFileSync(envPath, 'utf8');
    const line = content
      .split(/\r?\n/)
      .find((entry) => entry.trim().startsWith(`${name}=`));

    if (!line) return undefined;

    const [, ...valueParts] = line.split('=');
    return valueParts.join('=').trim().replace(/^['"]|['"]$/g, '');
  } catch {
    return undefined;
  }
}

function getRequiredEnv(name, options = {}) {
  const value = process.env[name] ?? (options.allowDotenv ? readPublicEnvFromDotenv(name) : undefined);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function reportFailure(message) {
  console.error(`delete-account test failed: ${message}`);
  process.exitCode = 1;
}

async function main() {
  const supabaseUrl = getRequiredEnv('EXPO_PUBLIC_SUPABASE_URL', { allowDotenv: true });
  const supabaseAnonKey = getRequiredEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', { allowDotenv: true });
  const disposableEmail = getRequiredEnv('DISPOSABLE_TEST_EMAIL');
  const disposablePassword = getRequiredEnv('DISPOSABLE_TEST_PASSWORD');

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: disposableEmail,
    password: disposablePassword,
  });

  if (signInError || !signInData.session) {
    reportFailure('disposable account sign-in did not succeed.');
    return;
  }

  const { data, error } = await supabase.functions.invoke('delete-account', {
    body: {},
  });

  if (error) {
    reportFailure('delete-account invocation returned an error.');
    return;
  }

  if (data?.status === REQUIRED_STATUS) {
    console.log('delete-account test succeeded: disposable account deletion was accepted.');
    return;
  }

  if (data?.status === 'blocked' && data?.code === OWNER_BLOCK_CODE) {
    reportFailure('delete-account was blocked because the signed-in account is protected.');
    return;
  }

  reportFailure('delete-account returned an unexpected safe response.');
}

main().catch(() => {
  reportFailure('an unexpected local script error occurred.');
});
