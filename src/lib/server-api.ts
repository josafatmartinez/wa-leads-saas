import { getAppUrl } from "@/lib/utils";
import { getCookieHeader } from "@/lib/server-cookies";
import type {
  LeadRow,
  LeadDetail,
  TenantConfig,
  SessionResponse,
  TenantResponse,
  TenantWhatsappStatus,
  TenantTreeStatus,
} from "@/lib/types/dashboard";

const ensureLeadingSlash = (value: string) => (value.startsWith("/") ? value : `/${value}`);

function getApiBaseUrl() {
  // Always call this app's BFF routes from server components/actions.
  // BFF routes attach Authorization from httpOnly cookies before calling backend APIs.
  return getAppUrl().replace(/\/$/, "");
}

async function internalFetch(path: string, init: RequestInit = {}) {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${ensureLeadingSlash(path)}`;
  const headers = new Headers(init.headers);
  const cookieHeader = await getCookieHeader();
  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  const response = await fetch(url, {
    ...init,
    headers,
    cache: init.cache ?? "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request to ${path} failed with ${response.status}`);
  }

  return response;
}

async function internalFetchJson<T>(path: string, init: RequestInit = {}) {
  const response = await internalFetch(path, init);
  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    throw new Error(`Expected JSON response for ${path}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchSessionData() {
  try {
    return await internalFetchJson<SessionResponse>("/api/auth/session");
  } catch {
    return { ok: false, error: "No active session" } satisfies SessionResponse;
  }
}

export async function signOut() {
  await internalFetch("/api/auth/logout", {
    method: "POST",
  });
}

export async function fetchTenant() {
  try {
    return await internalFetchJson<TenantResponse>("/api/tenant");
  } catch {
    return { ok: false, error: "Tenant request failed" } satisfies TenantResponse;
  }
}

export async function upsertTenant(body: { name: string }) {
  return internalFetchJson<TenantResponse>("/api/tenant", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function fetchTenantWhatsappStatus() {
  try {
    return await internalFetchJson<{ ok: boolean; whatsapp: TenantWhatsappStatus }>("/api/tenant/whatsapp");
  } catch {
    return { ok: false, whatsapp: { configured: false } };
  }
}

export async function updateTenantWhatsapp(body: Record<string, unknown>) {
  return internalFetchJson<{ ok: boolean; whatsapp?: TenantWhatsappStatus }>("/api/tenant/whatsapp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function fetchTenantTreeStatus() {
  try {
    return await internalFetchJson<{ ok: boolean; tree: TenantTreeStatus }>("/api/tenant/tree");
  } catch {
    return { ok: false, tree: { configured: false } };
  }
}

export async function updateTenantTree(body: { tree: Record<string, unknown>; name?: string; version?: string }) {
  return internalFetchJson<{ ok: boolean; tree?: TenantTreeStatus }>("/api/tenant/tree", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function fetchLeads() {
  const payload = await internalFetchJson<{ leads: LeadRow[] }>("/api/dashboard/leads");
  return payload.leads;
}

export async function fetchLeadDetail(slug: string) {
  const payload = await internalFetchJson<{ lead: LeadDetail | null }>(
    `/api/dashboard/leads/${encodeURIComponent(slug)}`
  );
  return payload.lead;
}

export async function updateLeadDetail(slug: string, body: { status: string; notes: string }) {
  await internalFetch(`/api/dashboard/leads/${encodeURIComponent(slug)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function fetchConfig() {
  const payload = await internalFetchJson<{ config: TenantConfig }>("/api/dashboard/config");
  return payload.config;
}

export async function updateConfig(body: {
  bot_enabled: boolean;
  welcome_text: string;
  closing_text: string;
}) {
  await internalFetch("/api/dashboard/config", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
