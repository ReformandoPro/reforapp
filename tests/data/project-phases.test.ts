import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
  getOrganizationContextForRequest: vi.fn(),
}));

vi.mock("../../src/lib/supabase/ssr", () => ({ createServerSupabaseClient: mocks.createServerSupabaseClient }));
vi.mock("../../src/lib/services/org-context", () => ({ getOrganizationContextForRequest: mocks.getOrganizationContextForRequest }));

import { getProjectPhasesForRequest } from "../../src/lib/data/projects";

function mockQuery(result: { data: unknown; error: unknown }) {
  const orderSecond = vi.fn().mockResolvedValue(result);
  const orderFirst = vi.fn().mockReturnValue({ order: orderSecond });
  const eqOrganization = vi.fn().mockReturnValue({ order: orderFirst });
  const eqProject = vi.fn().mockReturnValue({ eq: eqOrganization });
  const select = vi.fn().mockReturnValue({ eq: eqProject });
  mocks.createServerSupabaseClient.mockResolvedValue({ from: vi.fn().mockReturnValue({ select }) });
  return { eqProject, eqOrganization, orderFirst, orderSecond };
}

describe("project phases real read", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    mocks.createServerSupabaseClient.mockReset();
    mocks.getOrganizationContextForRequest.mockReset();
  });

  it("filters by project and authenticated organization and maps deterministic order", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    mocks.getOrganizationContextForRequest.mockResolvedValue({ ok: true, organizationId: "org-a", role: "member", user: { id: "user-a" } });
    const query = mockQuery({ data: [{ id: "phase-1", title: "Preparación", description: null, status: "planned", start_date: null, end_date: null, sort_order: 1 }], error: null });

    await expect(getProjectPhasesForRequest("project-a")).resolves.toMatchObject([{ id: "phase-1", sortOrder: 1 }]);
    expect(query.eqProject).toHaveBeenCalledWith("project_id", "project-a");
    expect(query.eqOrganization).toHaveBeenCalledWith("organization_id", "org-a");
    expect(query.orderFirst).toHaveBeenCalledWith("sort_order", { ascending: true });
    expect(query.orderSecond).toHaveBeenCalledWith("id", { ascending: true });
  });

  it("returns no phases for an empty project or another organization", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    mocks.getOrganizationContextForRequest.mockResolvedValue({ ok: true, organizationId: "org-a", role: "member", user: { id: "user-a" } });
    mockQuery({ data: [], error: null });
    await expect(getProjectPhasesForRequest("project-b")).resolves.toEqual([]);
  });

  it("fails explicitly when Supabase is not configured", async () => {
    mocks.getOrganizationContextForRequest.mockResolvedValue({ ok: true, organizationId: "org-a", role: "member", user: { id: "user-a" } });

    await expect(getProjectPhasesForRequest("project-a")).rejects.toThrow(
      "Unable to load project phases from Supabase"
    );
    expect(mocks.createServerSupabaseClient).not.toHaveBeenCalled();
  });

  it("does not use public organization variables and sanitizes query errors", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("NEXT_PUBLIC_ORGANIZATION_ID", "org-public");
    mocks.getOrganizationContextForRequest.mockResolvedValue({ ok: true, organizationId: "org-a", role: "member", user: { id: "user-a" } });
    mockQuery({ data: null, error: { code: "42501", message: "secret table detail" } });
    await expect(getProjectPhasesForRequest("project-a")).rejects.toThrow("Unable to load project phases from Supabase");
  });

  it("rejects missing membership explicitly", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    mocks.getOrganizationContextForRequest.mockResolvedValue({ ok: false, reason: "missing_membership" });
    await expect(getProjectPhasesForRequest("project-a")).rejects.toThrow("active organization");
  });
});
