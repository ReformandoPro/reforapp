# ACP schema architecture

Status: preparatory design. This document does not activate ACP and does not replace the canonical ACP-1 specification.

## 1. Goal

Define the structure of the executable schema layer before implementation. The schema layer must remain portable, composable, and honest about what JSON Schema can and cannot prove.

## 2. Recommended repository layout

```text
acp/
  schema/
    envelope.schema.json
    profile.schema.json
    README.md
    fixtures/
      valid/
      invalid/
```

For the first implementation, keep a single `envelope.schema.json` rather than splitting every event into separate files. The schema may use extensive `$defs`, but one top-level envelope file reduces `$ref` resolution risk during the initial pilot.

A later version may split into:

```text
acp/schema/core/
acp/schema/events/
acp/schema/profiles/
```

only after the event catalogue stabilizes.

## 3. Envelope shape

Every ACP event should use one common outer envelope:

```json
{
  "v": "1.0",
  "type": "review",
  "item": "work-item-id",
  "actor": { "id": "actor-id", "role": "reviewer" },
  "after": "event-pointer",
  "payload": {}
}
```

Recommended design:

- common metadata at the top level;
- event-specific fields under `payload`;
- `type` as the discriminator;
- `oneOf` branches keyed by `type`;
- strict top-level `additionalProperties: false`;
- extension point only through namespaced `x-*` properties if needed.

This avoids a 30-field flat envelope where irrelevant fields appear on every event.

## 4. Common top-level fields

### Required for all events

- `v`
- `type`
- `item`
- `actor`

### Conditionally required

- `after` for non-root events;
- `basis` for evidence-bound events;
- `payload` for all event-specific data.

### Platform-supplied fields

The schema should not require agents to fabricate:

- timestamps;
- GitHub comment IDs;
- immutable event IDs;
- observed account identity;
- server receipt time.

Those belong to the binding record, not the authored envelope.

## 5. Core `$defs`

Recommended definitions:

- `protocolVersion`
- `workItemId`
- `actorId`
- `actor`
- `eventPointer`
- `fullSha`
- `refName`
- `basis`
- `scope`
- `touchPattern`
- `duration`
- `timestamp`
- `evidenceReference`
- `risk`
- `state`
- `resume`
- `authorizationScope`
- `verdict`
- `uncertaintyDeclaration`
- `extensionObject`

## 6. Event groups

### Lifecycle events

- `spec`
- `claim`
- `heartbeat`
- `progress`
- `submit`
- `release`
- `close`
- `supersede`

### Assurance events

- `review`
- `validate`
- `revalidate`
- `violation`
- `reconcile`

### Authority events

- `question`
- `assume`
- `authorize`
- `revoke`
- `decision`

### Coordination events

- `block`
- `unblock`
- `risk`
- `handoff`
- `checkpoint`

The schema should preserve the canonical ACP-1 catalogue. If ACP-1 uses different names, the implementation must document the mapping instead of silently renaming event types.

## 7. Event payload principles

1. Each event payload should be minimal.
2. Shared concepts belong in `$defs`.
3. A field belongs in Core only if its meaning is platform-neutral.
4. Profile-specific rules should remain in `profile.schema.json`.
5. GitHub-specific evidence may use generic URI/reference objects, not GitHub-only field names.
6. Null values should be avoided unless ACP assigns them a distinct meaning.
7. Absence, empty array, and explicit “none” must not be conflated.

## 8. Basis model

Recommended structure:

```json
{
  "ref": "refs/heads/feature-x",
  "sha": "0123456789abcdef0123456789abcdef01234567",
  "scope": ["src/**"],
  "dependencies": [],
  "environment": "staging"
}
```

Rules:

- `sha` required for review, validation, authorization, submit, and revalidate;
- `scope` required when the event claims limited coverage;
- dependencies optional;
- environment optional unless profile policy requires it;
- branch names never substitute for SHA.

## 9. Causal pointer model

`after` should reference a stable event identifier provided by the binding, for example:

```text
github-comment:123456789
```

