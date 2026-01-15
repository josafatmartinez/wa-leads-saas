import { beforeEach, describe, expect, test, vi } from "vitest";

const createClientMock = vi.fn(() => ({ id: "supabase-mock" }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  process.env = {
    ...ORIGINAL_ENV,
    NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  };
  delete (globalThis as { _supabaseClient?: unknown })._supabaseClient;
});

describe("getSupabaseClient", () => {
  test("creates a single client instance and reuses it", async () => {
    const { getSupabaseClient } = await import("@/utils/supabase/client");

    const first = getSupabaseClient();
    const second = getSupabaseClient();

    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(createClientMock).toHaveBeenCalledWith(
      "https://project.supabase.co",
      "anon-key"
    );
    expect(first).toBe(second);
  });
});
