import { describe, expect, it } from "vitest";

import {
  PROJECT_TASK_DESCRIPTION_MAX_LENGTH,
  PROJECT_TASK_TITLE_MAX_LENGTH,
  isUuid,
  validateCreateProjectTaskForm,
} from "../../src/lib/services/project-task-create";
import { canWriteProjectTasks } from "../../src/lib/services/project-operational-permissions";

function form(values: Record<string, string> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("project task creation validation", () => {
  it("accepts PostgreSQL UUID values used by the beta fixtures", () => {
    expect(isUuid("dddddddd-0000-0000-0000-000000000001")).toBe(true);
  });

  it("accepts valid input, trims text and defaults priority to medium", () => {
    expect(
      validateCreateProjectTaskForm(
        form({
          title: "  Preparar paredes  ",
          description: "  Retirar restos  ",
          due_date: "2026-08-02",
        })
      )
    ).toEqual({
      ok: true,
      input: {
        title: "Preparar paredes",
        description: "Retirar restos",
        priority: "medium",
        dueDate: "2026-08-02",
        phaseId: null,
      },
    });
  });

  it("accepts a task without phase and converts an empty description to null", () => {
    const result = validateCreateProjectTaskForm(
      form({ title: "Tarea válida", description: "   ", phase_id: "" })
    );

    expect(result).toMatchObject({
      ok: true,
      input: { description: null, phaseId: null },
    });
  });

  it("rejects an empty title", () => {
    expect(validateCreateProjectTaskForm(form({ title: "  " }))).toMatchObject({
      ok: false,
      fieldErrors: { title: expect.any(String) },
    });
  });

  it("rejects a title above the explicit maximum", () => {
    expect(
      validateCreateProjectTaskForm(
        form({ title: "a".repeat(PROJECT_TASK_TITLE_MAX_LENGTH + 1) })
      )
    ).toMatchObject({ ok: false, fieldErrors: { title: expect.any(String) } });
  });

  it("rejects a description above the explicit maximum", () => {
    expect(
      validateCreateProjectTaskForm(
        form({
          title: "Tarea válida",
          description: "a".repeat(PROJECT_TASK_DESCRIPTION_MAX_LENGTH + 1),
        })
      )
    ).toMatchObject({
      ok: false,
      fieldErrors: { description: expect.any(String) },
    });
  });

  it("rejects an invalid priority", () => {
    expect(
      validateCreateProjectTaskForm(
        form({ title: "Tarea válida", priority: "critical" })
      )
    ).toMatchObject({ ok: false, fieldErrors: { priority: expect.any(String) } });
  });

  it("rejects invalid dates and accepts valid calendar dates", () => {
    expect(
      validateCreateProjectTaskForm(
        form({ title: "Tarea válida", due_date: "2026-02-30" })
      )
    ).toMatchObject({ ok: false, fieldErrors: { dueDate: expect.any(String) } });

    expect(
      validateCreateProjectTaskForm(
        form({ title: "Tarea válida", due_date: "2026-02-28" })
      )
    ).toMatchObject({ ok: true, input: { dueDate: "2026-02-28" } });
  });

  it("rejects a malformed phase id", () => {
    expect(
      validateCreateProjectTaskForm(
        form({ title: "Tarea válida", phase_id: "not-a-uuid" })
      )
    ).toMatchObject({ ok: false, fieldErrors: { phaseId: expect.any(String) } });
  });

  it("matches task write permissions enforced by RLS", () => {
    expect(canWriteProjectTasks("owner")).toBe(true);
    expect(canWriteProjectTasks("admin")).toBe(true);
    expect(canWriteProjectTasks("member")).toBe(false);
  });
});
