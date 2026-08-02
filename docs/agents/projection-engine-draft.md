# ACP Projection Engine — Draft 0.1

Status: non-normative implementation design. ACP is not active. This document does not authorize automation, merges, deployments, migrations, remote writes, or mutation of GitHub state.

## 1. Purpose

The Projection Engine derives current operational views from the ACP event log without replacing or rewriting that log.

It exists because ACP state is distributed across immutable or logically append-only events, while humans and agents need compact working views such as:

- current phase;
- freshness;
- active lease;
- current basis;
- open risks;
- pending gates;
- next action;
- latest valid checkpoint;
- stale reviews and validations;
- unresolved conflicts.

The event log is authoritative. Every projection is a cache that can be recomputed.

## 2. Architectural position

```text
ACP Core
  ↓
Profile
  ↓
Binding
  ↓
Projection Engine
  ↓
Issue body / labels / Projects / dashboards / queues
```

Responsibilities:

- **Core:** event meaning and invariants.
- **Profile:** program policy.
- **Binding:** observed platform records and evidence adapters.
- **Projection Engine:** deterministic derived state.
- **UI projection:** human-readable materialization.

The Projection Engine must not invent protocol semantics or platform facts.

## 3. Inputs

A projection run consumes an immutable snapshot of:

1. ACP authored envelopes;
2. binding records for each envelope;
3. active profile and its exact revision;
4. semantic-validation results;
5. evidence-verification results;
6. protocol-version compatibility results;
7. optional prior checkpoint;
8. projection engine version.

Every input must be identified by digest, stable ID, or exact revision where possible.

## 4. Outputs

A projection produces:

```yaml
projection:
  item: example-item
  profile_revision: 7
  protocol: "1.1"
  engine_version: "0.1.0-draft"
  source_head: github-comment:2480173312
  source_digest: sha256:...
  computed_at: 2026-08-02T18:00:00Z
  phase: review
  freshness: stale
  modifiers:
    - blocked
    - needs:validation
  active_claim: null
  basis:
    sha: 0123456789abcdef0123456789abcdef01234567
  gates: {}
  risks: []
  violations: []
  next_action: {}
  diagnostics: []
```

The projection timestamp is observed implementation metadata, not an ACP-authored fact.

## 5. Determinism

Given identical:

- event records;
- profile revision;
- external verification results;
- engine version;

an implementation must produce an equivalent projection.

Sources of non-determinism are forbidden in the reducer:

- current wall-clock time without an explicit evaluation timestamp;
- network reads during reduction;
- mutable branch lookups;
- unordered map iteration;
- locale-dependent sorting;
- LLM interpretation;
- implicit defaults not declared in the profile.

The caller supplies a single evaluation time when expiry must be evaluated.

## 6. Processing pipeline

### Stage 0 — Acquire

Read binding records without mutating the source platform.

Output:

- ordered raw records;
- retrieval diagnostics;
- missing/inaccessible ranges.

### Stage 1 — Parse

Extract marked ACP envelopes.

Classify each record:

- ordinary discussion;
- valid ACP candidate;
- malformed ACP candidate;
- unsupported protocol version.

Malformed marked comments remain evidence and produce violations; they do not update operational state.

### Stage 2 — Schema validation

Validate envelope syntax against the correct writer schema.

Output:

- schema-valid event;
- schema-invalid event with exact errors.

### Stage 3 — Binding enrichment

Attach observed metadata:

- event pointer;
- observed actor;
- platform timestamp;
- repository/item location;
- content digest;
- edit metadata;
- deletion/inaccessibility state.

Authored and observed identity remain separate.

### Stage 4 — Semantic validation

Evaluate external requirements, including:

- actor mapping and assurance;
- causal pointer existence;
- subject consistency;
- lease rules;
- basis existence and freshness;
- diff/touches alignment;
- review independence;
- authorization freshness;
- evidence existence and digest;
- profile referential integrity.

Semantic-invalid events remain in the audit set but do not necessarily update operational state. The profile defines the effect of each violation class.

### Stage 5 — Causal graph

Build a directed graph from roots and `after` pointers.

Detect:

- multiple roots;
- missing predecessors;
- cross-item references;
- causal forks;
- cycles;
- unreachable events;
- superseded branches;
- reconcile decisions.

A simple timestamp sort is not sufficient.

### Stage 6 — Reconciliation selection

Determine the accepted causal history.

Rules come from ACP and profile policy. A reconcile event may select or supersede branches but cannot erase them.

If no unique accepted history exists, the projection becomes `conflicted` and sensitive gates fail closed.

### Stage 7 — Reduction

