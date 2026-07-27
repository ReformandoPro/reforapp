import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TaskBoard } from "../../src/components/tasks";
import { groupProjectTasksByStatus } from "../../src/lib/data/projects";

const task = {
  id: "task-a",
  phaseId: null,
  phaseTitle: null,
  title: "Preparar paredes",
  description: null,
  status: "pending" as const,
  priority: "medium" as const,
  dueDate: null,
};

describe("TaskBoard", () => {
  it("renders all columns, counts and task cards", () => {
    const html = renderToStaticMarkup(
      React.createElement(TaskBoard, {
        columns: groupProjectTasksByStatus([
          task,
          { ...task, id: "task-b", status: "blocked" },
        ]),
      })
    );

    expect(html).toContain("Pendientes");
    expect(html).toContain("En curso");
    expect(html).toContain("Bloqueadas");
    expect(html).toContain("Hechas");
    expect(html).toContain('role="list"');
    expect(html).toContain('role="listitem"');
    expect(html).toContain("Preparar paredes");
    expect(html).toContain("Estado: Pendiente");
    expect(html).toContain("Prioridad: Media");
  });

  it("renders empty columns and the project empty state", () => {
    const html = renderToStaticMarkup(
      React.createElement(TaskBoard, {
        columns: groupProjectTasksByStatus([]),
      })
    );

    expect(html).toContain("Este proyecto todavía no tiene tareas.");
    expect(html.match(/Sin tareas/g)).toHaveLength(4);
  });

  it("renders cards without phase, date or responsible", () => {
    const html = renderToStaticMarkup(
      React.createElement(TaskBoard, {
        columns: groupProjectTasksByStatus([task]),
      })
    );

    expect(html).toContain("Fase");
    expect(html).toContain("Sin fase");
    expect(html).toContain("Sin fecha límite");
    expect(html).not.toContain("Responsable");
  });
});
