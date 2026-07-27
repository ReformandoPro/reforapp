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

import { getProjectDetail } from "../../src/lib/data/projects";

function mockQuery(result: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eq = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) });
  const select = vi.fn().mockReturnValue({ eq });
  mocks.createServerSupabaseClient.mockResolvedValue({ from: vi.fn().mockReturnValue({ select }) });
  return { eq, maybeSingle };
}

describe("project detail real read", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    mocks.createServerSupabaseClient.mockReset();
    mocks.getOrganizationContextForRequest.mockReset();
  });

  it("filters by project id and authenticated organization", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    mocks.getOrganizationContextForRequest.mockResolvedValue({ ok: true, organizationId: "org-a", role: "member", user: { id: "user-a" } });
    const { eq, maybeSingle } = mockQuery({ data: { id: "project-a", name: "Project A", status: "in_progress", address: "A", start_date: "2026-01-01", type: "reform", client: { display_name: "Client A" } }, error: null });

    await expect(getProjectDetail("project-a")).resolves.toMatchObject({ id: "project-a", clientName: "Client A" });
    expect(eq).toHaveBeenCalledWith("id", "project-a");
    expect(eq.mock.results[0].value.eq).toHaveBeenCalledWith("organization_id", "org-a");
    expect(maybeSingle).toHaveBeenCalled();
  });

  it("returns null for a project outside the organization", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    mocks.getOrganizationContextForRequest.mockResolvedValue({ ok: true, organizationId: "org-a", role: "member", user: { id: "user-a" } });
    mockQuery({ data: null, error: null });
    await expect(getProjectDetail("project-b")).resolves.toBeNull();
  });

  it("fails explicitly when organization context is unavailable", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    mocks.getOrganizationContextForRequest.mockResolvedValue({ ok: false, reason: "missing_membership" });
    await expect(getProjectDetail("project-a")).rejects.toThrow("active organization");
  });

  it("fails explicitly on a Supabase query error", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    mocks.getOrganizationContextForRequest.mockResolvedValue({ ok: true, organizationId: "org-a", role: "member", user: { id: "user-a" } });
    mockQuery({ data: null, error: { code: "42501", message: "denied" } });
    await expect(getProjectDetail("project-a")).rejects.toThrow("Supabase");
  });
});
