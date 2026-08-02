# ACP Conformance Test Suite — Draft 0.1

Status: non-normative test architecture. ACP is not active. This document does not add automation, test harnesses, workflows, or enforcement.

## 1. Purpose

Define the layers, responsibilities, fixtures, and verdicts required to prove that an ACP implementation is conforming.

Conformance is not a single JSON Schema pass. ACP spans syntax, profile policy, event-log semantics, platform binding, projection, and gate evaluation.

## 2. Conformance layers

```text
L0  Serialization and document integrity
L1  Envelope/Profile JSON Schema
L2  Profile-aware validation
L3  Event-log and causal semantics
L4  Binding and evidence verification
L5  Projection determinism and integrity
L6  Gate and authorization evaluation
L7  Operational resilience and recovery
```

An implementation may claim conformance only for the layers it actually passes.

## 3. L0 — Serialization and integrity

Purpose:

- prove inputs can be parsed safely and deterministically.

Checks:

- valid JSON/YAML as applicable;
- duplicate-key detection;
- bounded document size;
- valid Unicode;
- deterministic canonicalization;
- no executable extensions;
- content digest reproducibility;
- supported protocol version declaration.

Outputs:

- parsed document;
- canonical digest;
- parse diagnostics.

Failure class:

- malformed input;
- ambiguous input;
- unsupported representation.

## 4. L1 — JSON Schema conformance

Purpose:

- validate authored envelopes and profiles against Draft 2020-12 schemas.

Checks:

- metaschema validity;
- all `$ref` resolved;
- strict mode;
- format assertions when required by ACP conformance;
- valid fixtures accepted;
- invalid fixtures rejected for intended keyword/schema path;
- catalogue parity;
- extension grammar;
- version compatibility.

Does not prove:

- actor authenticity;
- causal correctness;
- lease freshness;
- SHA existence;
- evidence existence;
- profile referential integrity.

## 5. L2 — Profile-aware validation

Purpose:

- combine a schema-valid event with a concrete profile.

Checks:

- actor exists in profile;
- role exists;
- actor has event capability;
- work-item ID matches profile pattern;
- reserved IDs rejected;
- action permission mode;
- required adversarial declaration;
- allowed root types under profile;
- TTL and duration limits;
- `never_default_actions`;
- gate references exist;
- reviewers/owners/veto identities exist;
- automation implementation owner exists;
- profile graph references are valid;
- identity assurance meets policy.

Outputs:

- profile-valid event;
- policy violations;
- required authorization class;
- profile revision used.

## 6. L3 — Event-log semantics

Purpose:

- validate history, causality, leases, supersession, and reconciliation.

Checks:

- exactly one accepted root per thread unless reconciled;
- `after` pointer exists and belongs to the subject;
- no causal cycles;
- forks detected;
- event order derived from graph, not timestamps alone;
- claim ownership and expiry;
- heartbeat references live claim;
- release references owned claim;
- preemption eligibility;
- supersede target exists;
- revoke target exists and is revocable;
- question option IDs unique;
- default refers to real option;
- `assume` references expired question;
- reconcile resolves explicit conflict without erasing history;
- checkpoint coverage valid;
- unsupported history transitions rejected.

Outputs:

- accepted causal history;
- rejected/flagged events;
- unresolved forks;
- active claims;
- semantic diagnostics.

## 7. L4 — Binding and evidence verification

Purpose:

- prove that platform-observed facts support authored claims.

Checks:

- observed actor mapped to declared actor;
- identity assurance recorded;
- event pointer exists and is immutable enough for the binding;
- comment edit/delete detected;
- repository and work-item mapping valid;
- SHA exists;
- ref and head relationships verified;
- PR/change request exists;
- check run/workflow/job exists;
- artifact exists or is explicitly unavailable;
- artifact digest and size match;
- evidence belongs to correct repository and SHA;
- timestamps come from trusted platform metadata;
- authorization issuer observed identity is permitted;
- GitHub mutable UI state is not treated as protocol truth.

Outputs:

- verified binding record;
- evidence verification status;
- identity mismatch violations;
- retrievability diagnostics.

## 8. L5 — Projection conformance

Purpose:

- prove deterministic reduction from accepted history to current operational state.

Checks:

- identical inputs produce equivalent projection;
- source digest recorded;
- profile and engine versions recorded;
- stale review after new SHA;
- revalidation scope handling;
- active lease calculation;
- risk/debt/block ledgers separated;
- authorization ledger statuses;
- checkpoint acceleration preserves result;
- projection from full replay equals trusted-checkpoint replay;
- projection drift detected;
- partial retrieval produces partial/unknown, not false certainty;
- causal conflict blocks sensitive state.

Outputs:

- canonical projection;
- gate inputs;
- diagnostics;
- source-head pointer and digest.

## 9. L6 — Gate and authorization evaluation

Purpose:

- prove that sensitive decisions use fresh, valid, authorized evidence.

Checks:

- gate requirements reference existing profile gates;
- independent review requirement satisfied;
- self-review forbidden when configured;
- validation bound to exact basis;
- stale evidence excluded;
- authorization action, target, scope, limits, basis, and expiry match;
- revoked/expired/consumed authorization excluded;
- default-by-silence never authorizes sensitive action;
- conflicting or unknown projection fails closed;
- gate output explains every pass/fail/blocker.

Outputs:

- gate status;
- evidence ledger;
- blockers;
- authorization decision.

## 10. L7 — Operational resilience and recovery

Purpose:

- test the implementation under failures and session loss.

