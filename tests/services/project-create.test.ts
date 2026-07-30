import { describe, expect, it } from "vitest";

import {
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
  validateCreateProjectForm,
} from "../../src/lib/services/project-create";

function form(values: Record<string, string> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("project creation validation", () => {
  it("accepts the minimum project and normalizes optional fields", () => {
    expect(validateCreateProjectForm(form({ name: "  Reforma Centro  " }))).toEqual({
      ok: true,
      input: {
        name: "Reforma Centro",
        clientId: null,
        description: null,
        startDate: null,
        expectedEndDate: null,
      },
    });
  });

  it("accepts all MVP fields", () => {
    expect(
      validateCreateProjectForm(
        form({
          name: "Reforma Centro",
          client_id: "10000000-0000-4000-8000-000000000001",
          description: "  Reforma integral  ",
          start_date: "2026-08-01",
          expected_end_date: "2026-10-30",
        })
      )
    ).toMatchObject({
      ok: true,
      input: {
        description: "Reforma integral",
        startDate: "2026-08-01",
        expectedEndDate: "2026-10-30",
      },
    });
  });

  it("accepts PostgreSQL UUID values used by the beta fixtures", () => {
    expect(
      validateCreateProjectForm(
        form({
          name: "Proyecto Demo Org 2",
          client_id: "bbbbbbbb-0000-0000-0000-000000000001",
        })
      )
    ).toMatchObject({
      ok: true,
      input: { clientId: "bbbbbbbb-0000-0000-0000-000000000001" },
    });
  });

  it("rejects invalid names and oversized descriptions", () => {
    expect(validateCreateProjectForm(form({ name: " " }))).toMatchObject({
      ok: false,
      fieldErrors: { name: expect.any(String) },
    });
    expect(
      validateCreateProjectForm(
        form({ name: "a".repeat(PROJECT_NAME_MAX_LENGTH + 1) })
      )
    ).toMatchObject({ ok: false, fieldErrors: { name: expect.any(String) } });
    expect(
      validateCreateProjectForm(
        form({ name: "Obra válida", description: "a".repeat(PROJECT_DESCRIPTION_MAX_LENGTH + 1) })
      )
    ).toMatchObject({ ok: false, fieldErrors: { description: expect.any(String) } });
  });

  it("rejects malformed clients and impossible dates", () => {
    expect(
      validateCreateProjectForm(form({ name: "Obra válida", client_id: "other-org" }))
    ).toMatchObject({ ok: false, fieldErrors: { clientId: expect.any(String) } });
    expect(
      validateCreateProjectForm(form({ name: "Obra válida", start_date: "2026-02-30" }))
    ).toMatchObject({ ok: false, fieldErrors: { startDate: expect.any(String) } });
  });

  it("rejects an expected end date before the start", () => {
    expect(
      validateCreateProjectForm(
        form({
          name: "Obra válida",
          start_date: "2026-09-01",
          expected_end_date: "2026-08-31",
        })
      )
    ).toMatchObject({ ok: false, fieldErrors: { expectedEndDate: expect.any(String) } });
  });
});
