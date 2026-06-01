import { describe, expect, it } from "vitest";

import {
  mapSupabaseTaskRowToProjectTaskListItem,
  type SupabaseTaskRow,
} from "../../src/lib/repositories/supabase-tasks-mapper";

describe("mapSupabaseTaskRowToProjectTaskListItem", () => {
  const baseRow: Omit<SupabaseTaskRow, "id" | "status"> = {
    project_id: "project_obra_centro",
    title: "Tarea de prueba",
    priority: "medium",
    assignee_name: null,
    due_date: null,
    blocked_reason: null,
    section_label: null,
  };

  it("maps status todo", () => {
    const row: SupabaseTaskRow = { id: "task_1", status: "todo", ...baseRow };
    const task = mapSupabaseTaskRowToProjectTaskListItem(row);
    expect(task.status).toBe("todo");
  });

  it("maps status in_progress", () => {
    const row: SupabaseTaskRow = {
      id: "task_2",
      status: "in_progress",
      ...baseRow,
    };
    const task = mapSupabaseTaskRowToProjectTaskListItem(row);
    expect(task.status).toBe("in_progress");
  });

  it("maps status blocked", () => {
    const row: SupabaseTaskRow = { id: "task_3", status: "blocked", ...baseRow };
    const task = mapSupabaseTaskRowToProjectTaskListItem(row);
    expect(task.status).toBe("blocked");
  });

  it("maps status done", () => {
    const row: SupabaseTaskRow = { id: "task_4", status: "done", ...baseRow };
    const task = mapSupabaseTaskRowToProjectTaskListItem(row);
    expect(task.status).toBe("done");
  });

  it("maps status cancelled", () => {
    const row: SupabaseTaskRow = {
      id: "task_5",
      status: "cancelled",
      ...baseRow,
    };
    const task = mapSupabaseTaskRowToProjectTaskListItem(row);
    expect(task.status).toBe("cancelled");
  });

  it("throws if task status is invalid", () => {
    const row: SupabaseTaskRow = {
      id: "task_invalid",
      status: "unknown_status",
      ...baseRow,
    };

    expect(() => mapSupabaseTaskRowToProjectTaskListItem(row)).toThrow(
      "Invalid task status: unknown_status"
    );
  });

  it("derives isBlocked when status is blocked", () => {
    const row: SupabaseTaskRow = {
      id: "task_blocked",
      status: "blocked",
      ...baseRow,
      blocked_reason: null,
    };

    const task = mapSupabaseTaskRowToProjectTaskListItem(row);
    expect(task.isBlocked).toBe(true);
  });

  it("derives isBlocked when blocked_reason exists", () => {
    const row: SupabaseTaskRow = {
      id: "task_blocked_reason",
      status: "todo",
      ...baseRow,
      blocked_reason: "Falta material",
    };

    const task = mapSupabaseTaskRowToProjectTaskListItem(row);
    expect(task.isBlocked).toBe(true);
  });

  it("derives isDelayed when due_date is before today and task is not done/cancelled", () => {
    const row: SupabaseTaskRow = {
      id: "task_delayed",
      status: "in_progress",
      ...baseRow,
      due_date: "2026-05-30",
    };

    const task = mapSupabaseTaskRowToProjectTaskListItem(row, {
      now: new Date("2026-06-01T10:00:00.000Z"),
    });

    expect(task.isDelayed).toBe(true);
  });

  it("does not mark as delayed when status is done", () => {
    const row: SupabaseTaskRow = {
      id: "task_done",
      status: "done",
      ...baseRow,
      due_date: "2026-05-30",
    };

    const task = mapSupabaseTaskRowToProjectTaskListItem(row, {
      now: new Date("2026-06-01T10:00:00.000Z"),
    });

    expect(task.isDelayed).toBe(false);
  });

  it("does not mark as delayed when status is cancelled", () => {
    const row: SupabaseTaskRow = {
      id: "task_cancelled",
      status: "cancelled",
      ...baseRow,
      due_date: "2026-05-30",
    };

    const task = mapSupabaseTaskRowToProjectTaskListItem(row, {
      now: new Date("2026-06-01T10:00:00.000Z"),
    });

    expect(task.isDelayed).toBe(false);
  });
});
