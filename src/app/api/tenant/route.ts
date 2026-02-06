import { NextRequest, NextResponse } from "next/server";
import { buildBackendHeaders, getBackendApiUrl, withApiPrefix } from "@/lib/backend-api";

const TENANT_ID_COOKIE = "wa_tenant_id";
const TENANT_NAME_COOKIE = "wa_tenant_name";

function getRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function normalizeTenant(payload: unknown) {
  const root = getRecord(payload);
  if (!root) return null;

  const data = getRecord(root.data);
  const tenantFromData = getRecord(data?.tenant);
  if (tenantFromData) return tenantFromData;

  const tenant = getRecord(root.tenant);
  if (tenant) return tenant;

  const tenantsFromData = Array.isArray(data?.tenants) ? data?.tenants : null;
  if (tenantsFromData && tenantsFromData.length > 0) return getRecord(tenantsFromData[0]);

  const tenants = Array.isArray(root.tenants) ? root.tenants : null;
  if (tenants && tenants.length > 0) return getRecord(tenants[0]);

  const dataArray = Array.isArray(root.data) ? root.data : null;
  if (dataArray && dataArray.length > 0) return getRecord(dataArray[0]);

  const rootArray = Array.isArray(payload) ? payload : null;
  if (rootArray && rootArray.length > 0) return getRecord(rootArray[0]);

  if (!payload) return null;
  return null;
}

export async function GET(request: NextRequest) {
  const tenantIdFromCookie = request.cookies.get(TENANT_ID_COOKIE)?.value;
  const tenantNameFromCookie = request.cookies.get(TENANT_NAME_COOKIE)?.value;
  const tenantFromCookie = tenantIdFromCookie
    ? {
        id: tenantIdFromCookie,
        name: tenantNameFromCookie || undefined,
      }
    : null;

  const candidates = ["/api/tenant", "/api/tenants/me", "/api/tenants"];
  let lastErrorStatus = 0;
  let lastErrorText: string | null = null;

  for (const path of candidates) {
    const upstream = await fetch(getBackendApiUrl(withApiPrefix(path)), {
      method: "GET",
      headers: buildBackendHeaders(request),
      cache: "no-store",
    });

    if (upstream.status === 404) continue;
    if (!upstream.ok) {
      const error = await upstream.text();
      lastErrorStatus = upstream.status;
      lastErrorText = error;
      continue;
    }

    const payload = await upstream.json().catch(() => null);
    const tenant = normalizeTenant(payload);
    if (!tenant) continue;
    const response = NextResponse.json({ ok: true, tenant });

    if (tenant.id) {
      response.cookies.set(TENANT_ID_COOKIE, String(tenant.id), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    if (tenant.name) {
      response.cookies.set(TENANT_NAME_COOKIE, String(tenant.name), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return response;
  }

  if (tenantFromCookie && (lastErrorStatus === 0 || lastErrorStatus === 401 || lastErrorStatus === 403 || lastErrorStatus === 404)) {
    return NextResponse.json({ ok: true, tenant: tenantFromCookie });
  }

  if (lastErrorStatus > 0) {
    return NextResponse.json({ ok: false, error: lastErrorText || "Tenant lookup failed" }, { status: lastErrorStatus });
  }

  return NextResponse.json({ ok: true, tenant: null });
}

export async function POST(request: NextRequest) {
  const body = await request.text();

  const candidates = [
    { path: "/api/tenant", method: "POST" },
    { path: "/api/tenant", method: "PUT" },
    { path: "/api/tenants", method: "POST" },
  ];

  for (const candidate of candidates) {
    const upstream = await fetch(getBackendApiUrl(withApiPrefix(candidate.path)), {
      method: candidate.method,
      headers: buildBackendHeaders(request, { "Content-Type": "application/json" }),
      body,
      cache: "no-store",
    });

    if (upstream.status === 404 || upstream.status === 405) continue;

    const payload = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      const message = payload?.error?.message || payload?.message || "No se pudo guardar el tenant";
      return NextResponse.json({ ok: false, error: message }, { status: upstream.status });
    }

    const tenant = normalizeTenant(payload);
    const response = NextResponse.json({ ok: true, tenant: tenant ?? null }, { status: upstream.status });
    if (tenant?.id) {
      response.cookies.set(TENANT_ID_COOKIE, String(tenant.id), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });

      if (tenant.name) {
        response.cookies.set(TENANT_NAME_COOKIE, String(tenant.name), {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
        });
      }
    }

    return response;
  }

  return NextResponse.json(
    { ok: false, error: "No hay endpoint disponible para crear/editar tenant" },
    { status: 501 }
  );
}
