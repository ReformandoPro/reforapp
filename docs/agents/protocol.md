# Reformando Agent Coordination Protocol

Status: MVP manual-structured protocol. This document does not authorize remote writes, deployments, migrations, or destructive actions.

## Purpose

GitHub is the shared source of truth for coordination between Jorge, Openclaw, Hermes, Claude, and ChatGPT. Every technical work item should be recoverable from its Issue, linked PR, reviews, checks, and artifacts without requiring Jorge to copy messages between sessions.

## Roles

- **Jorge** — Product Owner. Prioritizes work and authorizes sensitive actions.
- **Openclaw** — Technical operator. Handles branches, PRs, GitHub Actions, artifacts, runtime diagnostics, and controlled execution.
- **Hermes** — Independent adversarial reviewer. Produces GO/NO-GO verdicts tied to exact SHAs and evidence.
- **Claude** — Implementation and empirical validation. Builds complex changes and runs Docker/PostgreSQL/browser validation when authorized.
- **ChatGPT** — Technical coordination, synthesis, risk control, and sequencing.

An agent must not approve its own implementation as independent review. Self-validation is evidence, not independent approval.

## Source of truth

Each work item has one GitHub Issue. The Issue must link:

- specification or objective;
- owner, reviewer, and validator;
- exact branch and SHA;
- pull request;
- checks and workflow runs;
- artifacts and hashes;
- current status;
- authorizations and prohibitions;
- final decision.

The Issue is the coordination record. The PR is the implementation record. Checks and artifacts are evidence.

## Work-item header

Use this block in the Issue body and keep it current:

```yaml
work_item: R2.1
owner: openclaw
reviewer: hermes
validator: claude
status: specified
risk: high
branch: null
sha: null
pr: null
remote_writes_allowed: false
deploy_allowed: false
requires_product_approval: true
```

## Comment envelope

Every agent update begins with a machine-readable envelope:

```yaml
agent: hermes
action: review
status: approved
work_item: R2.1
sha: 0123456789abcdef0123456789abcdef01234567
blocking: false
remote_writes_performed: false
verdict: GO
```

Then add a human-readable summary with evidence, risks, and next action.

### Required fields

- `agent`: `openclaw`, `hermes`, `claude`, `chatgpt`, or `jorge`.
- `action`: `specify`, `implement`, `review`, `validate`, `authorize`, `merge`, `diagnose`, or `close`.
- `status`: one of the states below.
- `work_item`: stable identifier.
- `sha`: exact commit reviewed or validated; `null` only before implementation.
- `blocking`: boolean.
- `remote_writes_performed`: boolean.
- `verdict`: concise result.

## State machine

Normal path:

`specified -> implementing -> waiting-review -> waiting-validation -> ready-to-merge -> waiting-approval -> done`

Correction path:

`waiting-review -> changes-required -> implementing`

Blocking path:

`* -> blocked`

Allowed states:

- `specified`
- `implementing`
- `waiting-review`
- `changes-required`
- `waiting-validation`
- `ready-to-merge`
- `waiting-approval`
- `blocked`
- `done`

## Transition rules

1. `specified -> implementing`: objective, scope, prohibited actions, and acceptance criteria exist.
2. `implementing -> waiting-review`: branch is published and exact SHA is recorded.
3. `waiting-review -> waiting-validation`: Hermes approves the exact SHA.
4. `waiting-review -> changes-required`: Hermes finds a blocking defect.
5. `waiting-validation -> ready-to-merge`: required checks and empirical validation pass for the same SHA.
6. `ready-to-merge -> waiting-approval`: action requires Jorge's explicit authorization.
7. `waiting-approval -> done`: authorized action is completed and postconditions are verified.
8. Any SHA change invalidates prior review and validation unless the reviewer explicitly confirms the new SHA is equivalent.

## Evidence rules

A claim must link or record the evidence needed to verify it:

- branch and full SHA;
- PR number;
- workflow run and job IDs;
- artifact name, ID, size, and SHA-256 when relevant;
- environment and version information;
- exact verdict;
- limitations and unverified items.

Do not replace missing evidence with assumptions.

## Security rules

- Never post secrets, tokens, passwords, JWTs, cookies, database URLs with credentials, or service-role values.
- Sensitive actions require explicit authorization in the Issue.
- `remote_writes_allowed: false` means no SQL writes, migrations, deploys, restarts, destructive API calls, or runtime changes.
- A read-only diagnostic must remain read-only even if it finds an obvious fix.
- Production and protected environments require a separate explicit approval.

## Merge gate

A high-risk PR is ready to merge only when the Issue contains:

- exact head SHA;
- independent Hermes verdict for that SHA;
- required CI checks passing;
- empirical validation when required;
- no unresolved blocking findings;
- explicit Jorge authorization when marked required;
- confirmation that prohibited remote actions were not performed.

## MVP operation

This first version is manual by design:

- agents read the Issue and post structured comments;
- humans or agents update labels and the Issue header;
- no workflow automatically merges, deploys, migrates, or writes remotely;
- automation may be added only after two successful pilot work items.

## Pilot candidates

1. R2.1 authenticated INSERT grant on memberships.
2. App-beta HTTP 503 runtime diagnosis.

Both must remain isolated from ongoing R1 execution until explicitly authorized.