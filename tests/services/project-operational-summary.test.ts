import { describe, expect, it } from "vitest";

import { computeTaskOperationalStats } from "../../src/lib/services/project-operational-summary";
import { isProjectTaskPriority, isProjectTaskStatus } from "../../src/lib/services/project-tasks";

describe("project-tasks", () => {
  it("validates task status values", () => {
    expect(isProjectTaskStatus("pending")).toBe(true);
    expect(isProjectTaskStatus("in_progress")).toBe(true);
    expect(isProjectTaskStatus("done")).toBe(true);
    expect(isProjectTaskStatus("blocked")).toBe(true);
    expect(isProjectTaskStatus("todo")).toBe(false);
    expect(isProjectTaskStatus("unknown")).toBe(false);
  });

  it("validates task priority values", () => {
    expect(isProjectTaskPriority("low")).toBe(true);
    expect(isProjectTaskPriority("medium")).toBe(true);
    expect(isProjectTaskPriority("high")).toBe(true);
    expect(isProjectTaskPriority("urgent")).toBe(true);
    expect(isProjectTaskPriority("unknown")).toBe(false);
  });
});

describe("project-operational-summary", () => {
  it("computes empty stats safely", () => {
    expect(computeTaskOperationalStats([])).toEqual({
      total: 0,
      pending: 0,
      inProgress: 0,
      blocked: 0,
      done: 0,
      completionPercent: 0,
    });
  });

  it("computes task stats and completion percent", () => {
    const stats = computeTaskOperationalStats([
      { status: "pending" },
      { status: "in_progress" },
      { status: "blocked" },
      { status: "done" },
      { status: "done" },
    ]);

    expect(stats.total).toBe(5);
    expect(stats.pending).toBe(1);
    expect(stats.inProgress).toBe(1);
    expect(stats.blocked).toBe(1);
    expect(stats.done).toBe(2);
    expect(stats.completionPercent).toBe(40);
  });

  it("treats unknown statuses as pending (defensive)", () => {
    const stats = computeTaskOperationalStats([{ status: "unknown" }, { status: "done" }]);

    expect(stats.total).toBe(2);
    expect(stats.pending).toBe(1);
    expect(stats.done).toBe(1);
    expect(stats.completionPercent).toBe(50);
  });
});

