# Comparative review of agent-coordination proposals

Status: architecture decision draft. No protocol is active and no automation is authorized by this document.

## Candidates

### A. ACP-1 — `feat/acp-1-protocol`

Artifacts:

- `acp/ACP-1.md`
- `acp/AGENTS.md`
- `acp/acp.yml`

Scope: complete coordination protocol modeled as a distributed system.

Distinctive mechanisms:

- append-only event log with derived projections;
- causal predecessor (`after`);
- exact evidence basis (`basis`);
- review invalidation and scoped revalidation;
- declared write surfaces (`touches`);
- expiring leases and heartbeats;
- explicit uncertainty (`unverified`, `falsified`, `would_change_my_mind`);
- questions with `default_if_silent` and `expires`;
- composite state (`phase`, `freshness`, modifiers);
- cold-start path with a numeric context budget;
- default-deny platform permissions;
- explicit gates and separation of powers;
- documented limitations and manual scale ceiling.

### B. Manual MVP — `chore/agent-protocol-mvp`

Artifacts:

- `docs/agents/protocol.md`
- `.github/ISSUE_TEMPLATE/agent-task.yml`

Scope: immediately understandable manual workflow centered on one Issue per work item.

Distinctive strengths:

- concise role definitions;
- simple linear lifecycle;
- direct mapping to current Reformando practice;
- practical Issue form;
- explicit remote-write and deployment declarations;
- low learning cost.

### C. Openclaw operating notes — `openclaw/agent-operating-protocol`

Artifacts changed by commit `abcd9fb2645857dcd3010b771ea729b650d017c2`:

- `agents/hermes/README.md`
- `docs/agent-coordination/HANDOFF_HERMES_TO_OPENCLAW.md`
- `docs/agent-coordination/HANDOFF_OPENCLAW_TO_HERMES.md`

Scope: bilateral handoff discipline between Hermes and Openclaw.

Distinctive strengths:

- evidence must be literal and real;
- agents must stop when Git state cannot be verified;
- Hermes must not claim persistence without Git evidence;
- practical rule: **Hermes proposes, Openclaw persists**;
- explicit handoff payloads.

## Decision

ACP-1 is the only candidate that can serve as the canonical protocol specification. It addresses concurrency, causal races, stale evidence, session loss, authority, silence, leases, and recovery as first-class concerns. The other proposals are useful operational profiles, not competing system architectures.

The canonical system should therefore use:

1. **ACP-1 as the normative semantic core.**
2. **The manual MVP Issue form as an ACP profile artifact**, rebuilt after the envelope schema exists.
3. **Openclaw's bilateral handoff rules as role-profile guidance**, not as global protocol semantics.

## Elements to retain from the manual MVP

The following ideas should be mapped into ACP rather than discarded:

- one Issue as the human-visible coordination record for one work item;
- explicit objective, in-scope, out-of-scope, acceptance criteria, risks, and next action;
- explicit booleans for remote writes, deploys, and product approval;
- a low-complexity presentation for human operators;
- pilot-first adoption before automation.

The simple linear status list should not become normative because it collapses phase, freshness, and blocking into a single field. ACP-1's composite state is more accurate. A linear status may remain a derived UI projection.

## Elements to retain from Openclaw

The following rules should become role-profile or conformance guidance:

- **Hermes proposes, Openclaw persists** when Hermes lacks verified Git authority.
- No agent may claim a commit, push, merge, workflow result, or validation without literal evidence.
- A Git verification failure is a stop condition, not an invitation to infer.
- Handoffs must include objective, files or surfaces, evidence, validations, risks, limits, and assumptions.

These rules complement ACP's `basis`, evidence, permissions, and handoff events.

## Required changes before adoption

ACP-1 should not be merged or activated yet. The following decisions remain:

1. **Identity:** create or connect one GitHub identity per agent, or explicitly accept honor-system actors for the pilot.
2. **Language:** choose the normative language. Recommendation for the pilot: Spanish normative text, English identifiers and schemas.
3. **Discovery:** decide how the root `AGENTS.md` points to `acp/AGENTS.md` without displacing current repository instructions.
4. **Envelope schema:** define the executable JSON Schema before creating final templates.
5. **Profiles:** express Reformando-specific role constraints separately from the generic protocol core.
6. **Pilot boundary:** choose exactly two work items and prohibit ACP from retroactively governing R1/R2 history.
7. **Governance:** define who may amend `acp.yml` and how protocol-version changes invalidate active items.

## Proposed consolidation sequence

1. Hermes performs adversarial review of ACP-1 as a protocol, not as prose.
2. Openclaw performs implementability review against GitHub's actual capabilities and account model.
3. Claude responds to findings and publishes a revised ACP-1 SHA.
4. Define `acp/envelope.schema.json`.
5. Generate Issue and PR templates from the schema and ACP profile.
6. Add a one-line discovery link from root agent instructions only after approval.
7. Run two manual pilots.
8. Measure whether Jorge's copy/paste mediation materially decreases.
9. Consider automation only after the pilots.

## Non-goals of this decision

This document does not:

- activate ACP;
- create labels or Projects;
- authorize bots, Actions, webhooks, scripts, or GitHub Apps;
- authorize merges, deployments, migrations, database writes, or runtime changes;
- change R1, R2, or R2.1;
- select final agent handles.

## Recommendation for independent review

Reviewers should attack at least these failure modes:

- simultaneous claims with the same causal predecessor;
- silent lease expiry while an agent still writes;
- scope overlap hidden by broad or dishonest `touches`;
- stale reviews that appear current in projections;
- a malicious or confused agent self-declaring another actor;
- defaults that allow irreversible action after human silence;
- checkpoint summaries that omit inconvenient evidence;
- `unverified` becoming ritual text rather than epistemic control;
- deadlocks involving stacked branches and dependent work items;
- program recovery when projections are wrong and the event log is very large.
