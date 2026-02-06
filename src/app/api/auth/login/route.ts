import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, getBackendApiUrl } from "@/lib/backend-api";

type TokenResponse = {
  ok?: boolean;
  session?: {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  } | null;
  error?: { message?: string } | string;
};

export async function POST(request: NextRequest) {
  const payload = await request.json();

  const upstream = await fetch(getBackendApiUrl("/auth/sessions"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.WA_LEADS_API_KEY ? { "x-api-key": process.env.WA_LEADS_API_KEY } : {}),
      ...(process.env.WA_LEADS_API_AUTHORIZATION
        ? { authorization: process.env.WA_LEADS_API_AUTHORIZATION }
        : {}),
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = (await upstream.json().catch(() => ({}))) as TokenResponse;

  if (!upstream.ok || !data?.session?.access_token) {
    const message =
      typeof data.error === "string"
        ? data.error
        : data.error?.message || "No se pudo iniciar sesión.";
    return NextResponse.json({ ok: false, message }, { status: upstream.status || 401 });
  }

  const response = NextResponse.json({ ok: true });
  const maxAge = data.session.expires_in ?? 60 * 60;

  response.cookies.set(ACCESS_TOKEN_COOKIE, data.session.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });

  if (data.session.refresh_token) {
    response.cookies.set(REFRESH_TOKEN_COOKIE, data.session.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return response;
}
