# ACP architecture: core, profiles, bindings, and implementations

Status: architecture draft for comparative review. ACP is not active. This document does not authorize automation, remote writes, migrations, deploys, or changes to protected repository surfaces.

## 1. Purpose

ACP should be designed as a reusable coordination protocol for multi-agent engineering systems, not as a Reformando-specific workflow.

The architecture separates four concerns that must not be conflated:

1. **Core semantics** — what events, claims, states, evidence, causality, leases, gates, and invalidation mean.
2. **Profiles** — constrained policy choices for a class of deployments or organizations.
3. **Bindings** — how ACP concepts map onto a collaboration platform such as GitHub.
4. **Implementations** — concrete schemas, templates, validators, projections, and user interfaces.

This separation allows the protocol to remain portable while Reformando adopts a practical GitHub-native profile.

## 2. Architectural layers

```text
ACP Core
  ├── event semantics
  ├── causality and ordering
  ├── identity and authority
  ├── evidence and uncertainty
  ├── leases and ownership
  ├── state and gates
  └── invalidation and recovery

ACP Profiles
  ├── ACP-0 minimal/manual
  ├── ACP-1 reviewed engineering
  ├── ACP-2 automated projections
  └── organization-specific profiles

Platform Bindings
  ├── GitHub
  ├── GitLab
  ├── Linear/Jira
  └── custom event stores

Implementations
  ├── JSON Schema
  ├── Issue and PR templates
  ├── validators
  ├── projection builders
  ├── dashboards
  └── automation adapters
```

## 3. ACP Core

The Core defines protocol truth. It must not depend on GitHub labels, Issue forms, Actions, or a specific repository.

The Core owns:

- work-item identity;
- append-only events;
- causal predecessor (`after`);
- evidence basis (`basis`);
- declared write surface (`touches`);
- actor and authority claims;
- leases, heartbeats, releases, and preemption;
- explicit uncertainty (`unverified`, `falsified`, `would_change_my_mind`);
- questions with `default_if_silent` and `expires`;
- composite state;
- gates;
- freshness and invalidation;
- checkpoints and recovery;
- violations and revocation;
- protocol-version compatibility.

### 3.1 Core invariants

A conforming implementation must preserve at least these invariants:

1. The event log is append-only.
2. Derived state never overrides contradictory log evidence.
3. Review, validation, authorization, and approval are bound to an explicit basis.
4. Stale evidence does not satisfy a gate.
5. An agent cannot independently approve its own delivery for the same basis.
6. Silence never authorizes irreversible or sensitive action.
7. A lease does not grant permission outside the declared scope.
8. A checkpoint compresses reading, never history.
9. Unknown or unverified facts are explicit.
10. Protocol violations remain auditable even after correction.

## 4. Profiles

A profile selects policy within the Core's allowed semantics. It must not redefine Core meanings.

Examples of profile choices:

- required event fields;
- allowed roles and capabilities;
- review independence requirements;
- lease durations;
- TTLs;
- gate composition;
- context budgets;
- allowed defaults after silence;
- maximum branch-stack depth;
- manual versus automated reconciliation;
- required evidence for high-risk work.

### 4.1 Generic profiles

- **ACP-0:** minimal manual coordination, suitable for small teams and low-risk work.
- **ACP-1:** reviewed engineering workflow with leases, invalidation, explicit evidence, and independent gates.
- **ACP-2:** ACP-1 plus validated machine projections and automated conformance checks.
- **ACP-3:** federated or multi-repository coordination with stronger identity and distributed reconciliation.

The current Claude proposal is an ACP-1 profile candidate, not the entire future ACP standard.

### 4.2 Reformando profile

The Reformando profile should define:

- Jorge as Product Owner;
- ChatGPT as coordinator;
- Openclaw as lead engineer and operator;
- Claude as engineer and empirical validator;
- Hermes as independent adversarial reviewer;
- protected surfaces such as workflows and migrations;
- explicit authorization for merge, deploy, remote SQL, migrations, and platform changes;
- staging-specific and production-specific gates;
- the rule that self-validation is evidence but not independent approval;
- the operational rule **Hermes proposes, Openclaw persists** when Hermes lacks verified Git authority.

These are profile policies, not universal Core requirements.

## 5. Bindings

A binding maps ACP semantics to a platform without changing their meaning.

### 5.1 GitHub binding

Recommended mapping:

| ACP concept | GitHub representation |
|---|---|
| Work item | Issue |
| Event log | Issue comments containing ACP envelopes |
| Human-readable projection | Issue body |
| Phase/freshness/modifiers | Labels and Project fields |
| Delivery | Branch + commit + pull request |
| Review | PR review or Issue event linked to exact SHA |
| Validation | Check run, workflow run, job, artifact |
| Evidence | Links, hashes, logs, artifacts |
| Authorization | Explicit Issue event by authorized actor |
| Checkpoint | Pinned or clearly marked Issue comment |
| Program projection | GitHub Project or summary Issue |

The Issue body, labels, and Projects are caches. The append-only comment log is the binding's protocol record.

### 5.2 Binding requirements

A conforming GitHub binding must:

- preserve original event content and GitHub timestamps;
- preserve actor identity as observed by GitHub;
- expose stable comment IDs for causal references;
- link every SHA-bound claim to the full SHA;
- avoid treating mutable labels as authoritative history;
- distinguish platform failure from protocol state;
- record when evidence could not be fetched or verified.

## 6. Implementations

Implementations are replaceable tools built against Core and a selected profile/binding.

### 6.1 Normative implementation artifacts

The first normative artifacts should be:

