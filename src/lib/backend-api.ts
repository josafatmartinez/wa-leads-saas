import { NextRequest, NextResponse } from "next/server";

const DEFAULT_BACKEND_API_URL = "http://127.0.0.1:3001";
const DEFAULT_BACKEND_API_PREFIX = "/api/v1";
export const ACCESS_TOKEN_COOKIE = "wa_access_token";
export const REFRESH_TOKEN_COOKIE = "wa_refresh_token";

function ensureLeadingSlash(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

export function getBackendApiBaseUrl() {
  return (process.env.WA_LEADS_API_URL || DEFAULT_BACKEND_API_URL).replace(/\/$/, "");
}

export function getBackendApiUrl(path: string) {
  return `${getBackendApiBaseUrl()}${ensureLeadingSlash(path)}`;
}

export function getBackendApiPrefix() {
  return (process.env.WA_LEADS_API_PREFIX || DEFAULT_BACKEND_API_PREFIX).replace(/\/$/, "");
}

export function withApiPrefix(path: string) {
  const normalized = ensureLeadingSlash(path);
  if (normalized.startsWith(`${getBackendApiPrefix()}/`)) return normalized;
  if (normalized === getBackendApiPrefix()) return normalized;
  if (normalized.startsWith("/api/")) {
    return `${getBackendApiPrefix()}${normalized.slice(4)}`;
  }
  if (normalized === "/api") return getBackendApiPrefix();
  return normalized;
}

function getRequestBearerToken(request: NextRequest) {
  const rawAuth = request.headers.get("authorization");
  if (rawAuth) return rawAuth;

  const tokenFromCookie = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (tokenFromCookie) return `Bearer ${tokenFromCookie}`;

  if (process.env.WA_LEADS_API_AUTHORIZATION) {
    return process.env.WA_LEADS_API_AUTHORIZATION;
  }

  return null;
}

export function buildBackendHeaders(request: NextRequest, extraHeaders?: HeadersInit) {
  const headers = new Headers(extraHeaders);

  const cookie = request.headers.get("cookie");
  if (cookie && !headers.has("cookie")) headers.set("cookie", cookie);

  if (!headers.has("authorization")) {
    const authHeader = getRequestBearerToken(request);
    if (authHeader) headers.set("authorization", authHeader);
  }

  if (!headers.has("x-api-key") && process.env.WA_LEADS_API_KEY) {
    headers.set("x-api-key", process.env.WA_LEADS_API_KEY);
  }

  const accept = request.headers.get("accept");
  if (accept && !headers.has("accept")) headers.set("accept", accept);

  const contentType = request.headers.get("content-type");
  if (contentType && !headers.has("content-type")) {
    headers.set("content-type", contentType);
  }

  return headers;
}

function copyHeadersFromBackend(upstream: Response, response: NextResponse) {
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "content-length") return;
    if (lower === "connection") return;
    if (lower === "transfer-encoding") return;
    if (lower === "set-cookie") return;
    response.headers.set(key, value);
  });

  const headersWithSetCookie = upstream.headers as Headers & {
    getSetCookie?: () => string[];
  };

  const setCookies = headersWithSetCookie.getSetCookie?.() ?? [];
  if (setCookies.length > 0) {
    setCookies.forEach((cookieValue) => response.headers.append("set-cookie", cookieValue));
    return;
  }

  const singleSetCookie = upstream.headers.get("set-cookie");
  if (singleSetCookie) {
    response.headers.append("set-cookie", singleSetCookie);
  }
}

export async function forwardToBackend(
  request: NextRequest,
  path: string,
  init?: {
    method?: string;
    body?: BodyInit | null;
    headers?: HeadersInit;
  }
) {
  const upstream = await fetch(getBackendApiUrl(path), {
    method: init?.method ?? request.method,
    headers: buildBackendHeaders(request, init?.headers),
    body: init?.body,
    cache: "no-store",
  });

  const response = new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
  });

  copyHeadersFromBackend(upstream, response);
  return response;
}

export async function forwardJsonBody(
  request: NextRequest,
  path: string,
  method?: string
) {
  const rawBody = await request.text();
  return forwardToBackend(request, path, {
    method: method ?? request.method,
    body: rawBody.length > 0 ? rawBody : undefined,
  });
}
