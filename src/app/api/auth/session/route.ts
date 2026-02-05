import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { getSupabaseEnv } from "@/utils/supabase/env";

type SessionTokens = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  expires_at?: number;
  provider_token?: string;
  token_type?: string;
};

export async function GET() {
  const supabase = await createServerClientWithCookies();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    return NextResponse.json(
      { ok: false, error: error?.message || "No active session" },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true, user: data.user });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as SessionTokens;
  if (!body.access_token || !body.refresh_token) {
    return NextResponse.json(
      { ok: false, error: "access_token and refresh_token are required" },
      { status: 400 }
    );
  }

  const supabaseResponse = NextResponse.next();
  const supabase = await createServerClientWithCookies(supabaseResponse);

  const { error } = await supabase.auth.setSession({
    access_token: body.access_token,
    refresh_token: body.refresh_token,
    expires_in: body.expires_in,
    expires_at: body.expires_at,
    provider_token: body.provider_token,
    token_type: body.token_type,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return supabaseResponse;
}

async function createServerClientWithCookies(response?: NextResponse) {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        if (!response) return;
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });
}
