import { NextRequest, NextResponse } from "next/server";

const TENANT_ID = process.env.WA_LEADS_TENANT_ID || "default";
const BOT_ENABLED_COOKIE = "wa_bot_enabled";
const WELCOME_TEXT_COOKIE = "wa_welcome_text";
const CLOSING_TEXT_COOKIE = "wa_closing_text";

async function resolveTenantId(request: NextRequest) {
  if (process.env.WA_LEADS_TENANT_ID) return process.env.WA_LEADS_TENANT_ID;

  const upstream = await fetch(new URL("/api/tenant", request.url), {
    method: "GET",
    headers: {
      cookie: request.headers.get("cookie") ?? "",
      ...(request.headers.get("authorization")
        ? { authorization: request.headers.get("authorization") as string }
        : {}),
    },
    cache: "no-store",
  });

  if (!upstream.ok) return null;
  const payload = await upstream.json().catch(() => null);
  return payload?.tenant?.id || null;
}

export async function GET(request: NextRequest) {
  const tenantId = (await resolveTenantId(request)) || TENANT_ID;
  const botEnabled = request.cookies.get(BOT_ENABLED_COOKIE)?.value;
  const welcomeText = request.cookies.get(WELCOME_TEXT_COOKIE)?.value || "";
  const closingText = request.cookies.get(CLOSING_TEXT_COOKIE)?.value || "";

  return NextResponse.json({
    ok: true,
    config: {
      tenant_id: tenantId,
      bot_enabled: botEnabled ? botEnabled === "1" : true,
      welcome_text: welcomeText,
      closing_text: closingText,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    bot_enabled?: boolean;
    welcome_text?: string;
    closing_text?: string;
  };

  const botEnabled = Boolean(body.bot_enabled);
  const welcomeText = body.welcome_text || "";
  const closingText = body.closing_text || "";

  const response = NextResponse.json({
    ok: true,
    config: {
      tenant_id: (await resolveTenantId(request)) || TENANT_ID,
      bot_enabled: botEnabled,
      welcome_text: welcomeText,
      closing_text: closingText,
    },
  });

  response.cookies.set(BOT_ENABLED_COOKIE, botEnabled ? "1" : "0", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  response.cookies.set(WELCOME_TEXT_COOKIE, welcomeText, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  response.cookies.set(CLOSING_TEXT_COOKIE, closingText, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
