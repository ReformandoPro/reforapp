import { describe, expect, it } from "vitest";

import {
  canCreateProjects,
  canWriteProjectPhases,
  canWriteProjectTasks,
} from "../../src/lib/services/project-operational-permissions";

describe("project-operational-permissions", () => {
  it("restricts phases writes to owner/admin", () => {
    expect(canWriteProjectPhases("owner")).toBe(true);
    expect(canWriteProjectPhases("admin")).toBe(true);
    expect(canWriteProjectPhases("member")).toBe(false);
  });

  it("restricts task writes to owner/admin as enforced by RLS", () => {
    expect(canWriteProjectTasks("owner")).toBe(true);
    expect(canWriteProjectTasks("admin")).toBe(true);
    expect(canWriteProjectTasks("member")).toBe(false);
  });

  it("restricts project creation to owner/admin as enforced by RLS", () => {
    expect(canCreateProjects("owner")).toBe(true);
    expect(canCreateProjects("admin")).toBe(true);
    expect(canCreateProjects("member")).toBe(false);
  });
});
