import { getAppUrl } from "@/lib/utils";
import { getCookieHeader } from "@/lib/server-cookies";
import type { LeadRow, LeadDetail, TenantConfig, SessionResponse } from "@/lib/types/dashboard";

const ensureLeadingSlash = (value: string) => (value.startsWith("/") ? value : `/${value}`);

const REMOTE_API_URL = process.env.NEXT_PUBLIC_WA_LEADS_API_URL;

function getApiBaseUrl() {
  if (REMOTE_API_URL && REMOTE_API_URL.trim().length > 0) {
    return REMOTE_API_URL.replace(/\/$/, "");
  }
  return getAppUrl().replace(/\/$/, "");
}

async function internalFetch(path: string, init: RequestInit = {}) {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${ensureLeadingSlash(path)}`;
  const headers = new Headers(init.headers);
  const cookieHeader = getCookieHeader();
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
  return internalFetchJson<SessionResponse>("/api/auth/session");
}

export async function signOut() {
  await internalFetch("/api/auth/logout", {
    method: "POST",
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
