import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(
  new URL("../../.github/workflows/deploy-app-beta.yml", import.meta.url),
  "utf8"
);

describe("app-beta deploy by SHA workflow", () => {
  it("requires a full SHA for manual dispatch and keeps push deployments on github.sha", () => {
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("deploy_sha:");
    expect(workflow).toContain('required: true');
    expect(workflow).toContain('EXPECTED_SHA=\"${{ github.sha }}\"');
    expect(workflow).toContain('EXPECTED_SHA=\"$DEPLOY_SHA_INPUT\"');
  });

  it("validates the SHA, repository, detached checkout and health response", () => {
    expect(workflow).toContain('^ [0-9a-fA-F]{40}$'.replace("^ ", "^"));
    expect(workflow).toContain('git cat-file -e "$EXPECTED_SHA^{commit}"');
    expect(workflow).toContain('git checkout --detach "$EXPECTED_SHA"');
    expect(workflow).toContain("https://github.com/ReformandoPro/reforapp.git");
    expect(workflow).toContain('docker compose build --build-arg GIT_COMMIT_SHA="$EXPECTED_SHA"');
    expect(workflow).toContain('body.commit === expected');
    expect(workflow).toContain('SERVICE="reformando-app-beta"');
    expect(workflow).not.toContain("production");
    expect(workflow).not.toContain("git pull");
  });
});