Apply accepted events in deterministic causal order to a typed state machine.

### Stage 8 — Gate evaluation

Evaluate gates using only fresh, valid evidence bound to the applicable basis.

### Stage 9 — Projection rendering

Produce canonical machine projection and optional platform-specific human views.

## 7. Event reducer model

Each event type maps to a pure transition:

```text
reduce(previous_state, validated_event, evaluation_context) → new_state + diagnostics
```

The reducer must not fetch remote state.

Example transition families:

- lifecycle: `spec`, `claim`, `progress`, `submit`, `close`, `supersede`;
- assurance: `review`, `validate`, `revalidate`, `violation`;
- authority: `question`, `answer`, `assume`, `authorize`, `revoke`, `approve`, `decide`;
- coordination: `risk`, `debt`, `block`, `unblock`, `handoff`, `checkpoint`, `reconcile`, `release`, `heartbeat`, `triage`.

ACP-1.1 remains the source of transition meaning.

## 8. Composite state

Projection state should remain composite.

### 8.1 Phase

Candidate phases:

- unspecified;
- specified;
- claimed;
- implementing;
- submitted;
- reviewing;
- validating;
- awaiting-authorization;
- ready;
- closed;
- superseded;
- conflicted.

This list is implementation-facing until reconciled with the normative profile.

### 8.2 Freshness

- fresh;
- stale;
- invalid;
- unknown.

Freshness may differ by evidence class. A compact projection may expose overall freshness plus per-gate details.

### 8.3 Modifiers

Examples:

- blocked;
- at-risk;
- lease-expired;
- causal-fork;
- identity-unverified;
- evidence-unavailable;
- needs-human;
- profile-invalid;
- projection-stale.

Modifiers are derived diagnostics, not replacements for events.

## 9. Claim and lease projection

The engine computes:

- active claim;
- claimant;
- declared touches;
- claim pointer;
- lease start based on observed timestamp;
- last valid heartbeat;
- calculated expiry;
- release/preemption state;
- conflicts with other claims.

A lease is active only if:

- claim is semantically valid;
- no valid release applies;
- no accepted preemption supersedes it;
- evaluation time is before expiry;
- the claim belongs to the accepted causal history.

If clock trust is insufficient, status is `unknown`, not active by assumption.

## 10. Basis and freshness projection

The engine maintains a basis ledger for:

- submit;
- review;
- validate;
- revalidate;
- authorize;
- approve;
- merge/deploy evidence when represented.

For each evidence item:

- exact SHA;
- ref at observation time;
- scope;
- dependencies;
- environment;
- verification status;
- superseding basis;
- freshness reason.

A new delivery SHA does not delete old evidence; it marks relevant old evidence stale.

## 11. Gate evaluation

Gate output must explain itself.

```yaml
gates:
  merge:
    status: blocked
    basis_sha: 0123...
    requirements:
      independent_review:
        status: stale
        evidence: github-comment:123
      validation:
        status: pass
        evidence: github-check-run:456
      authorization:
        status: missing
    blockers:
      - stale-review
      - missing-authorization
```

Allowed statuses:

- pass;
- fail;
- blocked;
- stale;
- missing;
- unknown;
- not-applicable.

A gate never passes because a label says it passes.

## 12. Risk, debt, and blocking projection

Maintain separate ledgers:

- **risk:** uncertain future harm;
- **debt:** accepted present compromise;
- **block:** current inability to proceed.

Each ledger entry tracks:

- event pointer;
- owner;
- severity;
- status;
- expiry/review date where applicable;
- linked decisions;
- resolution event.

Resolving a block does not automatically resolve associated risk or debt.

## 13. Questions and silence

Projection calculates:

- open questions;
- options;
- expiry based on observed timestamp;
- permitted default;
- whether a valid answer exists;
- whether an assume event validly applies the default.

Sensitive defaults remain forbidden by profile policy.

The engine must not manufacture an `assume` event when time expires. Expiry changes the question's eligibility state; a valid event is still needed if ACP-1.1 requires one.

## 14. Authorization ledger

For each authorization:

- authored actor;
- observed identity assurance;
- action;
- target;
- scope;
- basis;
- limits;
- issue time;
- expiry;
- revocation;
- consumption, if authorization is single-use;
- current status.

Statuses:

- active;
- expired;
- revoked;
- stale-basis;
- identity-invalid;
- exceeded;
- consumed;
- unknown.

## 15. Review and validation projection

A review ledger records:

- reviewer;
- independence status;
- basis;
- scope;
- verdict;
- adversarial declaration;
- uncertainty fields;
- freshness;
- revalidation chain.

A validation ledger records:

