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

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function normalizeWhatsapp(payload: unknown) {
  const root = toRecord(payload);
  const data = toRecord(root?.data);
  const row = toRecord(data?.tenantWhatsapp) || toRecord(root?.tenantWhatsapp) || data || root;
  if (!row) return { configured: false };
  const phoneNumberId = (row.phone_number_id as string | undefined) || (row.phoneNumberId as string | undefined);
  return {
    configured: Boolean(phoneNumberId),
    tenant_id: (row.tenant_id as string | undefined) || (row.tenantId as string | undefined),
    phone_number_id: phoneNumberId,
  };
}

export async function GET(request: NextRequest) {
  const tenantId = await resolveTenantId(request);
  if (!tenantId) return NextResponse.json({ ok: true, whatsapp: { configured: false } });

  const upstream = await fetch(
    getBackendApiUrl(withApiPrefix(`/api/tenants/${encodeURIComponent(tenantId)}/whatsapp`)),
    {
    method: "GET",
    headers: buildBackendHeaders(request),
    cache: "no-store",
    }
  );

  if (upstream.status === 404) {
    return NextResponse.json({ ok: true, whatsapp: { configured: false, tenant_id: tenantId } });
  }

  if (!upstream.ok) {
    const error = await upstream.text();
    return NextResponse.json({ ok: false, error }, { status: upstream.status });
  }

  const payload = await upstream.json().catch(() => null);
  return NextResponse.json({ ok: true, whatsapp: normalizeWhatsapp(payload) });
}

export async function POST(request: NextRequest) {
  const tenantId = await resolveTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ ok: false, error: "Debes crear un tenant primero" }, { status: 400 });
  }

  const body = await request.text();
  const upstream = await fetch(
    getBackendApiUrl(withApiPrefix(`/api/tenants/${encodeURIComponent(tenantId)}/whatsapp`)),
    {
    method: "POST",
    headers: buildBackendHeaders(request, { "Content-Type": "application/json" }),
    body,
    cache: "no-store",
    }
  );

  const payload = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    const message = payload?.error?.message || payload?.message || "No se pudo guardar WhatsApp";
    return NextResponse.json({ ok: false, error: message }, { status: upstream.status });
  }

  return NextResponse.json({ ok: true, whatsapp: normalizeWhatsapp(payload) }, { status: upstream.status });
}
