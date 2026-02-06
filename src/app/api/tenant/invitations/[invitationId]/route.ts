import { NextRequest, NextResponse } from "next/server";
import { buildBackendHeaders, getBackendApiUrl, withApiPrefix } from "@/lib/backend-api";

async function resolveTenantId(request: NextRequest) {
  const url = new URL("/api/tenant", request.url);
  const upstream = await fetch(url, {
    method: "GET",
    headers: buildBackendHeaders(request),
    cache: "no-store",
  });

  if (!upstream.ok) return null;
  const payload = await upstream.json().catch(() => null);
  return payload?.tenant?.id || null;
}

type Params = {
  params: Promise<{ invitationId: string }>;
};

export async function DELETE(request: NextRequest, { params }: Params) {
  const tenantId = await resolveTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ ok: false, error: "Debes crear un tenant primero" }, { status: 400 });
  }

  const { invitationId } = await params;
  if (!invitationId) {
    return NextResponse.json({ ok: false, error: "invitationId inválido" }, { status: 400 });
  }

  const upstream = await fetch(
    getBackendApiUrl(
      withApiPrefix(`/api/tenants/${encodeURIComponent(tenantId)}/invitations/${encodeURIComponent(invitationId)}`)
    ),
    {
      method: "DELETE",
      headers: buildBackendHeaders(request),
      cache: "no-store",
    }
  );

  const payload = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    const message = payload?.error?.message || payload?.message || "No se pudo revocar la invitación";
    return NextResponse.json({ ok: false, error: message }, { status: upstream.status });
  }

  return NextResponse.json({ ok: true, invitation: payload?.data?.invitation || payload?.invitation || null });
}
