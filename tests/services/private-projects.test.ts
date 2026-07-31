import { afterEach, describe, expect, it, vi } from "vitest";

import { createSupabaseProjectsReader } from "../../src/lib/services/private-projects";

function createQuery(result: { data: unknown; error: unknown }) {
  const selected: string[] = [];
  const filters: Array<[string, string]> = [];
  const query = {
    select: vi.fn((columns: string) => {
      selected.push(columns);
      return query;
    }),
    eq: vi.fn((column: string, value: string) => {
      filters.push([column, value]);
      return query;
    }),
    order: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  return { query, selected, filters };
}

describe("private projects Supabase reader", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses a projection compatible with the migrated legacy beta schema", async () => {
    const { query, selected, filters } = createQuery({ data: [], error: null });
    const supabase = { from: vi.fn().mockReturnValue(query) };

    await expect(
      createSupabaseProjectsReader(supabase as never).listProjects("org-a")
    ).resolves.toEqual([]);

    expect(selected[0]).toContain("updated_at");
    expect(selected[0]).not.toContain("created_at");
    expect(filters).toContainEqual(["organization_id", "org-a"]);
  });

  it("maps a project without created_at and keeps the missing value explicit", async () => {
    const { query } = createQuery({
      data: [
        {
          id: "project-a",
          organization_id: "org-a",
          client_id: null,
          name: "Obra A",
          status: "in_progress",
          address: null,
          type: null,
          progress: 0,
          client_name: "Sin cliente",
          updated_at: "2026-07-28T10:00:00.000Z",
        },
      ],
      error: null,
    });
    const supabase = { from: vi.fn().mockReturnValue(query) };

    await expect(
      createSupabaseProjectsReader(supabase as never).listProjects("org-a")
    ).resolves.toMatchObject([
      {
        id: "project-a",
        createdAt: null,
        updatedAt: "2026-07-28T10:00:00.000Z",
      },
    ]);
  });

  it("sanitizes internal Supabase errors while keeping a structured server log", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { query } = createQuery({
      data: null,
      error: {
        code: "42703",
        message: "column projects.secret_internal_column does not exist",
      },
    });
    const supabase = { from: vi.fn().mockReturnValue(query) };

    const operation = createSupabaseProjectsReader(supabase as never).listProjects("org-a");

    await expect(operation).rejects.toThrow("Unable to read projects from Supabase");
    await expect(operation).rejects.not.toThrow("secret_internal_column");
    expect(consoleError).toHaveBeenCalledWith("[private-projects]", {
      operation: "list",
      code: "42703",
    });
  });
});
