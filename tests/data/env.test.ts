import { afterEach, describe, expect, it } from "vitest";

import { getSupabaseConfig, isSupabaseConfigured } from "../../src/lib/env";

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function restoreEnv() {
  if (originalUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  }

  if (originalAnonKey === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnonKey;
  }
}

describe("Supabase env helpers", () => {
  afterEach(() => {
    restoreEnv();
  });

  it("reports Supabase as not configured when public env vars are missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    expect(isSupabaseConfigured()).toBe(false);
    expect(getSupabaseConfig()).toBeNull();
  });

  it("returns Supabase public config when both public env vars exist", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    expect(isSupabaseConfigured()).toBe(true);
    expect(getSupabaseConfig()).toEqual({
      url: "https://example.supabase.co",
      anonKey: "anon-key",
    });
  });
});
