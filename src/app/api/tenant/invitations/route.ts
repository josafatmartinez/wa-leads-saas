import { NextRequest, NextResponse } from "next/server";
import { buildBackendHeaders, getBackendApiUrl, withApiPrefix } from "@/lib/backend-api";

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

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

function normalizeInvitations(payload: unknown) {
  const root = toRecord(payload);
  const data = toRecord(root?.data);
  const invitations =
    (Array.isArray(data?.invitations) ? data?.invitations : null) ||
    (Array.isArray(root?.invitations) ? root?.invitations : null) ||
    [];

  return invitations
    .map((item) => toRecord(item))
    .filter(Boolean)
    .map((invitation) => ({
      id: String(invitation?.id || ""),
      tenant_id: String(invitation?.tenant_id || ""),
      email: String(invitation?.email || ""),
      role: String(invitation?.role || "viewer"),
      status: String(invitation?.status || "pending"),
      invited_by: String(invitation?.invited_by || ""),
      expires_at: String(invitation?.expires_at || ""),
      accepted_at: (invitation?.accepted_at as string | null | undefined) || null,
      created_at: String(invitation?.created_at || ""),
    }))
    .filter((invitation) => invitation.id && invitation.tenant_id && invitation.email);
}

export async function GET(request: NextRequest) {
  const tenantId = await resolveTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ ok: false, error: "Debes crear un tenant primero" }, { status: 400 });
  }

  const upstream = await fetch(
    getBackendApiUrl(withApiPrefix(`/api/tenants/${encodeURIComponent(tenantId)}/invitations`)),
    {
      method: "GET",
      headers: buildBackendHeaders(request),
      cache: "no-store",
    }
  );

  const payload = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    const message = payload?.error?.message || payload?.message || "No se pudieron cargar las invitaciones";
    return NextResponse.json({ ok: false, error: message }, { status: upstream.status });
  }

  return NextResponse.json({ ok: true, invitations: normalizeInvitations(payload) });
}

export async function POST(request: NextRequest) {
  const tenantId = await resolveTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ ok: false, error: "Debes crear un tenant primero" }, { status: 400 });
  }

  const body = await request.text();
  const upstream = await fetch(
    getBackendApiUrl(withApiPrefix(`/api/tenants/${encodeURIComponent(tenantId)}/invitations`)),
    {
      method: "POST",
      headers: buildBackendHeaders(request, { "Content-Type": "application/json" }),
      body,
      cache: "no-store",
    }
  );

  const payload = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    const message = payload?.error?.message || payload?.message || "No se pudo crear la invitación";
    return NextResponse.json({ ok: false, error: message }, { status: upstream.status });
  }

  const invitation = payload?.data?.invitation || payload?.invitation || null;
  const inviteToken = payload?.data?.inviteToken || payload?.inviteToken || null;
  return NextResponse.json({ ok: true, invitation, inviteToken }, { status: 201 });
}
