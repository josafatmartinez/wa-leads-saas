import { NextRequest, NextResponse } from "next/server";
import { buildBackendHeaders, getBackendApiUrl, withApiPrefix } from "@/lib/backend-api";

const TENANT_ID_COOKIE = "wa_tenant_id";
const TENANT_NAME_COOKIE = "wa_tenant_name";

type Params = {
  params: Promise<{ token: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!token) {
    return NextResponse.json({ ok: false, error: "Token inválido" }, { status: 400 });
  }

  const upstream = await fetch(getBackendApiUrl(withApiPrefix(`/api/invitations/${encodeURIComponent(token)}/accept`)), {
    method: "POST",
    headers: buildBackendHeaders(request),
    cache: "no-store",
  });

  const payload = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    const message = payload?.error?.message || payload?.message || "No se pudo aceptar la invitación";
    return NextResponse.json({ ok: false, error: message }, { status: upstream.status });
  }

  const response = NextResponse.json({
    ok: true,
    member: payload?.data?.member || payload?.member || null,
    invitation: payload?.data?.invitation || payload?.invitation || null,
  });

  const member = payload?.data?.member || payload?.member || null;
  const invitation = payload?.data?.invitation || payload?.invitation || null;
  const tenantId =
    member?.tenant_id ||
    member?.tenantId ||
    member?.tenant?.id ||
    invitation?.tenant_id ||
    invitation?.tenantId ||
    invitation?.tenant?.id ||
    payload?.data?.tenant_id ||
    payload?.data?.tenantId ||
    payload?.tenant_id ||
    payload?.tenantId;
  const tenantName =
    member?.tenant?.name ||
    invitation?.tenant_name ||
    invitation?.tenantName ||
    invitation?.tenant?.name ||
    payload?.data?.tenant_name ||
    payload?.data?.tenantName ||
    payload?.tenant_name ||
    payload?.tenantName;

  if (tenantId) {
    response.cookies.set(TENANT_ID_COOKIE, String(tenantId), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  if (tenantName) {
    response.cookies.set(TENANT_NAME_COOKIE, String(tenantName), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return response;
}