1. `envelope.schema.json` — validates ACP event envelopes.
2. `profile.schema.json` — validates profile configuration.
3. A conformance test suite with valid and invalid fixtures.
4. A deterministic projection algorithm specification.

### 6.2 Human-facing implementation artifacts

After the schemas exist:

- GitHub Issue templates;
- PR templates;
- cold-start instructions;
- role-specific handoff templates;
- manual reconciliation checklist;
- program checkpoint template.

These should be generated from or checked against the schemas where practical.

### 6.3 Automation artifacts

Automation is a later implementation layer:

- envelope validation;
- stale-basis detection;
- lease expiry detection;
- projection refresh;
- gate evaluation;
- conflict warnings;
- dashboard updates.

Automation must not silently merge, deploy, migrate, authorize, or reinterpret ambiguous events.

## 7. Normative versus informative material

ACP documents must label content clearly:

- **Normative:** required for conformance.
- **Profile-normative:** required only under a named profile.
- **Binding-normative:** required only for a named platform binding.
- **Informative:** examples, rationale, guidance, and implementation notes.

This prevents Reformando-specific decisions from accidentally becoming universal protocol rules.

## 8. Versioning

ACP needs independent version axes:

- Core protocol version;
- profile version;
- binding version;
- implementation/schema version;
- program configuration revision.

Example:

```yaml
core: 1.0.0-draft
profile: reformando-acp1@0.1.0
binding: github@0.1.0
schema: envelope@0.1.0
program_revision: 3
```

A profile may tighten Core requirements but must not contradict Core semantics. A binding update must not change event meaning. A schema update must declare backward compatibility.

## 9. Identity and trust model

Identity is external to the protocol but fundamental to its guarantees.

Trust levels:

1. **Self-declared actor:** weakest; suitable only for experiments.
2. **Shared GitHub account:** authenticated but does not separate agents.
3. **Distinct GitHub identities:** supports separation of powers.
4. **Signed machine identity or GitHub App:** stronger automation identity.
5. **Hardware-backed or organization-managed credentials:** strongest operational model.

For the first pilot, ACP must explicitly report the active trust level. It must not claim independent approval when multiple agents share one authenticated identity unless a human accepts that limitation.

## 10. State and projections

Core state should remain composite:

```yaml
phase: IN_REVIEW
freshness: FRESH
modifiers:
  - at-risk:RSK-014
  - needs:validation
```

A simplified linear status may be derived for UI:

```text
waiting-review
```

The linear status is a projection, not protocol truth. This preserves accuracy while keeping GitHub readable for humans.

## 11. Conflict model

Conflicts should be detected before merge where possible.

Core inputs:

- overlapping `touches`;
- causal forks sharing the same `after`;
- competing live leases;
- branch dependency cycles;
- incompatible authorizations;
- contradictory reviews on the same basis;
- mutable dependencies outside the declared basis.

Profiles decide which conflicts block progress and which only create warnings.

## 12. Recovery model

Cold recovery follows a bounded read path:

1. protocol entry point;
2. active profile and program config;
3. role queue;
4. work-item projection;
5. latest valid checkpoint;
6. subsequent events;
7. current branch heads and evidence freshness.

If the budget is exceeded, the recovering agent must checkpoint or request reconciliation before continuing. Recovery must never silently discard contradictions.

## 13. Governance

Protocol governance must distinguish:

- Core maintainers;
- profile owners;
- binding maintainers;
- program administrators;
- Product Owner authorization.

Changing a profile or program configuration is itself a governed work item. Changes that alter gate semantics, permissions, TTLs, or identity requirements may invalidate active work and must declare a migration policy.

## 14. Repository layout recommendation

A future canonical layout could be:

```text
acp/
  core/
    ACP-1.md
    envelope.schema.json
    profile.schema.json
    fixtures/
  profiles/
    reformando.yml
    reformando.md
  bindings/
    github.md
  implementations/
    github/
      issue-template.yml
      pr-template.md
      handoff-template.md
  AGENTS.md
```

The current three-file Claude branch is an acceptable draft layout. Reorganization should wait until the semantic review is complete to avoid churn.

## 15. Adoption path

1. Adopt ACP-1 as the semantic candidate, not yet active.
2. Complete adversarial and implementability reviews.
3. Resolve findings in a new exact SHA.
4. Define the envelope schema and fixtures.
5. Define the Reformando profile and GitHub binding explicitly.
6. Generate or adapt human templates.
7. Add a discovery link from repository cold-start instructions.
8. Run two manual pilots.
9. Measure coordination overhead, copy/paste reduction, stale-work detection, and recovery quality.
10. Activate only the profile and artifacts that passed the pilots.
11. Automate validation and projections incrementally.

## 16. Pilot success criteria

The pilot succeeds only if it demonstrates measurable improvement:

- Jorge no needs to relay routine agent messages;
- a fresh session resumes using GitHub alone;
- a changed SHA invalidates stale review correctly;
- overlapping work is detected before merge;
- no agent performs unauthorized remote action;
- checkpoints keep recovery within the context budget;
- Issue state can be reconstructed from the event log;
- the protocol overhead remains lower than the work it coordinates.

## 17. Decisions deferred

The architecture intentionally defers:

- final agent GitHub identities;
- normative language;
- final repository layout;
- exact envelope schema;
- label taxonomy;
- Project configuration;
- automation technology;
- public standardization and licensing;
- federation across repositories.

## 18. Immediate next deliverables

After architecture review, the next deliverables are:

1. adversarial review of ACP-1 plus this architecture;
2. implementability review of the GitHub binding;
3. revised ACP-1 candidate;
4. executable envelope JSON Schema;
5. valid/invalid fixture corpus;
6. Reformando profile;
7. manual templates;
8. two pilot work items.