Core should validate only a constrained identifier shape, not the existence or recency of the referenced event.

## 10. Write surface model

`touches` should be an array of explicit patterns:

```json
["src/services/**", "tests/services/**"]
```

Rules:

- non-empty when required;
- unique items;
- reject an unqualified wildcard-only declaration;
- allow a justification object only if ACP-1 permits broad claims;
- actual overlap detection remains external.

## 11. Uncertainty model

Recommended object form:

```json
{
  "unverified": ["runtime behavior on PostgreSQL 17"],
  "falsified": ["service_role preserved only via direct grant"],
  "would_change_my_mind": ["a B18 replica that fails on the reviewed SHA"]
}
```

Use arrays of precise statements rather than booleans. An explicit empty array means “none declared”; omission means the event failed to make the required declaration.

## 12. Authorization model

Authorization payload should include:

- exact action;
- target;
- scope;
- basis;
- limits;
- expiry.

The schema must reject:

- open-ended action text;
- missing expiry;
- missing basis;
- `default_if_silent`;
- unbounded target/scope where the event claims a sensitive authorization.

Actor authority remains external.

## 13. Question and silence model

Question payload should include:

- question text;
- options;
- expiry;
- default action if silent.

The schema can reject explicit sensitive defaults such as deploy, migration, remote write, or credential mutation. Profile-aware classification remains external.

## 14. Lease model

Claim payload should include:

- intent;
- touches;
- lease duration;
- optional preemption reference and reason.

Heartbeat and release must reference the claim or lease. Expiry and split-brain detection remain external.

## 15. Checkpoint model

Checkpoint payload should include:

- `covers` event range or pointers;
- composite state;
- resume block;
- open items;
- gate status.

A checkpoint is a compressed projection, never a replacement for the event log.

## 16. Revalidation model

Revalidate payload should include:

- `old_basis`;
- `new_basis`;
- `scope_diff`;
- revalidated claims;
- unchanged claims.

The schema cannot prove that the diff lies outside the previously reviewed scope.

## 17. Profile schema architecture

`profile.schema.json` should validate:

- protocol/core version;
- profile ID and version;
- program metadata;
- repositories;
- work-item ID policy;
- agent IDs and trust level;
- roles;
- capabilities;
- platform permissions;
- gates;
- lease and TTL policy;
- silence policy;
- invalidation policy;
- review policy;
- write-surface policy;
- limits;
- reconciliation policy;
- automation declaration;
- namespaced extensions.

Capabilities mean “which protocol events or roles are allowed.” Permissions mean “which real-world actions may be performed.” They must remain separate.

## 18. Strictness and extensibility

Recommended rule:

- `additionalProperties: false` for normative objects;
- one explicit `extensions` object whose keys must match `^x-[a-z0-9][a-z0-9-]*$`;
- extensions cannot shadow normative fields;
- unknown event types fail closed;
- future protocol versions use new schema IDs rather than silently expanding existing enums.

## 19. What JSON Schema must not claim to prove

The schema cannot establish:

- observed actor identity;
- authority at event time;
- append-only integrity;
- causal freshness;
- lease freshness;
- SHA existence;
- basis freshness;
- actual diff overlap;
- review independence;
- artifact existence;
- authorization freshness;
- checkpoint truthfulness;
- gate satisfaction across events;
- honesty of uncertainty declarations;
- absence of contradictory history.

These require a semantic validator and event-log reconciliation.

## 20. Compatibility policy

The first schema should use stable `$id` values and an explicit draft status.

Recommended version axes:

```text
core: 1.0.0-draft
schema: envelope-0.1.0
profile-schema: 0.1.0
```

Breaking changes require a new schema ID. Additive extension fields may be allowed only through the namespaced extension mechanism.

## 21. Acceptance boundary

The schema architecture is acceptable when:

- event payloads remain small;
- Core contains no Reformando or GitHub policy;
- every sensitive event has strict conditional requirements;
- the profile schema owns program policy;
- fixtures prove discriminating behavior;
- semantic limits are explicitly documented.
