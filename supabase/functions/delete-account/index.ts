type JsonBody = {
  status: 'deleted' | 'blocked' | 'error';
  code?: 'owner_account' | 'unauthorized' | 'method_not_allowed' | 'server_error';
};

type SupabaseUserResponse = {
  id?: string;
  user?: {
    id?: string;
  };
};

type OwnerResponse = boolean | {
  is_owner?: boolean;
};

declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: JsonBody, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get('Authorization') ?? '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

function getUserId(payload: SupabaseUserResponse): string | null {
  return payload.user?.id ?? payload.id ?? null;
}

async function validateUser(supabaseUrl: string, serviceRoleKey: string, token: string): Promise<string | null> {
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return null;

  const payload = await response.json() as SupabaseUserResponse;
  return getUserId(payload);
}

async function isOwner(supabaseUrl: string, serviceRoleKey: string, token: string): Promise<boolean> {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/is_owner`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });

  if (!response.ok) {
    throw new Error('owner_check_failed');
  }

  const payload = await response.json() as OwnerResponse;
  return typeof payload === 'boolean' ? payload : payload.is_owner === true;
}

async function deleteAuthUser(supabaseUrl: string, serviceRoleKey: string, userId: string): Promise<boolean> {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  return response.ok;
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ status: 'error', code: 'method_not_allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const token = getBearerToken(request);

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ status: 'error', code: 'server_error' }, 500);
  }

  if (!token) {
    return jsonResponse({ status: 'error', code: 'unauthorized' }, 401);
  }

  try {
    const userId = await validateUser(supabaseUrl, serviceRoleKey, token);
    if (!userId) {
      return jsonResponse({ status: 'error', code: 'unauthorized' }, 401);
    }

    if (await isOwner(supabaseUrl, serviceRoleKey, token)) {
      return jsonResponse({ status: 'blocked', code: 'owner_account' }, 409);
    }

    const deleted = await deleteAuthUser(supabaseUrl, serviceRoleKey, userId);
    if (!deleted) {
      return jsonResponse({ status: 'error', code: 'server_error' }, 500);
    }

    return jsonResponse({ status: 'deleted' }, 200);
  } catch {
    return jsonResponse({ status: 'error', code: 'server_error' }, 500);
  }
});
