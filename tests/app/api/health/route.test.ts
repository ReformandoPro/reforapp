import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "../../../../src/app/api/health/route";

describe("GET /api/health", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns ok and the deployed commit when configured", async () => {
    vi.stubEnv("GIT_COMMIT_SHA", "abc123");

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok", commit: "abc123" });
  });

  it("returns unknown when the commit is not provided", async () => {
    vi.stubEnv("GIT_COMMIT_SHA", "");

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok", commit: "unknown" });
  });
});
