import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
  getOrganizationContextForRequest: vi.fn(),
}));

vi.mock("../../src/lib/supabase/ssr", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
}));

vi.mock("../../src/lib/services/org-context", () => ({
  getOrganizationContextForRequest: mocks.getOrganizationContextForRequest,
}));

import { mockProjectCards } from "../../src/lib/mock/project";
import {
  getProjectsPageCards,
  mapSupabaseProjectRowToProjectCard,
} from "../../src/lib/data/projects";

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const originalOrganizationId = process.env.NEXT_PUBLIC_SUPABASE_ORGANIZATION_ID;
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

  if (originalOrganizationId === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_ORGANIZATION_ID;
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_ORGANIZATION_ID = originalOrganizationId;
  }

}

describe("projects first read", () => {
  afterEach(() => {
    restoreEnv();
    vi.unstubAllEnvs();
    mocks.createServerSupabaseClient.mockReset();
    mocks.getOrganizationContextForRequest.mockReset();
  });

  it("falls back to mock when Supabase env vars are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    await expect(getProjectsPageCards()).resolves.toEqual(mockProjectCards);
  });

  it("fails explicitly when Supabase is missing in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    await expect(getProjectsPageCards()).rejects.toThrow(
      "Unable to load projects from Supabase"
    );

  });

  it("fails explicitly when configured Supabase has no organization context", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    mocks.getOrganizationContextForRequest.mockResolvedValue({
      ok: false,
      reason: "missing_membership",
    });

    await expect(getProjectsPageCards()).rejects.toThrow(
      "Unable to load projects for the active organization"
    );
  });

  it("fails explicitly when the Supabase query fails", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    mocks.getOrganizationContextForRequest.mockResolvedValue({
      ok: true,
      organizationId: "org_a",
      role: "member",
      user: { id: "user_a" },
    });

    const order = vi.fn().mockResolvedValue({
      data: null,
      error: new Error("query failed"),
    });
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));

    mocks.createServerSupabaseClient.mockResolvedValue({ from });

    await expect(getProjectsPageCards()).rejects.toThrow(
      "Unable to load projects from Supabase"
    );
    expect(eq).toHaveBeenCalledWith("organization_id", "org_a");
  });

  it("returns an empty list when the configured query returns no rows", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    mocks.getOrganizationContextForRequest.mockResolvedValue({
      ok: true,
      organizationId: "org_a",
      role: "member",
      user: { id: "user_a" },
    });

    const order = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));

    mocks.createServerSupabaseClient.mockResolvedValue({ from });

    await expect(getProjectsPageCards()).resolves.toEqual([]);
  });

  it("returns normalized project cards when the Supabase query succeeds", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    mocks.getOrganizationContextForRequest.mockResolvedValue({
      ok: true,
      organizationId: "org_a",
      role: "member",
      user: { id: "user_a" },
    });

    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: "project_real_1",
          name: "Reforma real",
          status: "in_progress",
          client_id: "client_real_1",
          client: {
            id: "client_real_1",
            display_name: "Cliente Real",
          },
        },
      ],
      error: null,
    });
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));

    mocks.createServerSupabaseClient.mockResolvedValue({ from });

    await expect(getProjectsPageCards()).resolves.toEqual([
      {
        id: "project_real_1",
        name: "Reforma real",
        clientName: "Cliente Real",
        status: "in_progress",
        delayedTasksCount: 0,
        blockedTasksCount: 0,
        pendingApprovalsCount: 0,
      },
    ]);
  });

  it("fails explicitly when a configured Supabase row is not mappable", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    mocks.getOrganizationContextForRequest.mockResolvedValue({
      ok: true,
      organizationId: "org_a",
      role: "member",
      user: { id: "user_a" },
    });

    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: "project_bad_1",
          name: "Reforma sin cliente",
          status: "in_progress",
          client_id: "client_bad_1",
          client: null,
        },
      ],
      error: null,
    });
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));

    mocks.createServerSupabaseClient.mockResolvedValue({ from });

    await expect(getProjectsPageCards()).rejects.toThrow(
      "Unable to load projects from Supabase"
    );
  });

  it("never uses an organization id supplied through environment configuration", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.NEXT_PUBLIC_SUPABASE_ORGANIZATION_ID = "org_attacker";
    mocks.getOrganizationContextForRequest.mockResolvedValue({
      ok: true,
      organizationId: "org_a",
      role: "member",
      user: { id: "user_a" },
    });

    const order = vi.fn().mockResolvedValue({ data: [], error: null });
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    mocks.createServerSupabaseClient.mockResolvedValue({ from });

    await expect(getProjectsPageCards()).resolves.toEqual([]);
    expect(eq).toHaveBeenCalledWith("organization_id", "org_a");
    expect(eq).not.toHaveBeenCalledWith("organization_id", "org_attacker");
  });

  it("maps a valid Supabase row into a ProjectCard contract", () => {
    expect(
      mapSupabaseProjectRowToProjectCard({
        id: "project_real_2",
        name: "Obra mapeada",
        status: "approved",
        client_id: "client_real_2",
        client: {
          id: "client_real_2",
          display_name: "Familia Real",
        },
      })
    ).toEqual({
      id: "project_real_2",
      name: "Obra mapeada",
      clientName: "Familia Real",
      status: "approved",
      delayedTasksCount: 0,
      blockedTasksCount: 0,
      pendingApprovalsCount: 0,
    });
  });
});
