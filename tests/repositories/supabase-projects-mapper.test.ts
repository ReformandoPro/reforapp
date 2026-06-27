import { describe, expect, it } from "vitest";

import {
  mapSupabaseProjectCardPartialRowToProjectCard,
  type SupabaseProjectCardPartialRow,
} from "../../src/lib/repositories/supabase-projects-mapper";

describe("mapSupabaseProjectCardPartialRowToProjectCard", () => {
  it("maps id, name, clientName and status correctly", () => {
    const row: SupabaseProjectCardPartialRow = {
      id: "project_1",
      name: "Reforma parcial",
      status: "in_progress",
      client_id: "client_1",
      client: {
        id: "client_1",
        display_name: "Familia Pérez",
      },
    };

    const projectCard = mapSupabaseProjectCardPartialRowToProjectCard(row);

    expect(projectCard).toMatchObject({
      id: "project_1",
      name: "Reforma parcial",
      clientName: "Familia Pérez",
      status: "in_progress",
    });
  });

  it("initializes all controlled counters to 0", () => {
    const row: SupabaseProjectCardPartialRow = {
      id: "project_2",
      name: "Obra centro",
      status: "scheduled",
      client_id: "client_2",
      client: {
        id: "client_2",
        display_name: "Cliente Centro",
      },
    };

    const projectCard = mapSupabaseProjectCardPartialRowToProjectCard(row);

    expect(projectCard.delayedTasksCount).toBe(0);
    expect(projectCard.blockedTasksCount).toBe(0);
    expect(projectCard.pendingApprovalsCount).toBe(0);
  });

  it("does not require any Supabase connection to map data", () => {
    const row: SupabaseProjectCardPartialRow = {
      id: "project_3",
      name: "Reforma cocina",
      status: "scheduled",
      client_id: "client_3",
      client: {
        id: "client_3",
        display_name: "Ana López",
      },
    };

    expect(() => mapSupabaseProjectCardPartialRowToProjectCard(row)).not.toThrow();
  });

  it("throws if project status is invalid", () => {
    const row: SupabaseProjectCardPartialRow = {
      id: "project_4",
      name: "Estado inválido",
      status: "unknown_status",
      client_id: "client_4",
      client: {
        id: "client_4",
        display_name: "Cliente Test",
      },
    };

    expect(() => mapSupabaseProjectCardPartialRowToProjectCard(row)).toThrow(
      "Invalid project status: unknown_status"
    );
  });
});
