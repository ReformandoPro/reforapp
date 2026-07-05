import { describe, expect, it } from "vitest";

import { buildDashboardActivity } from "@/lib/services/dashboard-activity";
import { calculateDashboardMetrics } from "@/lib/services/dashboard-metrics";
import { normalizeProjectProgress, normalizeProjectStatus } from "@/lib/services/private-projects";
import type { Client, Project } from "@/lib/types/reformando";

const baseProject: Project = {
  id: "project-1",
  organizationId: "org-1",
  clientId: "client-1",
  name: "Reforma integral",
  status: "in_progress",
  address: "Calle Demo 1",
  type: "Vivienda",
  progress: 60,
  clientName: "Cliente Demo",
  createdAt: "2026-07-01T10:00:00.000Z",
  updatedAt: "2026-07-02T10:00:00.000Z",
};

const baseClient: Client = {
  id: "client-1",
  organizationId: "org-1",
  displayName: "Cliente Demo",
  email: null,
  phone: null,
  address: null,
  notes: null,
  createdAt: "2026-07-03T10:00:00.000Z",
  updatedAt: "2026-07-03T10:00:00.000Z",
};

describe("dashboard real data services", () => {
  it("calculates dashboard metrics from real project and client rows", () => {
    const metrics = calculateDashboardMetrics({
      projects: {
        ok: true,
        data: [
          baseProject,
          { ...baseProject, id: "project-2", status: "budgeting", progress: 40 },
          { ...baseProject, id: "project-3", status: "completed", progress: 100 },
        ],
      },
      clients: { ok: true, data: [baseClient, { ...baseClient, id: "client-2" }] },
    });

    expect(metrics.activeProjectsCount.value).toBe(1);
    expect(metrics.budgetingProjectsCount.value).toBe(1);
    expect(metrics.clientsCount.value).toBe(2);
    expect(metrics.averageProgress.value).toBe(67);
  });

  it("returns zero metrics for empty real data instead of error states", () => {
    const metrics = calculateDashboardMetrics({
      projects: { ok: true, data: [] },
      clients: { ok: true, data: [] },
    });

    expect(metrics.activeProjectsCount).toMatchObject({ ok: true, value: 0 });
    expect(metrics.budgetingProjectsCount).toMatchObject({ ok: true, value: 0 });
    expect(metrics.clientsCount).toMatchObject({ ok: true, value: 0 });
    expect(metrics.averageProgress).toMatchObject({ ok: true, value: 0 });
  });

  it("builds recent activity from available real data and tolerates partial query failures", () => {
    const activity = buildDashboardActivity({
      projects: { ok: false, message: "No se pudieron cargar las obras." },
      clients: { ok: true, data: [baseClient] },
    });

    expect(activity.ok).toBe(true);
    if (activity.ok) {
      expect(activity.items).toHaveLength(1);
      expect(activity.items[0]).toMatchObject({ label: "Cliente creado", href: "/app/clients/client-1" });
    }
  });

  it("only returns an activity error when all source queries fail", () => {
    const activity = buildDashboardActivity({
      projects: { ok: false, message: "No se pudieron cargar las obras." },
      clients: { ok: false, message: "No se pudieron cargar los clientes." },
    });

    expect(activity).toEqual({ ok: false, message: "No se pudo cargar la actividad reciente." });
  });

  it("normalizes legacy staging project values without throwing dashboard errors", () => {
    expect(normalizeProjectStatus("active")).toBe("in_progress");
    expect(normalizeProjectStatus("open")).toBe("in_progress");
    expect(normalizeProjectStatus("draft")).toBe("lead");
    expect(normalizeProjectStatus("pending")).toBe("budgeting");
    expect(normalizeProjectStatus("unexpected")).toBe("lead");
    expect(normalizeProjectProgress(null)).toBe(0);
    expect(normalizeProjectProgress(120)).toBe(100);
    expect(normalizeProjectProgress(-5)).toBe(0);
  });
});
