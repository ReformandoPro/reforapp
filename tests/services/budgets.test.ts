import { describe, expect, it } from "vitest";

import { mockBudgetSummaries, mockBudgetView } from "../../src/lib/mock/budget";
import { getBudgetSummaries, getBudgetSummary } from "../../src/lib/services/budgets";

describe("budgets service", () => {
  it("returns the same budget summaries currently provided by the mock repository", () => {
    expect(getBudgetSummaries()).toEqual(mockBudgetSummaries);
  });

  it("returns the same budget detail currently provided by the mock repository", () => {
    expect(getBudgetSummary(mockBudgetView.id)).toEqual(mockBudgetView);
  });

  it("returns undefined for an unknown budget id", () => {
    expect(getBudgetSummary("unknown_budget")).toBeUndefined();
  });

  it("does not require Supabase configuration or environment variables", () => {
    const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const previousAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => getBudgetSummaries()).not.toThrow();
      expect(() => getBudgetSummary(mockBudgetView.id)).not.toThrow();
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
