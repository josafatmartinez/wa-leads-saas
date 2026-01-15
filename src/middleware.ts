import { type NextRequest } from "next/server";
import { getMiddlewareSupabaseClient } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabase, response } = getMiddlewareSupabaseClient(request);
  await supabase.auth.getSession(); // refresh session if needed
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
