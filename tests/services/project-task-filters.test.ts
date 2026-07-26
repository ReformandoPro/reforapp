import { describe, expect, it } from "vitest";

import { filterProjectTasks, parseProjectTaskFilters } from "../../src/lib/services/project-task-filters";

const rows = [
  { id: "one", status: "pending" as const, priority: "high" as const },
  { id: "two", status: "blocked" as const, priority: "urgent" as const },
  { id: "three", status: "done" as const, priority: "high" as const },
];

describe("project task filters", () => {
  it("accepts only supported URL filter values", () => {
    expect(parseProjectTaskFilters({ status: "blocked", priority: "urgent" })).toEqual({
      status: "blocked",
      priority: "urgent",
    });
    expect(parseProjectTaskFilters({ status: "delete-all", priority: "urgent" })).toEqual({
      status: null,
      priority: "urgent",
    });
    expect(parseProjectTaskFilters({ status: "blocked", priority: "critical" })).toEqual({
      status: "blocked",
      priority: null,
    });
    expect(parseProjectTaskFilters({ status: "delete-all", priority: "critical" })).toEqual({
      status: null,
      priority: null,
    });
  });

  it("filters by status and priority without mutating the source", () => {
    expect(filterProjectTasks(rows, { status: "blocked", priority: "urgent" })).toEqual([rows[1]]);
    expect(filterProjectTasks(rows, { status: null, priority: "high" })).toEqual([rows[0], rows[2]]);
    expect(filterProjectTasks(rows, { status: null, priority: null })).toEqual(rows);
    expect(rows).toHaveLength(3);
  });
});
