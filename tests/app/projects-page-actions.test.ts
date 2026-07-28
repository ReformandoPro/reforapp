import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOrganizationContextForRequest: vi.fn(),
  createServerSupabaseClient: vi.fn(),
  listProjects: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement("a", { href, ...props }, children),
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("../../src/lib/services/org-context", () => ({
  getOrganizationContextForRequest: mocks.getOrganizationContextForRequest,
}));
vi.mock("../../src/lib/supabase/ssr", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
}));
vi.mock("../../src/lib/services/private-projects", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/lib/services/private-projects")>();
  return {
    ...actual,
    createSupabaseProjectsReader: () => ({ listProjects: mocks.listProjects }),
  };
});

import AppProjectsPage from "../../src/app/app/projects/page";

async function renderPage(role: "owner" | "admin" | "member") {
  mocks.getOrganizationContextForRequest.mockResolvedValue({
    ok: true,
    organizationId: "org-a",
    role,
    user: { id: `user-${role}` },
  });
  mocks.createServerSupabaseClient.mockResolvedValue({});
  const element = await AppProjectsPage();
  return renderToStaticMarkup(element);
}

describe("private projects page creation actions", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it.each(["owner", "admin"] as const)(
    "keeps Nueva obra visible for %s when the project read fails",
    async (role) => {
      mocks.listProjects.mockRejectedValue(new Error("internal database detail"));

      const html = await renderPage(role);

      expect(html).toContain("No se pudieron cargar las obras");
      expect(html).toContain("Nueva obra");
      expect(html).toContain('href="/app/projects/new"');
      expect(html).not.toContain("internal database detail");
    }
  );

  it.each(["owner", "admin"] as const)(
    "keeps Nueva obra visible for %s in the empty state",
    async (role) => {
      mocks.listProjects.mockResolvedValue([]);

      const html = await renderPage(role);

      expect(html).toContain("Todavía no hay obras");
      expect(html).toContain("Nueva obra");
    }
  );

  it("does not expose project creation to a member", async () => {
    mocks.listProjects.mockResolvedValue([]);

    const html = await renderPage("member");

    expect(html).toContain("Todavía no hay obras");
    expect(html).not.toContain("Nueva obra");
    expect(html).not.toContain('href="/app/projects/new"');
  });
});
