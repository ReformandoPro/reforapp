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
    expect(workflow).toContain('mktemp -d /tmp/reformando-app-beta-deploy.XXXXXX');
    expect(workflow).toContain("trap 'rm -rf \"$DEPLOY_ROOT\"' EXIT");
    expect(workflow).toContain('git clone --no-checkout --no-tags');
    expect(workflow).toContain('context: ${DEPLOY_ROOT}/repo');
    expect(workflow).toContain("https://github.com/ReformandoPro/reforapp.git");
    expect(workflow).toContain('docker compose -f docker-compose.yml -f "$COMPOSE_OVERRIDE" build "$SERVICE"');
    expect(workflow).toContain('GIT_COMMIT_SHA: ${EXPECTED_SHA}');
    expect(workflow).toContain('body.commit === expected');
    expect(workflow).toContain('SERVICE="reformando-app-beta"');
    expect(workflow).not.toContain("production");
    expect(workflow).not.toContain("git pull");
    expect(workflow).not.toContain("git reset --hard");
    expect(workflow).not.toContain("git clean -fd");
    expect(workflow).not.toContain('git checkout main');
  });
});
