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

  it("falls back to mock when organization id is missing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    delete process.env.NEXT_PUBLIC_SUPABASE_ORGANIZATION_ID;

    createOptionalSupabaseClient.mockReturnValue({});

    await expect(getProjectsPageCards()).resolves.toEqual(mockProjectCards);
  });

  it("falls back to mock when the Supabase query fails", async () => {
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

    await expect(getProjectsPageCards()).resolves.toEqual(mockProjectCards);
  });

  it("falls back to mock when the Supabase query returns no rows", async () => {
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

    await expect(getProjectsPageCards()).resolves.toEqual(mockProjectCards);
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

  it("falls back to mock when a Supabase row is not mappable", async () => {
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

    await expect(getProjectsPageCards()).resolves.toEqual(mockProjectCards);
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
