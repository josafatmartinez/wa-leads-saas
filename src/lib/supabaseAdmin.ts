import { createClient } from '@supabase/supabase-js';

let client: ReturnType<typeof createClient> | null = null;

function getSupabaseAdminClient() {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  client = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return client;
}

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    const resolvedClient = getSupabaseAdminClient() as unknown as Record<PropertyKey, unknown>;
    return resolvedClient[prop];
  },
});
