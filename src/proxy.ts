import { type NextRequest, NextResponse } from "next/server";
import { getMiddlewareSupabaseClient } from "@/utils/supabase/middleware";

const PUBLIC_PATHS = [
  "/login",
  "/auth/callback",
  "/auth/error",
  "/api/public",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export async function proxy(request: NextRequest) {
  const { supabase, response } = getMiddlewareSupabaseClient(request);
  const { data } = await supabase.auth.getSession(); // refresh session if needed

  if (!data.session && !isPublicPath(request.nextUrl.pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
    const redirectResponse = NextResponse.redirect(loginUrl);

    // Preserve cookies set by Supabase (if any) on the redirect response
    response.cookies.getAll().forEach((cookie) =>
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    );

    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
