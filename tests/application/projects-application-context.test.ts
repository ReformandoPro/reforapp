import { describe, expect, it } from "vitest";

import {
  createProjectsApplicationContext,
  type ProjectsApplicationContext,
} from "../../src/lib/application/context/projects-application-context";

describe("createProjectsApplicationContext", () => {
  it("creates the minimal context with organizationId", () => {
    const context: ProjectsApplicationContext = createProjectsApplicationContext({
      organizationId: "org_123",
    });

    expect(context).toEqual({
      organizationId: "org_123",
    });
  });

  it("does not require Supabase or Auth to create the context", () => {
    const context = createProjectsApplicationContext({
      organizationId: "org_demo",
    });

    expect(context.organizationId).toBe("org_demo");
  });

  it("does not read environment variables", () => {
    const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const previousAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(() =>
        createProjectsApplicationContext({ organizationId: "org_local" })
      ).not.toThrow();
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
