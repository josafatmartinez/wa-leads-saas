import { NextRequest, NextResponse } from "next/server";
import { forwardJsonBody, forwardToBackend, withApiPrefix } from "@/lib/backend-api";

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

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const tenantId = await resolveTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ ok: false, error: "Tenant not configured" }, { status: 400 });
  }

  const upstream = await forwardToBackend(
    request,
    withApiPrefix(`/api/tenants/${encodeURIComponent(tenantId)}/conversations/${encodeURIComponent(slug)}`),
    { method: "GET" }
  );

  if (!upstream.ok) {
    const error = await upstream.text();
    return NextResponse.json({ ok: false, error }, { status: upstream.status });
  }

  const payload = await upstream.json().catch(() => ({}));
  const conversation = payload?.data?.conversation;

  if (!conversation) {
    return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });
  }

  const lead = {
    id: String(conversation.id || slug),
    customer_phone: String(conversation.customer_phone || "N/A"),
    slug: String(conversation.slug || slug),
    answers: (conversation.answers as Record<string, unknown> | null) || null,
    status: String(conversation.status || conversation.current_node || "new"),
    last_inbound_at: (conversation.last_inbound_at as string | null) || null,
    created_at: String(conversation.created_at || new Date().toISOString()),
  };

  return NextResponse.json({ ok: true, lead });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const tenantId = await resolveTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ ok: false, error: "Tenant not configured" }, { status: 400 });
  }

  return forwardJsonBody(
    request,
    withApiPrefix(`/api/tenants/${encodeURIComponent(tenantId)}/conversations/${encodeURIComponent(slug)}`),
    "PATCH"
  );
}
