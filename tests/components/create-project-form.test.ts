import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CreateProjectFields } from "../../src/app/app/projects/new/CreateProjectForm";
import { mapClientRowsToOptions } from "../../src/app/app/projects/new/page";

describe("CreateProjectForm", () => {
  it("normalizes empty, malformed and valid client rows without dereferencing missing values", () => {
    expect(
      mapClientRowsToOptions([
        { id: "client-a", display_name: " Cliente A " },
        { id: "client-without-name" },
        { display_name: "Cliente sin id" },
        undefined,
      ])
    ).toEqual([{ id: "client-a", displayName: "Cliente A" }]);
    expect(mapClientRowsToOptions(null)).toEqual([]);
  });

  it("renders only the MVP fields and keeps the client optional", () => {
    const html = renderToStaticMarkup(
      React.createElement(CreateProjectFields, {
        clients: [{ id: "client-a", displayName: "Cliente A" }],
        pending: false,
        state: { status: "idle", message: null, fieldErrors: {} },
      })
    );

    expect(html).toContain("Nombre");
    expect(html).toContain("Cliente");
    expect(html).toContain("Descripción");
    expect(html).toContain("Fecha inicio");
    expect(html).toContain("Fecha fin prevista");
    expect(html).toContain("Sin cliente asignado");
    expect(html).not.toContain('name="organization_id"');
    expect(html).not.toContain('name="status"');
  });

  it("shows server validation errors and pending state accessibly", () => {
    const html = renderToStaticMarkup(
      React.createElement(CreateProjectFields, {
        clients: [],
        pending: true,
        state: {
          status: "error",
          message: "Revisa los campos indicados.",
          fieldErrors: { name: "Nombre inválido." },
        },
      })
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain("Nombre inválido.");
    expect(html).toContain("Creando obra…");
    expect(html).toContain("disabled");
  });
});