- validator;
- procedure;
- environment;
- basis;
- result;
- evidence;
- reproducibility;
- freshness.

Review and validation remain separate even if both are attached to one GitHub check or comment.

## 16. Checkpoint handling

A checkpoint accelerates recovery but cannot replace full reconciliation.

A projector may start from a checkpoint only when:

- checkpoint envelope is valid;
- coverage pointers exist;
- checkpoint belongs to accepted history;
- stored source digest matches covered records;
- protocol/profile/engine compatibility is satisfied;
- no relevant earlier unresolved fork is omitted.

Otherwise it replays from the last trusted point or from the beginning.

## 17. Projection integrity

Canonical projection should include:

- source event count;
- accepted event count;
- rejected event count;
- source-head pointer;
- source digest;
- profile revision;
- engine version;
- evaluation timestamp;
- diagnostic count;
- unresolved conflicts.

This allows consumers to detect stale materializations.

## 18. Materialization targets

### 18.1 Issue body

Human summary with:

- current objective;
- state;
- basis;
- lease;
- blockers;
- gates;
- next action;
- checkpoint link;
- projection digest/version.

### 18.2 Labels

Low-cardinality discovery fields only.

Do not encode detailed evidence in labels.

### 18.3 GitHub Projects

Useful for:

- phase;
- freshness;
- owner;
- risk level;
- next review/expiry;
- gate summary.

Project values remain derived.

### 18.4 Dashboards

Program-level projections may aggregate:

- active leases;
- blocked work;
- expiring questions;
- stale reviews;
- profile violations;
- agent load;
- dependency graph.

Aggregation must link back to item-level evidence.

## 19. Projection updates

Manual pilot:

- an authorized coordinator recomputes conceptually and edits derived views;
- each manual update cites source-head pointer and checkpoint;
- discrepancies are treated as projection drift.

Automated future:

- event-triggered or scheduled recomputation;
- optimistic concurrency on Issue body updates;
- no automatic mutation when causal state is conflicted;
- no automatic sensitive action.

## 20. Failure behavior

Fail closed for sensitive gates when:

- source retrieval incomplete;
- profile invalid;
- unsupported protocol version;
- causal conflict unresolved;
- identity assurance insufficient;
- evidence unavailable;
- projection digest mismatch;
- evaluation clock untrusted.

Non-sensitive views may render partial state with prominent diagnostics.

Never silently discard an invalid event.

## 21. Projection conformance layers

- **P0:** deterministic parsing and ordering inputs.
- **P1:** schema-valid event classification.
- **P2:** semantic validation attachment.
- **P3:** causal graph and accepted history.
- **P4:** state reduction.
- **P5:** gate evaluation.
- **P6:** platform materialization.
- **P7:** drift detection and recovery.

Each layer should have independent fixtures in a future conformance suite.

## 22. Test model

Future tests should include:

- linear history;
- valid root plus chain;
- duplicate root;
- missing predecessor;
- fork and reconcile;
- stale review after new submit;
- revalidate outside scope;
- expired lease;
- competing claims;
- identity mismatch;
- revoked authorization;
- expired artifact;
- checkpoint with omitted fork;
- edited comment;
- projection drift;
- unsupported minor version;
- incomplete retrieval.

Golden projection fixtures should include exact expected state and diagnostics.

## 23. Security considerations

The Projection Engine processes untrusted authored text and platform data.

Requirements:

- bounded input sizes;
- safe YAML/JSON parsing;
- no code execution from extensions;
- URI and evidence fetch allowlists;
- secret redaction;
- no trust in Markdown rendering;
- no shell interpolation;
- protection against causal graph resource exhaustion;
- profile limits on events and dependencies;
- deterministic extension handling.

## 24. Open decisions

- canonical state vocabulary and transition table;
- exact projection JSON Schema;
- checkpoint digest algorithm;
- profile-revision migration;
- whether program events use Issues, Discussions, or another log;
- cross-repository graph storage;
- comment edit archival strategy;
- how manual reconciliation is represented before automation;
- evaluation-clock authority;
- maximum replay budget before checkpointing;
- whether materialization errors create ACP violation events automatically.

## 25. Acceptance criteria

The Projection Engine design is ready for formalization when:

- every ACP-1.1 event has a deterministic transition or explicit no-state effect;
- external requirements have validator outputs consumable by the reducer;
- causal forks never resolve by timestamp alone;
- stale evidence never satisfies gates;
- projections can be recomputed from source records;
- checkpoints are verifiable accelerators, not alternate truth;
- partial and conflicted states are represented honestly;
- materializations include source revision/digest;
- the manual pilot can maintain projections without pretending they are authoritative.
