import { afterEach, describe, expect, it, vi } from "vitest";

const { createOptionalSupabaseClient } = vi.hoisted(() => ({
  createOptionalSupabaseClient: vi.fn(),
}));

vi.mock("../../src/lib/supabase/client", () => ({
  createOptionalSupabaseClient,
}));

import { mockProjectCards } from "../../src/lib/mock/project";
import {
  getProjectsPageCards,
  getProjectsPageCardsResult,
  mapSupabaseProjectRowToProjectCard,
} from "../../src/lib/data/projects";

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const originalOrganizationId =
  process.env.NEXT_PUBLIC_SUPABASE_ORGANIZATION_ID;

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
    createOptionalSupabaseClient.mockReset();
  });

  it("falls back to mock when Supabase env vars are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_ORGANIZATION_ID;

    createOptionalSupabaseClient.mockReturnValue(null);

    await expect(getProjectsPageCards()).resolves.toEqual(mockProjectCards);
  });

  it("returns an explicit error when organization id is missing (no silent mock fallback)", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    delete process.env.NEXT_PUBLIC_SUPABASE_ORGANIZATION_ID;

    createOptionalSupabaseClient.mockReturnValue({});

    await expect(getProjectsPageCardsResult()).resolves.toEqual({
      ok: false,
      source: "supabase",
      reason: "missing_organization_id",
    });
  });

  it("returns an explicit error when the Supabase query fails (no silent mock fallback)", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.NEXT_PUBLIC_SUPABASE_ORGANIZATION_ID = "org_demo";

    const order = vi.fn().mockResolvedValue({
      data: null,
      error: new Error("query failed"),
    });
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));

    createOptionalSupabaseClient.mockReturnValue({ from });

    await expect(getProjectsPageCardsResult()).resolves.toEqual({
      ok: false,
      source: "supabase",
      reason: "query_failed",
    });
  });

  it("returns an empty list when the Supabase query returns no rows (no mock fallback)", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.NEXT_PUBLIC_SUPABASE_ORGANIZATION_ID = "org_demo";

    const order = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));

    createOptionalSupabaseClient.mockReturnValue({ from });

    await expect(getProjectsPageCardsResult()).resolves.toEqual({
      ok: true,
      source: "supabase",
      cards: [],
    });
  });

  it("returns normalized project cards when the Supabase query succeeds", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.NEXT_PUBLIC_SUPABASE_ORGANIZATION_ID = "org_demo";

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

    createOptionalSupabaseClient.mockReturnValue({ from });

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

  it("returns an explicit error when a Supabase row is not mappable (no silent mock fallback)", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.NEXT_PUBLIC_SUPABASE_ORGANIZATION_ID = "org_demo";

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

    createOptionalSupabaseClient.mockReturnValue({ from });

    await expect(getProjectsPageCardsResult()).resolves.toEqual({
      ok: false,
      source: "supabase",
      reason: "mapping_failed",
    });
  });

  it("maps a valid Supabase row into a ProjectCard contract", () => {
    expect(
      mapSupabaseProjectRowToProjectCard({
        id: "project_real_2",
        name: "Obra mapeada",
        status: "scheduled",
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
      status: "scheduled",
      delayedTasksCount: 0,
      blockedTasksCount: 0,
      pendingApprovalsCount: 0,
    });
  });
});
