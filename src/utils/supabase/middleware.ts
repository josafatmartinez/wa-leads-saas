import { createServerClient, type SupabaseClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseEnv } from "@/utils/supabase/env";

type MiddlewareClientResult = {
  supabase: SupabaseClient;
  response: NextResponse;
};

export function getMiddlewareSupabaseClient(request: NextRequest): MiddlewareClientResult {
  const { url, anonKey } = getSupabaseEnv();
  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      get(name) {
        return request.cookies.get(name)?.value;
      },
      set(name, value, options) {
        response.cookies.set(name, value, options);
      },
      remove(name, options) {
        response.cookies.set(name, "", { ...options, maxAge: 0 });
      },
    },
  });

  return { supabase, response };
}
