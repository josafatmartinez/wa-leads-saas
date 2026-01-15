import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { getSupabaseEnv } from "@/utils/supabase/env";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const redirect = url.searchParams.get("redirect") || "/dashboard/leads";

  if (!code) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const { url: supabaseUrl, anonKey } = getSupabaseEnv();
  const cookieStore = cookies();
  let supabaseResponse = NextResponse.next();

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const destination = new URL(redirect, url.origin);
  const redirectResponse = NextResponse.redirect(destination);
  supabaseResponse.cookies.getAll().forEach((cookie) =>
    redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
  );
  return redirectResponse;
}
