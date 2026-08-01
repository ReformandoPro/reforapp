# ACP envelope schema review matrix

Status: preparatory review artifact. This document does not define ACP semantics, activate ACP, or authorize automation.

## Purpose

This matrix is used to review `acp/schema/envelope.schema.json`, `acp/schema/profile.schema.json`, and their fixture corpus once the implementation branch is published.

The review must distinguish:

- Core protocol semantics;
- profile policy;
- platform binding concerns;
- implementation constraints;
- syntax that JSON Schema can validate;
- semantics that require an external validator or event-log reconciliation.

## Decision classes

Each item receives one result:

- **PASS** — requirement is correctly represented and evidenced.
- **FAIL** — schema or fixture contradicts the protocol or permits a known-invalid instance.
- **PARTIAL** — syntactic representation exists but leaves a material ambiguity.
- **NOT SCHEMA-VALIDABLE** — correctly documented as requiring external validation.
- **OUT OF SCOPE** — belongs to a profile, binding, or later implementation.

Any FAIL in identity, basis, authorization, review independence assumptions, or fixture discrimination blocks acceptance.

## 1. Artifact identity

- [ ] Branch and exact SHA recorded.
- [ ] Diff limited to `acp/schema/**`.
- [ ] JSON Schema draft is 2020-12.
- [ ] Schema IDs are stable and non-repository-specific.
- [ ] No Reformando handles, repository names, workflow names, project refs, labels, or protected paths appear in Core definitions.
- [ ] No executable scripts, Actions, bots, webhooks, or GitHub Apps were added.
- [ ] `git diff --check` is clean.

## 2. Layer separation

### Core

- [ ] Event meanings are platform-neutral.
- [ ] `actor`, `basis`, `after`, `touches`, evidence, uncertainty, leases, state, and gates are represented without GitHub assumptions.
- [ ] Core work-item IDs do not hardcode `RF-`.
- [ ] Core actor IDs do not hardcode named agents.

### Profiles

- [ ] Profile schema owns program-specific ID prefixes, roles, capabilities, permissions, TTLs, gates, and silence policy.
- [ ] Platform permissions are distinct from protocol capabilities.
- [ ] Profile extensions are explicit and namespaced.

### Bindings

- [ ] GitHub-specific concepts are absent from the universal envelope schema unless represented as generic evidence references.
- [ ] Mutable labels, PR state, and Project fields are not treated as Core truth.

## 3. Common envelope contract

- [ ] A version field exists and has a documented compatibility rule.
- [ ] Every event has a type discriminator.
- [ ] Every event identifies one work item.
- [ ] Actor identity has a strict shape.
- [ ] Causal references are stable identifiers, not free text.
- [ ] Unknown top-level fields are rejected or accepted only through a documented extension mechanism.
- [ ] Optional arrays use `uniqueItems` where duplicates are semantically invalid.
- [ ] Empty arrays are rejected where at least one value is required.
- [ ] Date/time and duration models are deterministic and documented.

## 4. Basis and freshness

- [ ] `basis` requires a full lowercase 40-character SHA when the event can approve, validate, authorize, submit, or revalidate code.
- [ ] Basis supports an explicit scope.
- [ ] Basis may declare dependencies and environment without making either mandatory for all event types.
- [ ] Review without basis is invalid.
- [ ] Authorization without basis is invalid.
- [ ] Revalidation distinguishes old basis and new basis.
- [ ] Schema documentation states that SHA existence and freshness require external validation.
- [ ] Schema does not pretend that a regex proves the reviewed diff is in scope.

## 5. Causality

- [ ] `after` has a strict causal-pointer type.
- [ ] Events that may be roots can omit `after` only when ACP permits it.
- [ ] The schema documents that Lamport ordering, latest-read checks, forks, and cycles are external semantic checks.
- [ ] Fixtures include a structurally valid event whose causal reference would still be semantically stale, demonstrating the boundary.

## 6. Write surfaces

- [ ] `touches` is non-empty where required.
- [ ] Duplicate touch patterns are rejected.
- [ ] Wildcard-only scope is rejected or requires an explicit justification field.
- [ ] Patterns are generic and not tied to Git path syntax unless ACP Core explicitly chooses that syntax.
- [ ] The schema documents that actual diff overlap and hidden writes require external validation.

## 7. Uncertainty declarations

