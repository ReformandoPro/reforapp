import { describe, expect, it } from "vitest";

import { isTaskPriority } from "../../src/lib/domain/tasks/priority";
import { isTaskStatus } from "../../src/lib/domain/tasks/status";
import { mockProjectTasks } from "../../src/lib/mock/tasks";
import { getProjectTasks } from "../../src/lib/services/tasks";

describe("tasks service", () => {
  it('returns tasks for "project_obra_centro"', () => {
    expect(getProjectTasks("project_obra_centro")).toEqual(mockProjectTasks);
  });

  it('returns only tasks belonging to "project_obra_centro"', () => {
    const tasks = getProjectTasks("project_obra_centro");

    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.every((task) => task.projectId === "project_obra_centro")).toBe(
      true
    );
  });

  it('returns an empty array for an unknown project id', () => {
    expect(getProjectTasks("unknown")).toEqual([]);
  });

  it("validates task status values", () => {
    expect(isTaskStatus("todo")).toBe(true);
    expect(isTaskStatus("blocked")).toBe(true);
    expect(isTaskStatus("unknown")).toBe(false);
  });

  it("validates task priority values", () => {
    expect(isTaskPriority("low")).toBe(true);
    expect(isTaskPriority("urgent")).toBe(true);
    expect(isTaskPriority("unknown")).toBe(false);
  });
});
