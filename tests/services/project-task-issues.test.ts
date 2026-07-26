import { describe, expect, it } from "vitest";

import {
  buildTaskIssuePayload,
  canCreateTaskIssue,
  isTaskIssueContextValid,
  sanitizeTaskIssueInsertError,
  trimIssueWhitespace,
  validateIssueDescription,
} from "../../src/lib/services/project-task-issues";

describe("project task issues", () => {
  it.each([
    "\t", "\n", "\r", " ", "\u00a0", "\u1680", "\u2000", "\u2007", "\u200a",
    "\u2028", "\u2029", "\u202f", "\u205f", "\u3000", "\ufeff",
    "\t\u00a0\u2007\u202f\ufeff",
  ])("rejects each explicit edge-whitespace-only value: %j", (value) => {
    expect(trimIssueWhitespace(value)).toBe("");
    expect(validateIssueDescription(value).ok).toBe(false);
  });

  it("preserves internal whitespace and combined characters", () => {
    expect(trimIssueWhitespace("\u00a0texto\u00a0 interno e\u0301\u00a0")).toBe(
      "texto\u00a0 interno e\u0301"
    );
  });

  it.each(["\u00a0", "\u2007", "\u202f", "\u3000", "\ufeff"])(
    "trims explicit edge whitespace %j",
    (edge) => {
      expect(trimIssueWhitespace(`${edge}texto${edge}`)).toBe("texto");
    }
  );

  it("applies length limits after explicit edge normalization", () => {
    expect(validateIssueDescription(`\u00a0${"a".repeat(2000)}\u00a0`)).toMatchObject({ ok: true });
    expect(validateIssueDescription(`\u00a0${"a".repeat(2001)}\u00a0`).ok).toBe(false);
  });

  it("rejects empty and whitespace-only descriptions", () => {
    expect(validateIssueDescription("").ok).toBe(false);
    expect(validateIssueDescription("   \n  ").ok).toBe(false);
  });

  it("accepts exactly the approved ASCII limit", () => {
    expect(validateIssueDescription("a".repeat(1999)).ok).toBe(true);
    expect(validateIssueDescription("a".repeat(2000)).ok).toBe(true);
  });

  it("rejects descriptions over the approved ASCII limit", () => {
    expect(validateIssueDescription("a".repeat(2001)).ok).toBe(false);
  });

  it("counts Unicode code points rather than UTF-16 units", () => {
    expect(validateIssueDescription("🙂".repeat(1999)).ok).toBe(true);
    expect(validateIssueDescription("🙂".repeat(2000)).ok).toBe(true);
    expect(validateIssueDescription("🙂".repeat(2001)).ok).toBe(false);
    expect(validateIssueDescription("e\u0301".repeat(1000)).ok).toBe(true);
    expect(validateIssueDescription("e\u0301".repeat(1001)).ok).toBe(false);
  });

  it("rejects common Unicode whitespace", () => {
    expect(validateIssueDescription("\t\n\r")).toMatchObject({ ok: false });
    expect(validateIssueDescription("\u00a0\u2003")).toMatchObject({ ok: false });
  });

  it("rejects non-string input", () => {
    expect(validateIssueDescription(undefined)).toMatchObject({ ok: false });
    expect(validateIssueDescription(new File(["issue"], "issue.txt"))).toMatchObject({ ok: false });
  });

  it("normalizes a valid description", () => {
    expect(validateIssueDescription("  Falta material  ")).toEqual({
      ok: true,
      value: "Falta material",
    });
  });

  it("allows only organization members to create issues", () => {
    expect(canCreateTaskIssue("owner")).toBe(true);
    expect(canCreateTaskIssue("admin")).toBe(true);
    expect(canCreateTaskIssue("member")).toBe(true);
    expect(canCreateTaskIssue("outsider" as never)).toBe(false);
  });

  it("requires the task to match the organization and project", () => {
    const base = {
      organizationId: "org-a",
      projectId: "project-a",
      taskId: "task-a",
    };

    expect(
      isTaskIssueContextValid({
        ...base,
        task: { id: "task-a", organization_id: "org-a", project_id: "project-a" },
      })
    ).toBe(true);
    expect(
      isTaskIssueContextValid({
        ...base,
        task: { id: "task-a", organization_id: "org-b", project_id: "project-a" },
      })
    ).toBe(false);
    expect(
      isTaskIssueContextValid({
        ...base,
        task: { id: "task-a", organization_id: "org-a", project_id: "project-b" },
      })
    ).toBe(false);
    expect(
      isTaskIssueContextValid({
        ...base,
        task: { id: "task-b", organization_id: "org-a", project_id: "project-a" },
      })
    ).toBe(false);
  });

  it("derives reporter_user_id from the authenticated user payload", () => {
    expect(
      buildTaskIssuePayload({
        organizationId: "org-a",
        projectId: "project-a",
        taskId: "task-a",
        reporterUserId: "user-a",
        description: "Falta material",
      })
    ).toEqual({
      organization_id: "org-a",
      project_id: "project-a",
      task_id: "task-a",
      reporter_user_id: "user-a",
      description: "Falta material",
    });
  });

  it("sanitizes technical insert errors for server logs", () => {
    expect(
      sanitizeTaskIssueInsertError({
        code: "42501",
        message: "Bearer secret-token cookie=session-token",
      })
    ).toEqual({
      code: "42501",
      message: "Bearer [redacted] cookie=[redacted]",
    });
  });
});