Checks:

- cold-start recovery from repository and Issue alone;
- bounded read budget;
- missing artifact;
- deleted/edited comment;
- GitHub partial outage;
- stale cache;
- duplicate delivery;
- concurrent claim race;
- process crash during projection;
- replay after engine upgrade;
- profile revision migration;
- unsupported protocol minor version;
- audit export completeness.

Outputs:

- recovered state;
- safe failure mode;
- reconciliation request;
- no unauthorized side effects.

## 11. Fixture families

### 11.1 Document fixtures

- valid envelope per event;
- invalid envelope per conditional;
- valid and invalid profiles;
- extension cases;
- version boundaries.

### 11.2 History fixtures

- linear history;
- duplicate root;
- missing predecessor;
- fork;
- fork + reconcile;
- causal cycle;
- supersede chain;
- revoke chain;
- question/answer/assume chain;
- claim/heartbeat/release chain;
- preemption race.

### 11.3 Binding fixtures

- distinct actor identity;
- shared-account identity;
- on-behalf-of;
- mismatched actor;
- stale SHA;
- missing PR;
- wrong-repository artifact;
- expired artifact;
- edited comment;
- deleted comment.

### 11.4 Projection golden fixtures

Each fixture contains:

- events;
- binding records;
- profile;
- evaluation time;
- expected accepted history;
- expected projection;
- expected diagnostics;
- expected gates.

## 12. Required negative tests

A conforming suite must include tests proving rejection or fail-closed behavior for:

- malformed marked event;
- unknown event type;
- missing actor;
- item/program conflict;
- invalid root;
- missing after;
- unverified profile actor;
- duplicate option IDs;
- invalid work-item ID under profile;
- reserved ID;
- expired lease;
- heartbeat after release;
- self-review;
- stale review;
- changed dependency;
- missing evidence;
- authorization on wrong SHA;
- authorization after revoke;
- sensitive silence default;
- unresolved causal fork;
- incomplete retrieval;
- projection digest mismatch.

## 13. Test case identity

Every conformance case should have a stable ID:

```text
ACP-L3-CAUSAL-004
ACP-L4-EVIDENCE-011
ACP-L6-AUTHZ-007
```

Case metadata:

- title;
- layer;
- normative requirement IDs;
- preconditions;
- inputs;
- expected result;
- failure class;
- applicable profile/binding;
- protocol/schema versions.

## 14. Verdicts

Per case:

- PASS;
- FAIL;
- NOT APPLICABLE;
- NOT IMPLEMENTED;
- INCONCLUSIVE.

Per layer:

- CONFORMING;
- NON-CONFORMING;
- PARTIAL;
- UNTESTED.

A product must not claim generic “ACP compliant” without naming:

- Core version;
- profile version;
- binding version;
- schema version;
- layers passed;
- test-suite version.

## 15. Reference implementation neutrality

The suite must not require GitHub for Core and Profile layers.

Binding-specific packs may extend the suite:

- `binding-github`;
- `binding-gitlab`;
- `binding-jira`;
- custom event store.

Shared Core fixtures must yield equivalent semantic results across bindings.

## 16. Reproducibility

A conformance report records:

- implementation name/version;
- commit SHA;
- protocol/profile/schema/binding versions;
- suite version;
- validator versions;
- platform/environment;
- case counts;
- failures;
- fixture digests;
- execution timestamp;
- report digest.

## 17. Security

The suite must treat fixtures as untrusted input.

Requirements:

- no fixture code execution;
- bounded graph size;
- bounded recursion and references;
- safe YAML/JSON parsing;
- no arbitrary network fetches;
- evidence adapters use allowlisted test endpoints or mocks;
- no production credentials;
- deterministic clocks;
- isolated temporary storage.

## 18. Manual pilot subset

Before automation, a manual conformance subset can verify:

- L0/L1 using local validators;
- selected L2 checks using a review checklist;
- L3 causal chain and lease examples by inspection;
- L4 GitHub identity/SHA/evidence manually;
- L5 projection against a hand-computed expected state;
- L6 merge authorization gate manually.

The manual subset must clearly state which checks remain unexecuted.

## 19. Adoption gates

### Specification gate

Requires:

- ACP-1.1 and Schema V3 reconciled;
- traceability complete;
- no Critical/High normative divergence.

### Binding design gate

Requires:

- platform limitations documented;
- observed/authored identity separated;
- append-only limitations acknowledged;
- exact SHA evidence model.

### Pilot gate

Requires:

- manual templates;
- two selected work items;
- explicit identity assurance;
- rollback/stop rules;
- no automated sensitive action.

### Automation gate

Requires:

- L0–L4 machine tests;
- projection golden fixtures;
- security review;
- dry-run mode;
- human authorization for mutations.

## 20. Open decisions

- canonical conformance suite serialization;
- fixture repository layout;
- reference semantic validator language;
- graph-size limits;
- standard error taxonomy;
- official versus profile-specific tests;
- certification authority, if any;
- compatibility policy across minor versions;
- whether test results should be signed;
- how to test LLM authoring reliability separately from protocol correctness.

## 21. Acceptance criteria for formalization

This draft is ready to become a formal suite specification when:

- ACP-1.1 ↔ Schema V3 reconciliation is closed;
- every external traceability requirement maps to L2–L6;
- GitHub Binding responsibilities map to L4;
- Projection Engine responsibilities map to L5;
- gate semantics map to L6;
- case ID and result formats are fixed;
- a minimal cross-binding fixture corpus is agreed.
