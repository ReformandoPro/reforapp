import { describe, expect, it } from "vitest";

import { mockDashboardSummary } from "../../src/lib/mock/dashboard";
import { getDashboardSummary } from "../../src/lib/services/dashboard";

describe("dashboard service", () => {
  it("returns the same dashboard summary currently provided by the mock repository", () => {
    expect(getDashboardSummary()).toEqual(mockDashboardSummary);
  });

  it("does not require Supabase configuration or environment variables", () => {
    const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const previousAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => getDashboardSummary()).not.toThrow();
    } finally {
      if (previousUrl === undefined) {
        delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      } else {
        process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
      }

      if (previousAnonKey === undefined) {
        delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      } else {
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousAnonKey;
      }
    }
  });
});
