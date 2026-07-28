import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CreateProjectTaskFields } from "../../src/components/tasks/CreateProjectTaskForm";

const phase = {
  id: "30000000-0000-4000-8000-000000000001",
  title: "Preparación",
  description: null,
  status: "planned" as const,
  startDate: null,
  endDate: null,
  sortOrder: 1,
};

describe("CreateProjectTaskForm", () => {
  it("renders accessible fields, real priorities and pending-only guidance", () => {
    const html = renderToStaticMarkup(
      React.createElement(CreateProjectTaskFields, {
        phases: [phase],
        pending: false,
        state: { status: "idle", message: null, fieldErrors: {} },
      })
    );

    expect(html).toContain("Título");
    expect(html).toContain("Descripción");
    expect(html).toContain("Preparación");
    expect(html).toContain("Sin fase");
    expect(html).toContain("Baja");
    expect(html).toContain("Media");
    expect(html).toContain("Alta");
    expect(html).toContain("Urgente");
    expect(html).toContain("La tarea se creará con estado Pendiente.");
    expect(html).not.toContain('name="status"');
  });

  it("shows field and general validation errors accessibly", () => {
    const html = renderToStaticMarkup(
      React.createElement(CreateProjectTaskFields, {
        phases: [],
        pending: false,
        state: {
          status: "error",
          message: "Revisa los campos indicados.",
          fieldErrors: {
            title: "El título es obligatorio.",
            dueDate: "Introduce una fecha válida.",
          },
        },
      })
    );

    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain("El título es obligatorio.");
    expect(html).toContain("Introduce una fecha válida.");
    expect(html).toContain('role="alert"');
  });

  it("disables submission and exposes sending state", () => {
    const html = renderToStaticMarkup(
      React.createElement(CreateProjectTaskFields, {
        phases: [],
        pending: true,
        state: { status: "idle", message: null, fieldErrors: {} },
      })
    );

    expect(html).toContain("Creando…");
    expect(html).toContain("disabled");
  });
});
