import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, getBackendApiUrl } from "@/lib/backend-api";

type SignupPayload = {
  email: string;
  password: string;
  fullName?: string;
};

type TokenResponse = {
  ok?: boolean;
  session?: {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  } | null;
  error?: { message?: string } | string;
};

async function requestSignup(payload: SignupPayload) {
  const candidates = ["/auth/signup", "/auth/register", "/auth/users"];

  for (const path of candidates) {
    const response = await fetch(getBackendApiUrl(path), {
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

    if (response.status === 404 || response.status === 405) {
      continue;
    }

    return response;
  }

  return null;
}

async function requestToken(payload: { email: string; password: string }) {
  const response = await fetch(getBackendApiUrl("/auth/sessions"), {
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

  const data = (await response.json().catch(() => ({}))) as TokenResponse;
  return { response, data };
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as SignupPayload;

  if (!payload.email || !payload.password) {
    return NextResponse.json({ ok: false, message: "Email y contraseña son requeridos." }, { status: 400 });
  }

  const signupResponse = await requestSignup(payload);

  if (!signupResponse) {
    return NextResponse.json(
      { ok: false, message: "No existe endpoint de registro en la API." },
      { status: 501 }
    );
  }

  const signupBody = await signupResponse.json().catch(() => ({}));
  if (!signupResponse.ok) {
    const message =
      signupBody?.error?.message || signupBody?.message || "No se pudo crear la cuenta.";
    return NextResponse.json({ ok: false, message }, { status: signupResponse.status });
  }

  const { response: tokenResponse, data } = await requestToken({
    email: payload.email,
    password: payload.password,
  });

  if (!tokenResponse.ok || !data?.session?.access_token) {
    return NextResponse.json(
      {
        ok: true,
        requiresEmailConfirmation: true,
        message: "Cuenta creada. Inicia sesión para continuar.",
      },
      { status: 200 }
    );
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
