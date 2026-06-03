import { describe, expect, it } from "vitest";

import { mockProjectCards, mockProjectOverview } from "../../src/lib/mock/project";
import {
  getProjectCards,
  getProjectCardsForProjectsPage,
  getProjectOverview,
} from "../../src/lib/services/projects";

describe("projects service", () => {
  it("returns the same project cards currently provided by the mock repository", () => {
    expect(getProjectCards()).toEqual(mockProjectCards);
  });

  it("returns the same project overview currently provided by the mock repository", () => {
    expect(getProjectOverview(mockProjectOverview.id)).toEqual(mockProjectOverview);
  });

  it("returns undefined for an unknown project overview id", () => {
    expect(getProjectOverview("unknown_project")).toBeUndefined();
  });

  it("does not require Supabase configuration or environment variables", () => {
    const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const previousAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => getProjectCards()).not.toThrow();
      expect(() => getProjectOverview(mockProjectOverview.id)).not.toThrow();
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

  it("keeps an async projects-page helper without breaking the sync service contract", async () => {
    await expect(getProjectCardsForProjectsPage()).resolves.toEqual(
      mockProjectCards
    );
    expect(getProjectCards()).toEqual(mockProjectCards);
  });
});
