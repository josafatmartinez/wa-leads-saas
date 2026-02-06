import { describe, expect, test } from "vitest";

const BASE_URL = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
const E2E_PASSWORD = process.env.E2E_PASSWORD || "E2E-pass-1234";

type JsonRecord = Record<string, unknown>;

function splitSetCookieString(headerValue: string) {
  const cookies: string[] = [];
  let current = "";
  let inExpires = false;

  for (let i = 0; i < headerValue.length; i += 1) {
    const char = headerValue[i];
    const nextPart = headerValue.slice(i, i + 8).toLowerCase();

    if (nextPart === "expires=") inExpires = true;

    if (char === "," && !inExpires) {
      cookies.push(current.trim());
      current = "";
      continue;
    }

    if (char === ";" && inExpires) inExpires = false;
    current += char;
  }

  if (current.trim()) cookies.push(current.trim());
  return cookies.filter(Boolean);
}

function extractSetCookies(response: Response) {
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }

  const raw = response.headers.get("set-cookie");
  if (!raw) return [];
  return splitSetCookieString(raw);
}

class CookieJar {
  private store = new Map<string, string>();

  addFromResponse(response: Response) {
    const setCookies = extractSetCookies(response);
    for (const cookieValue of setCookies) {
      const firstPart = cookieValue.split(";")[0];
      const separator = firstPart.indexOf("=");
      if (separator <= 0) continue;
      const name = firstPart.slice(0, separator).trim();
      const value = firstPart.slice(separator + 1).trim();
      this.store.set(name, value);
    }
  }

  toHeader() {
    return Array.from(this.store.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }
}

async function requestJson(
  jar: CookieJar,
  path: string,
  init?: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: JsonRecord;
  }
) {
  const cookieHeader = jar.toHeader();
  const response = await fetch(`${BASE_URL}${path}`, {
    method: init?.method || "GET",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });

  jar.addFromResponse(response);
  const data = (await response.json().catch(() => ({}))) as JsonRecord;
  return { response, data };
}

describe.runIf(process.env.RUN_E2E === "1")("E2E onboarding + invitation", () => {
  test(
    "creates user, tenant, whatsapp config and an agent invitation",
    async () => {
      const runId = `${Date.now()}-${Math.round(Math.random() * 100000)}`;
      const ownerEmail = `owner+${runId}@example.com`;
      const agentEmail = `agent+${runId}@example.com`;
      const tenantName = `Tenant E2E ${runId}`;
      const jar = new CookieJar();

      const signupResult = await requestJson(jar, "/api/auth/signup", {
        method: "POST",
        body: {
          fullName: "E2E Owner",
          email: ownerEmail,
          password: E2E_PASSWORD,
        },
      });
      expect(signupResult.response.ok).toBe(true);
      expect(signupResult.data.ok).toBe(true);

      const loginResult = await requestJson(jar, "/api/auth/login", {
        method: "POST",
        body: {
          email: ownerEmail,
          password: E2E_PASSWORD,
          remember: true,
        },
      });
      expect(loginResult.response.ok).toBe(true);
      expect(loginResult.data.ok).toBe(true);

      const sessionResult = await requestJson(jar, "/api/auth/session");
      expect(sessionResult.response.ok).toBe(true);
      expect(sessionResult.data.ok).toBe(true);

      const tenantResult = await requestJson(jar, "/api/tenant", {
        method: "POST",
        body: {
          name: tenantName,
        },
      });
      expect(tenantResult.response.ok).toBe(true);
      expect(tenantResult.data.ok).toBe(true);
      const tenant = tenantResult.data.tenant as JsonRecord | undefined;
      expect(tenant?.id).toBeTruthy();

      const whatsappResult = await requestJson(jar, "/api/tenant/whatsapp", {
        method: "POST",
        body: {
          phoneNumberId: `1555${String(Math.round(Math.random() * 9999999)).padStart(7, "0")}`,
          accessToken: `e2e-access-${runId}`,
          verifyToken: `e2e-verify-${runId}`,
          metaAppSecret: `e2e-secret-${runId}`,
        },
      });
      expect(whatsappResult.response.ok).toBe(true);
      expect(whatsappResult.data.ok).toBe(true);

      const invitationResult = await requestJson(jar, "/api/tenant/invitations", {
        method: "POST",
        body: {
          email: agentEmail,
          role: "agent",
          expiresInHours: 72,
        },
      });
      expect(invitationResult.response.ok).toBe(true);
      expect(invitationResult.data.ok).toBe(true);

      const invitation = invitationResult.data.invitation as JsonRecord | undefined;
      expect(invitation?.email).toBe(agentEmail);
      expect(invitation?.role).toBe("agent");
      expect(invitationResult.data.inviteToken).toBeTruthy();
    },
    90_000
  );
});
