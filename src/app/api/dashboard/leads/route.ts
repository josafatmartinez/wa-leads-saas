import { NextRequest, NextResponse } from "next/server";
import { forwardToBackend, withApiPrefix } from "@/lib/backend-api";

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
  const tenantId = await resolveTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ ok: false, error: "Tenant not configured" }, { status: 400 });
  }

  const upstream = await forwardToBackend(
    request,
    withApiPrefix(`/api/tenants/${encodeURIComponent(tenantId)}/conversations?limit=50&offset=0`),
    { method: "GET" }
  );

  if (!upstream.ok) {
    const error = await upstream.text();
    return NextResponse.json({ ok: false, error }, { status: upstream.status });
  }

  const payload = await upstream.json().catch(() => ({}));
  const conversations =
    payload?.data?.conversations ||
    payload?.data?.items ||
    payload?.conversations ||
    [];

  const leads = conversations.map((conversation: Record<string, unknown>) => ({
    id: String(conversation.id || conversation.slug || conversation.customer_phone || crypto.randomUUID()),
    customer_phone: String(conversation.customer_phone || "N/A"),
    slug: String(conversation.slug || conversation.customer_phone || "unknown"),
    answers: (conversation.answers as Record<string, unknown> | null) || null,
    status: String(conversation.status || conversation.current_node || "new"),
    handoff_to_human: Boolean(conversation.handoff_to_human),
    updated_at: String(conversation.updated_at || conversation.created_at || new Date().toISOString()),
  }));

  return NextResponse.json({ ok: true, leads });
}