- [ ] `unverified` has a precise type and cannot be silently omitted where required.
- [ ] `falsified` has a precise type.
- [ ] `would_change_my_mind` has a precise type.
- [ ] The schema distinguishes an empty declaration from an absent declaration.
- [ ] Review changes/reject requires `would_change_my_mind`.
- [ ] Adversarial review requires `falsified`.
- [ ] Submit requires `unverified`.
- [ ] Documentation acknowledges that truthful epistemic quality cannot be schema-validated.

## 8. Event-by-event review

For every supported event type:

- [ ] Required fields are justified by ACP-1.
- [ ] Forbidden fields are rejected.
- [ ] Shared structures use `$defs` instead of duplication.
- [ ] Event-specific conditionals are understandable and testable.
- [ ] A minimal valid fixture exists.
- [ ] At least one invalid discriminant fixture exists where the event has special rules.

Review at minimum:

- [ ] spec
- [ ] claim
- [ ] heartbeat
- [ ] progress
- [ ] submit
- [ ] review
- [ ] validate
- [ ] question
- [ ] assume
- [ ] authorize
- [ ] revoke
- [ ] block
- [ ] unblock
- [ ] violation
- [ ] risk
- [ ] decision
- [ ] handoff
- [ ] checkpoint
- [ ] reconcile
- [ ] release
- [ ] close
- [ ] supersede
- [ ] revalidate

Any mismatch with the canonical ACP-1 event catalogue must be explicitly documented.

## 9. Sensitive event gates

### Question

- [ ] Requires options, expiry, and `default_if_silent`.
- [ ] A default cannot syntactically authorize deploy, remote write, destructive action, migration, or credential change.
- [ ] Documentation states that sensitivity classification may require a profile-aware semantic validator.

### Authorization

- [ ] Requires actor, target, action/scope, basis, limits, and expiry.
- [ ] `default_if_silent` is forbidden.
- [ ] Authorization cannot omit the concrete action.
- [ ] Authorization cannot be open-ended without a bounded scope.
- [ ] Schema documentation states that actor authority and revocation freshness are externally validated.

### Revoke

- [ ] Requires exact reference to the revoked authorization/event.
- [ ] Cannot masquerade as a new authorization.
- [ ] Irreversibility is documented as semantic, not schema-enforced.

## 10. Lease model

- [ ] Claim requires lease, touches, and intent.
- [ ] Lease duration format is bounded.
- [ ] Heartbeat references a live claim/lease structurally.
- [ ] Release identifies the lease or claim released.
- [ ] Preemption requires an explicit prior claim reference and stated reason.
- [ ] Schema documentation states that expiry, ownership, races, and split-brain claims require external reconciliation.

## 11. Checkpoint and recovery

- [ ] Checkpoint requires `covers`, state, resume, open items, and gates.
- [ ] Resume has done, remaining, traps, and next action where ACP-1 requires them.
- [ ] A checkpoint cannot claim to replace the event log.
- [ ] Coverage ranges have a strict structural representation.
- [ ] Schema documentation states that omission, contradiction, and context-budget compliance require semantic review.

## 12. Handoff

- [ ] Requires a resumable payload.
- [ ] Includes completed work, remaining work, traps/risks, and next action.
- [ ] Lease release is explicit rather than inferred.
- [ ] Handoff does not imply approval, validation, or authorization.
- [ ] Fixtures test missing next action and ambiguous lease release.

## 13. Revalidation

- [ ] Requires old basis, new basis, and scope difference.
- [ ] Distinguishes full re-review from scoped revalidation.
- [ ] Cannot validate its own claim that a diff is outside reviewed scope.
- [ ] Fixtures cover missing old basis, missing new basis, and empty scope difference.

## 14. Profile schema

- [ ] Validates protocol/spec versions.
- [ ] Validates program and repository declarations generically.
- [ ] Validates work-item ID policy separately from Core ID syntax.
- [ ] Validates agents and roles without duplicate IDs.
- [ ] Validates capabilities separately from platform permissions.
- [ ] Supports default-deny permissions.
- [ ] Supports actions classified as allowed, authorization-required, or forbidden.
- [ ] Validates gates, leases, TTLs, invalidation, review, silence, write surfaces, limits, reconciliation, and automation declarations.
- [ ] Automation enabled requires an implementation declaration.
- [ ] Contradictory permission declarations are rejected where schema-expressible.
- [ ] Reformando fixture is profile data, not embedded Core behavior.

## 15. `additionalProperties` and extensibility

- [ ] Core objects are strict enough to catch typos.
- [ ] Extensibility uses a documented namespaced mechanism such as `x-*`.
- [ ] Extensions cannot override normative fields.
- [ ] Future event types have a declared compatibility policy.
- [ ] Schema does not become impossible to evolve because every nested object is closed without extension points.

