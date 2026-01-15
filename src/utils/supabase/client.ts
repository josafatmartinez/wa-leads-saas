import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/utils/supabase/env";

type SupabaseGlobal = typeof globalThis & {
  _supabaseClient?: SupabaseClient;
};

const globalForSupabase = globalThis as SupabaseGlobal;

export function getSupabaseClient(): SupabaseClient {
  if (!globalForSupabase._supabaseClient) {
    const { url, anonKey } = getSupabaseEnv();
    const client = createBrowserClient(url, anonKey);
    globalForSupabase._supabaseClient = client;
  }
  return globalForSupabase._supabaseClient;
}
