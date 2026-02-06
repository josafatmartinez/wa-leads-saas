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

function normalizeTree(payload: unknown) {
  const root = toRecord(payload);
  const data = toRecord(root?.data);
  const row = toRecord(data?.tenantTree) || toRecord(root?.tenantTree) || data || root;
  if (!row) return { configured: false };
  const tree = toRecord(row.tree);
  return {
    configured: Boolean(tree),
    tenant_id: (row.tenant_id as string | undefined) || (row.tenantId as string | undefined),
    name: row.name as string | undefined,
    version: row.version as string | undefined,
    tree: tree || undefined,
  };
}

export async function GET(request: NextRequest) {
  const tenantId = await resolveTenantId(request);
  if (!tenantId) return NextResponse.json({ ok: true, tree: { configured: false } });

  const candidates = [
    withApiPrefix(`/api/tenants/${encodeURIComponent(tenantId)}/tree`),
    `/api/tenants/${encodeURIComponent(tenantId)}/tree`,
    "/api/tenant/tree",
  ];

  for (const path of candidates) {
    const upstream = await fetch(getBackendApiUrl(path), {
      method: "GET",
      headers: buildBackendHeaders(request),
      cache: "no-store",
    });

    if (upstream.status === 404 || upstream.status === 405) continue;
    if (!upstream.ok) {
      const error = await upstream.text();
      return NextResponse.json({ ok: false, error }, { status: upstream.status });
    }

    const payload = await upstream.json().catch(() => null);
    return NextResponse.json({ ok: true, tree: normalizeTree(payload) });
  }

  return NextResponse.json({ ok: true, tree: { configured: false, tenant_id: tenantId } });
}

export async function PUT(request: NextRequest) {
  const tenantId = await resolveTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ ok: false, error: "Debes crear un tenant primero" }, { status: 400 });
  }

  const body = await request.text();
  const candidates = [
    { path: withApiPrefix(`/api/tenants/${encodeURIComponent(tenantId)}/tree`), method: "PUT" },
    { path: `/api/tenants/${encodeURIComponent(tenantId)}/tree`, method: "PUT" },
    { path: "/api/tenant/tree", method: "PUT" },
    { path: withApiPrefix(`/api/tenants/${encodeURIComponent(tenantId)}/tree`), method: "POST" },
    { path: `/api/tenants/${encodeURIComponent(tenantId)}/tree`, method: "POST" },
  ];

  let lastStatus = 0;
  let lastMessage = "No se pudo guardar el árbol";

  for (const candidate of candidates) {
    const upstream = await fetch(getBackendApiUrl(candidate.path), {
      method: candidate.method,
      headers: buildBackendHeaders(request, { "Content-Type": "application/json" }),
      body,
      cache: "no-store",
    });

    const payload = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      if (upstream.status === 404 || upstream.status === 405) continue;
      lastStatus = upstream.status;
      lastMessage = payload?.error?.message || payload?.message || lastMessage;
      continue;
    }

    return NextResponse.json({ ok: true, tree: normalizeTree(payload) }, { status: upstream.status });
  }

  return NextResponse.json({ ok: false, error: lastMessage }, { status: lastStatus || 400 });
}