## 16. Fixture corpus quality

### Valid corpus

- [ ] Every event type has at least one valid fixture.
- [ ] Boundary-valid cases exist for optional fields, minimum lease durations, and extension fields.
- [ ] A valid Reformando profile fixture exists.
- [ ] Fixtures are minimal enough to identify why they pass.

### Invalid corpus

- [ ] Every documented conditional has a failing fixture.
- [ ] Unknown event type fails.
- [ ] Unknown property fails where expected.
- [ ] Short SHA fails.
- [ ] Uppercase SHA fails if lowercase is normative.
- [ ] Missing basis, expiry, limits, touches, uncertainty, resume, and next action fail in their relevant events.
- [ ] Duplicate touches fail.
- [ ] Sensitive silent default fails.
- [ ] Each invalid fixture records the intended violated rule.
- [ ] Invalid fixtures do not accidentally fail earlier for an unrelated reason.

## 17. False-positive review

Test whether the schema incorrectly accepts:

- [ ] review of a moving branch without SHA;
- [ ] authorization with no expiry;
- [ ] question whose silent default performs an irreversible action;
- [ ] wildcard-only touches with no justification;
- [ ] self-approval encoded as reviewer and implementer when profile independence is required;
- [ ] handoff with no next action;
- [ ] checkpoint with no recovery path;
- [ ] revalidation with only a new SHA and no scope diff;
- [ ] profile that enables automation but declares no implementation;
- [ ] unknown fields caused by an LLM typo.

## 18. False-negative review

Test whether the schema incorrectly rejects:

- [ ] non-Git code evidence represented through a generic reference;
- [ ] a root spec event with no predecessor when allowed;
- [ ] a review with explicit zero unverified items;
- [ ] a no-change validation result;
- [ ] a checkpoint covering a bounded event range;
- [ ] a profile using namespaced extension fields;
- [ ] a program with roles other than Reformando's five named agents;
- [ ] evidence in a platform other than GitHub.

## 19. LLM usability

- [ ] Minimal events are short enough for an agent to produce reliably.
- [ ] Field names are unambiguous.
- [ ] Null, omitted, empty array, and empty object semantics are documented.
- [ ] Conditional errors can be explained to an agent.
- [ ] The schema avoids 30-field envelopes for simple events.
- [ ] Reusable `$defs` do not force irrelevant fields into all events.
- [ ] Examples do not encourage fabricated timestamps or IDs that the platform should supply.

## 20. Validation evidence

- [ ] Schema metaschema validation passes.
- [ ] Every `$ref` resolves.
- [ ] Every valid fixture passes.
- [ ] Every invalid fixture fails.
- [ ] Each invalid fixture fails for the intended constraint.
- [ ] Results are reproducible with a named validator/version.
- [ ] No temporary validation scripts are committed.
- [ ] Hashes, file counts, and validation totals are reported.

## 21. Semantic invariants explicitly outside JSON Schema

The README must explicitly classify these as external checks:

- [ ] observed actor identity and authentication strength;
- [ ] actor capability and permission at event time;
- [ ] event-log append-only integrity;
- [ ] causal predecessor correctness;
- [ ] lease freshness, races, and preemption eligibility;
- [ ] SHA/ref existence;
- [ ] basis freshness after repository changes;
- [ ] actual diff overlap with `touches`;
- [ ] review independence;
- [ ] artifact existence and hash correctness;
- [ ] authorization freshness and revocation;
- [ ] checkpoint completeness and truthfulness;
- [ ] contradictory events;
- [ ] gate satisfaction across multiple events;
- [ ] human silence timing and clock trust;
- [ ] branch-stack cycles and large conflict graphs;
- [ ] honesty of uncertainty declarations.

## 22. Acceptance verdicts

Use exactly one:

### `ACP ENVELOPE SCHEMA APPROVED FOR ADVERSARIAL REVIEW`

All blocking syntactic and architectural requirements pass. Remaining gaps are honestly classified as semantic external validation.

### `CHANGES REQUIRED — SCHEMA CONTRACT IS UNSOUND`

The schema permits a blocking invalid event, rejects a necessary valid event, mixes architectural layers, or overclaims semantic guarantees.

### `SCHEMA STRUCTURALLY VALID — FIXTURE CORPUS INSUFFICIENT`

The schema appears coherent, but the corpus cannot prove its discriminating behavior.
