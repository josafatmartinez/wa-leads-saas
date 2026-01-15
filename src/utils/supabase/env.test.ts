import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
});

describe("getSupabaseEnv", () => {
  test("returns env values and caches result", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    const { getSupabaseEnv } = await import("@/utils/supabase/env");

    const first = getSupabaseEnv();
    expect(first).toEqual({
      url: "https://project.supabase.co",
      anonKey: "anon-key",
    });

    // Change env vars to confirm cache holds initial values
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://changed.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "changed-key";

    const second = getSupabaseEnv();
    expect(second).toBe(first);
    expect(second).toEqual(first);
  });

  test("throws when required env vars are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const { getSupabaseEnv } = await import("@/utils/supabase/env");

    expect(() => getSupabaseEnv()).toThrow(
      /Missing Supabase environment variables/
    );
  });
});
