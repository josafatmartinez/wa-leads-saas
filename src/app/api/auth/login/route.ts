import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/utils/supabase/env";

type LoginPayload = {
  email: string;
  password: string;
  remember?: boolean;
};

const MAX_30_DAYS = 60 * 60 * 24 * 30;

export async function POST(request: NextRequest) {
  const { email, password, remember = false } = (await request.json()) as LoginPayload;

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, message: "Email y contraseña son requeridos." },
      { status: 400 }
    );
  }

  const { url, anonKey } = getSupabaseEnv();
  const response = NextResponse.json({ ok: true });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, {
            ...options,
            ...(remember ? { maxAge: MAX_30_DAYS } : {}),
          })
        );
      },
    },
  });

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 401 });
  }

  return response;
}
