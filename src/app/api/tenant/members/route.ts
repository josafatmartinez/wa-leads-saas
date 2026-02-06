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

function normalizeMembers(payload: unknown) {
  const root = toRecord(payload);
  const data = toRecord(root?.data);
  const members =
    (Array.isArray(data?.members) ? data?.members : null) ||
    (Array.isArray(root?.members) ? root?.members : null) ||
    [];

  return members
    .map((item) => toRecord(item))
    .filter(Boolean)
    .map((member) => ({
      id: String(member?.id || ""),
      tenant_id: (member?.tenant_id as string | undefined) || undefined,
      supabase_user_id:
        (member?.supabase_user_id as string | undefined) ||
        (member?.supabaseUserId as string | undefined) ||
        "",
      role: String(member?.role || "viewer"),
      created_at: (member?.created_at as string | undefined) || undefined,
    }))
    .filter((member) => member.id && member.supabase_user_id);
}

export async function GET(request: NextRequest) {
  const tenantId = await resolveTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ ok: false, error: "Debes crear un tenant primero" }, { status: 400 });
  }

  const upstream = await fetch(
    getBackendApiUrl(withApiPrefix(`/api/tenants/${encodeURIComponent(tenantId)}/members`)),
    {
      method: "GET",
      headers: buildBackendHeaders(request),
      cache: "no-store",
    }
  );

  const payload = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    const message = payload?.error?.message || payload?.message || "No se pudieron cargar los miembros";
    return NextResponse.json({ ok: false, error: message }, { status: upstream.status });
  }

  return NextResponse.json({ ok: true, members: normalizeMembers(payload) });
}

export async function POST(request: NextRequest) {
  const tenantId = await resolveTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ ok: false, error: "Debes crear un tenant primero" }, { status: 400 });
  }

  const body = await request.text();
  const upstream = await fetch(
    getBackendApiUrl(withApiPrefix(`/api/tenants/${encodeURIComponent(tenantId)}/members`)),
    {
      method: "POST",
      headers: buildBackendHeaders(request, { "Content-Type": "application/json" }),
      body,
      cache: "no-store",
    }
  );

  const payload = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    const message = payload?.error?.message || payload?.message || "No se pudo registrar el miembro";
    return NextResponse.json({ ok: false, error: message }, { status: upstream.status });
  }

  return NextResponse.json({
    ok: true,
    member:
      payload?.data?.member || payload?.member || null,
  });
}
