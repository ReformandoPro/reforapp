# ACP schemas — formal contract for the event envelope and the profile

> ## Status: **ACP-1.1 amendment candidate implementation**
>
> These schemas implement **ACP-1.1** as published in `feat/acp-1-1-normative-amendments@1bda3e997291e337cc1a3956462e643219d71547`.
>
> ACP-1.1 is itself a candidate that has **not** been approved. This is therefore an *implementation of a candidate*, not a conformant implementation of an adopted standard. **No conformance claim is made until a new independent review.** The previous review returned `SCHEMA STRUCTURALLY VALID — FIXTURE CORPUS INSUFFICIENT`; this version answers M1–M5 and L1–L5, and the corpus grew from 80 to 153 fixtures.

| | |
|---|---|
| JSON Schema dialect | **Draft 2020-12** |
| Envelope | `envelope.schema.json`, `$id: urn:acp:schema:envelope:0.3.0` |
| Profile | `profile.schema.json`, `$id: urn:acp:schema:profile:0.3.0` |
| Implements | ACP-1.1 @ `1bda3e99` |
| Supersedes | 0.2.0 @ `9d073e3c` |
| Traceability | [`TRACEABILITY.md`](TRACEABILITY.md) — **113** requirements, **51** external |
| Executable code shipped | **None** |

---

## 1. Purpose

| Question | Answered by |
|---|---|
| Is this ACP event well formed? | `envelope.schema.json` |
| Which fields are mandatory? | §4.3 and `TRACEABILITY.md` |
| Which depend on the event type? | the `if/then` chain on `type` |
| Which combinations are forbidden? | `oneOf`, `unevaluatedProperties`, `not`, `dependentRequired`, `const` |
| Which invariants are syntactic? | §8A |
| Which need semantic validation? | §8B and the 26 `external` rows of `TRACEABILITY.md` |
| Is this programme configuration coherent? | `profile.schema.json` **plus** the linter of §7, which does not exist |

A document that satisfies these schemas is **well formed**. It is not thereby true, authorized, fresh, attributable, or consistent with the log.

## 2. Conformance requirements

Two, and both are easy to violate silently.

### 2.1 `format-assertion` MUST be enabled (M1)

In Draft 2020-12 `format` is **annotation-only by default**. A validator that does not opt into format assertion accepts `profile:ids.work_item_pattern = "^[A-Z"` — a broken regular expression — without complaint. Measured, not assumed:

| Validator configuration | Fixture `52-profile-invalid-work-item-regex` |
|---|---|
| format assertion **on** | rejected by keyword `format` |
| format assertion **off** | **accepted — the check disappears** |

**A validator is conformant with these schemas only if format assertion is enabled.** Option A of M1 was chosen over option B because there is no portable way to check regular-expression well-formedness in Draft 2020-12 without it, and a schema that quietly checks less depending on the consumer's configuration is worse than one that states its requirement out loud.

Only one keyword depends on it today. That does not make the requirement optional; it makes it cheap.

### 2.2 Both schemas must be loaded together for catalogue parity

The event catalogue is duplicated in both files by deliberate choice (A16). Both carry the identical digest `sha256:046f7cadad317948c7a92a808bade47bbbdf61bdb467ce26a49891da730e0e91` in the `$comment` of `$defs/eventType`. **A release in which the two digests differ is non-conformant.**

The structural cure is upstream: ACP-1.1 A7 makes capability names *be* event type names, so a profile's capability list cannot diverge from the catalogue without failing validation.

## 3. Layer separation

**Core may not contain anything one platform or one organization invented.** Test applied: *would this field still make sense on GitLab, on a mailing list, or in a filesystem-backed log?*

| Concern | Lives in | Examples |
|---|---|---|
| **Core** | `envelope.schema.json` | event types, causality, basis, uncertainty, leases, state, gates |
| **Profile** | `profile.schema.json` | identifier policy, roles, capabilities, permissions, TTLs, silence policy |
| **Binding** | neither, normatively | that `after` is a comment id; that a repository is `owner/name`; that a change request is a pull request |
| **Implementation** | these files | replaceable without touching the protocol |

Five leaks closed across 0.2.0 and 0.3.0: work item naming (A12), repository reference (A13), delivery vocabulary (L2), extension placement (A14), entity id prefixes (L3).

## 4. The envelope contract

### 4.1 Common members

```
v            "1.1"                    major.minor string          REQUIRED
type         enum (27)                discriminator               REQUIRED
actor        actorId                  declared identity           REQUIRED
item | program                        exactly one                 REQUIRED
after        causalPointer            binding-class:id            unless root
root         const true               declares a thread start     root-eligible only
role         roleId                                               optional
on_behalf_of actorId                  delegation                  optional
extensions   {^x-[a-z0-9][a-z0-9-]*$} single container            optional
```

### 4.2 Event types (27) — closed

`answer` · `approve` · `assume` · `authorize` · `block` · `checkpoint` · `claim` · `close` · `debt` · `decide` · `handoff` · `heartbeat` · `progress` · `question` · `reconcile` · `release` · `revalidate` · `review` · `revoke` · `risk` · `spec` · `submit` · `supersede` · `triage` · `unblock` · `validate` · `violation`

Root-eligible: **`spec`, `reconcile`, `decide`** — the last only when programme-scoped.

### 4.3 Required members per type

Beyond `v`, `type`, `actor`, the subject, and `after`-unless-`root`:

| Type | Required | Type | Required |
|---|---|---|---|
| `spec` | `accept`, `touches`, `size` | `question` | `to`, `question`, `options`, `default_if_silent`, `expires` |
| `triage` | `priority`, `initiative` | `answer` | `target`, `answer` |
| `claim` | `lease`, `touches`, `intent` | `assume` | `premise`, `verify_by`, `risk_if_wrong` |
| `heartbeat` | **`claim`**, `lease` | `authorize` | `target`, `scope`, `basis`, `limits`, `expires` |
| `release` | **`claim`**, `reason` | `revoke` | `target`, `reason` |
| `progress` | `done`, `remaining` | `decide` | `decision`, `version`, `scope` |
| `handoff` | `to`, `resume`, `releases_lease` | `block` | `on`, `kind`, `unblock_when`, `escalate_after`, `workaround` |
| `submit` | `basis`, `touches`, `evidence`, `unverified` | `unblock` | `target`, `how` |
| `review` | `basis`, `verdict`, `adversarial`, `unverified` | `risk` / `debt` | the corresponding object |
| `revalidate` | `revalidates`, `old_basis`, `new_basis`, `scope_diff` | `checkpoint` | `covers`, `state`, `resume`, `open`, `gates` |
| `validate` | `check`, `result`, `basis` | `reconcile` | `fixed` |
| `approve` | `gate`, `basis`, `ttl` | `violation` | `rule`, `target`, `severity`, `effect` |
| `supersede` | `by`, `reason` | `close` | `resolution` |

### 4.4 Conditional rules

| Condition | Consequence |
|---|---|
| no `root` | `after` required |
| `root: true` | `after` forbidden; `type` must be root-eligible |
| `root: true` and `type = decide` | `program` required |
| `review.adversarial = true` | `falsified` required |
| `review.verdict` ≠ `approve` | `would_change_my_mind` required |
| `submit.evidence` empty | `no_evidence_reason` required |
| `claim.preempts` present | `preempt_declaration` with both flags `true` |
| `touches` has a bare wildcard | `touches_rationale` required |
| `question.kind = authorization` | `default_if_silent` must be `deny` |
| `authorize` | `default_if_silent` / `default_rationale` forbidden |
| `revalidate.scope_diff.outside_scope = false` | `revalidated_claims` required |
| `revalidate.scope_diff.paths` | non-empty, always |
| `assume.authority = default-on-timeout` | `source_question` required |
| `close.resolution` ∈ {`superseded`,`rotated`} | `into` required |
| any assertion | `basis.sha`, 40 lowercase hex |

### 4.5 The flat form is not a schema preference

The envelope is flat because **ACP-1.1 §5.2.2 decides it normatively** (amendment A23), after comparing it against `metadata + payload` on six criteria. This schema implements that decision; it did not make it. Worth repeating: the strongest argument for `payload` — per-type field isolation — is already delivered by `unevaluatedProperties` in the flat form, which fixture `28-field-from-another-event-type` demonstrates. **No claim is made about LLM error rates in either direction; no experiment was run.**

## 5. Closing the eight divergences with ACP-1.1

ACP-1.1 §0.5 listed eight points where schema 0.2.0 disagreed with the specification. All eight are closed:

| # | 0.2.0 | 0.3.0 | Fixtures |
|---|---|---|---|
| 1 | `v` integer `1` | string `"1.1"`, pattern `^1\.[1-9][0-9]*$` | `34` |
| 2 | `after` accepted a bare integer | namespaced `binding-class:id` only | `30` |
| 3 | `x-*` loose at the root | single `extensions` container | `41`, `65`, `47`, `48`, `49` |
| 4 | `item` optional on six types | exactly one of `item` / `program` | `61`, `62`, `28`, `40` |
| 5 | root allowed on six types | `spec`, `reconcile`, programme-`decide` | `39`, `43`, `40`, `57`, `58`, `59`, `60` |
| 6 | `unverified` `minItems: 1` | `[]` admissible | `42` |
| 7 | `heartbeat`/`release` without claim reference | both require `claim` | `06`, `08`, `63`, `64` |
| 8 | no `on_behalf_of` | present, without capability inheritance | type-only; see §8B |

## 6. Review findings M1–M5, L1–L5

| Finding | Resolution |
|---|---|
| **M1** format assertion | **Option A.** Declared as a conformance requirement (§2.1), with measured evidence that the check vanishes without it |
| **M2** duplicate option ids | **Documented limitation, not fixed.** A map keyed by id would prevent it structurally, but ACP-1.1 §13.6 specifies `options` as an array of objects, and changing it here would be the schema legislating over the specification — the exact mistake this round exists to correct. Fixture `50-question-duplicate-option-ids` is **valid on purpose**: it records that the schema accepts a document a semantic validator must reject. Proposed for ACP-1.2 |
| **M3** `scope_diff.paths` | Fixed: `minItems: 1`. Fixture `56` |
| **M4** profile referential integrity | Not fixable in JSON Schema. Full table in §7 |
| **M5** Reformando profile fixture | Regenerated from the real `acp/acp.yml` at ACP-1.1 `1bda3e99`, transcoded without edits. Six policy keys it declares (`require_claim_reference`, `revalidate_resets_ttl`, `revalidate_same_actor_only`, `require_full_sha`, `allow_empty_unverified`, `require_adversarial_declaration`) were missing from the profile schema and were added — **the real file caught them; a hand-written example would not have** |
| **L1** profile extension grammar | Aligned with the envelope: same pattern, same container. Fixtures `66`, `67`, `68` |
| **L2** delivery vocabulary | **Changed.** `pull-request` and `merge-request` were two platforms' nouns inside Core. Now `change-request`, `commit`, `artifact`, `external`; a pull request number lives in `extensions.x-github-pr` |
| **L3** risk/debt/decision id prefixes | Removed from Core (`$defs/entityId` is a generic token). `RSK-`, `DEBT-`, `ACD-` are profile policy |
| **L4** `decide` root | Implemented: root only when programme-scoped. Fixtures `40` valid, `60` invalid |
| **L5** short SHAs | Audited. In fixtures the only abbreviated SHAs are the two deliberate negatives (`24`, `25`). This README's single occurrence is a **quotation** of ACP-1's old text. ACP-1.1's `acp/AGENTS.md` was checked read-only and is compatible: no short SHAs, 5 namespaced pointers, `v: "1.1"` throughout. **It was not modified from this branch** |

## 7. Profile referential integrity — needs a linter (M4)

JSON Schema validates the shape of a profile. It cannot validate that the profile's internal references point at anything real. **These are unchecked today:**

| Invariant | Why unreachable |
|---|---|
| `agents[].role` names a role declared in `roles` | cross-reference between two members |
| `review.adversarial_reviewers` name declared agents | idem |
| `review.veto_holders` name declared agents | idem |
| `reconcile.owners` name declared agents | idem |
| `roles.*.approve_gates` name declared gates | idem |
| `gates.*.requires[].gate` names a declared gate | idem |
| `gates.*.requires[].by_role` names a declared role | idem |
| `automation.implementation[].owner` names a declared agent | idem |
| `write_surfaces.surfaces.*.owner_role` names a declared role | idem |
| Two agents share an `id` with different bodies | `uniqueItems` compares whole items; JSON Schema has no unique-by-property |
| A capability granted to a role is one its agents can exercise | requires identity resolution |
| Shorthand permissions contradict each other | the flat forms cannot express a contradiction, so they cannot be checked for one; only the expanded object form is checked |
| `ids.reserved` entries are actually rejected as `item` values | requires validating envelopes against the profile |
| `identity.trust_level` reflects reality | requires knowing the accounts |

**Do not read a green profile validation as "this profile is coherent".** It means the shapes are right.

## 8. What the schemas can and cannot validate

### 8A. Syntactic — enforced

Formats; required members per type; enumerations; the subject rule; root eligibility and exclusivity; per-type field isolation; a full SHA on every assertion; a declared actor; a namespaced causal predecessor or an explicit root; non-empty duplicate-free `touches`; non-empty `scope_diff.paths`; claim references on lease events; extension-key grammar and placement; protocol version; contradictions in expanded permission entries; well-formedness of the profile's identifier regex (given §2.1).

### 8B. Semantic — NOT enforced

The authoritative list is `TRACEABILITY.md`, which marks **26 of 78 requirements external**. The ones most likely to be assumed away:

| Invariant | Needs |
|---|---|
| `actor` matches the account that posted — **the whole point of A10** | binding |
| `on_behalf_of` does not escalate privilege | capability resolver |
| `after` is really the last event read; two events share an `after` | log reader |
| A `root: true` event really begins its thread; only one root per thread | log reader |
| A causal pointer resolves at all — fixture `49` is the boundary case | log reader |
| `basis.sha` exists and is head of `basis.ref`; the diff is inside `touches` | git |
| Only the original author revalidated; the TTL did not reset | log reader |
| A question is really an authorization despite its declared `kind` | semantic validator + `never_default_actions` |
| `default_if_silent` names a real option; option ids are unique (M2) | semantic validator |
| The work item id satisfies the profile pattern — **A12's cost** | profile-aware pass |
| Review independence; honesty of `unverified`, including `[]` | adversarial reviewer |
| Evidence exists and its digest matches; authorization still fresh | artifact store, clock |
| Everything in §7 | profile linter |

No regular expression approximates any of these. A regex that half-checks a distributed invariant produces confident wrong answers.

## 9. Fixtures

**Convention.** A filename containing `profile` validates against `profile.schema.json`; everything else against `envelope.schema.json`. Numbered for stable ordering. No comments inside fixtures: an unknown member would contaminate the reason a negative fixture fails.

### 9.1 Valid — 63, all must be accepted

Every one of the 27 event types is exercised. New or changed in 0.3.0:

| Fixture | What it proves |
|---|---|
| `39-spec-root-event` | root `spec` with an item |
| `43-reconcile-root` | root `reconcile` |
| `40-decide-root-programme-level` | root `decide`, programme-scoped |
| `44-risk-with-after`, `45-debt-with-after`, `46-violation-with-after` | the three types that lost root eligibility now link to history |
| `06-heartbeat`, `08-release-lease` | claim references |
| `42-review-unverified-empty` | `unverified: []`, invalid in 0.2.0 |
| `47-item-lowercase-prefix`, `48-item-uuid-like` | Core accepts any stable token |
| `38-item-core-accepts-any-stable-token` | Core accepts `R2.1`; only the profile forbids it |
| `49-after-syntactically-valid-semantically-stale` | **a well-formed pointer that is semantically stale.** The schema accepts it and cannot do otherwise |
| `50-question-duplicate-option-ids` | **duplicate option ids are accepted.** Records the M2 limitation as executable evidence |
| `41-extension-keys-strict-grammar`, `09-submit-with-unverified` | `x-github-pr` inside the container |
| `36-profile-reformando` | the real ACP-1.1 `acp.yml`, transcoded unedited |
| `37-profile-minimal-generic` | the profile schema is not shaped around one organization |

### 9.2 Invalid — 90, each rejected by the stated keyword

A fixture failing for a *different* reason is a defect in the corpus. New in 0.3.0:

| Fixture | Rule broken | Keyword |
|---|---|---|
| `31-event-without-actor` | every authored event claims an identity | `required` |
| `54-assume-timeout-without-source-question` | a default applied on timeout must cite its question | `required` |
| `55-revalidate-without-new-basis` | nothing to compare to | `required` |
| `56-revalidate-empty-scope-diff-paths` | naming no path asserts nothing (M3) | `minItems` |
| `57-risk-as-root` | a risk is discovered while doing something | `enum` |
| `58-debt-as-root` | debt is incurred doing concrete work | `enum` |
| `59-violation-as-root` | it denounces a target that already exists | `enum` |
| `60-decide-item-level-root` | an item decision continues a thread | `required` |
| `61-both-item-and-program` | exactly one subject | `oneOf` |
| `62-neither-item-nor-program` | exactly one subject | `oneOf` |
| `63-heartbeat-without-claim` | which lease is being renewed? | `required` |
| `64-release-without-claim` | which lease is being released? | `required` |
| `65-extension-outside-container` | extensions live in the container | `unevaluatedProperties` |
| `66`, `67`, `68` | profile keys `x-`, `X-foo`, `x_foo` | `pattern` |
| `44-non-root-event-without-after` | a mutation cannot omit its predecessor | `required` |
| `45-root-flag-on-non-root-eligible-type` | a `claim` cannot begin a thread | `enum` |
| `46-root-declared-with-after` | root and predecessor are exclusive | `not` |
| `30-after-arbitrary-text` | a causal pointer must resolve mechanically | `pattern` |
| `34-protocol-version-unsupported` | `v: 1`, the old integer form | `type` |
| `50-repo-binding-shorthand-in-core`, `51-repo-reference-without-system` | portable repository reference | `type`, `required` |
| `52-profile-invalid-work-item-regex` | `^[A-Z` is not a regex — **only caught with §2.1** | `format` |
| `53-profile-unknown-never-default-action` | unknown action name | `enum` |

The rest carry over from 0.2.0 unchanged in intent: missing basis, missing SHA, missing `falsified`, missing `would_change_my_mind`, missing `unverified`, question without default or expiry, sensitive silent default, four `authorize` failures, four `claim` failures, handoff without next action, checkpoint without resume, short and uppercase SHAs, unknown field, unknown type, field from another type, absolute `expires`, close-rotated without `into`, and the eight profile failures.

## 10. `additionalProperties` policy

| Level | Setting | Reason |
|---|---|---|
| Envelope root | `unevaluatedProperties: false` | rejects unknown members **and** members of another event type |
| Per-type contracts | nothing | closure happens once, at the root |
| Nested value objects | `additionalProperties: false` | a typo must not pass silently |
| `extensions` container | `propertyNames` pattern, any value | the extension path |
| Profile root | `additionalProperties: false`, extensions in the container | a configuration typo that silently does nothing is worse than a rejected file |
| `permissions` | open keys, closed values | action names are profile vocabulary |

## 11. Versioning

| Axis | Where | Rule |
|---|---|---|
| Core protocol | envelope `v` | `major.minor`; accepts `1.x` for x≥1, rejects `1.0` and other majors |
| Specification | profile `spec` | free string |
| Profile | profile `profile_version` | semver |
| Binding | profile `binding` | semver |
| Schema | `$id` suffix — **0.3.0** | semver |

**0.2.0 → 0.3.0 is breaking in both directions:** documents valid under 0.2.0 are rejected (integer `v`, bare integer `after`, loose `x-`, absent `actor`), and documents valid under 0.3.0 were rejected by 0.2.0 (`unverified: []`, `program` subject).

Extending without breaking: use `extensions`. A member that proves generally useful is promoted to a Core optional member in a minor bump, and becomes required only in a major one.

## 12. How this corpus was verified

**ajv 8.20.0**, Draft 2020-12, `strict: true`, `strictRequired: false`, `allErrors: true`, **format assertion explicitly enabled** (§2.1), against a temporary harness **deliberately not committed** — validation tooling is automation, and automation is out of scope.

At the published commit: both schemas compile; every `$ref` resolves, none external; **63 of 63** valid fixtures accepted; **90 of 90** invalid fixtures rejected, each firing the keyword or schema path of §9.2; no duplicate keys in any of the 155 JSON files; catalogue digests identical and matching the recomputed value; `git diff --check` clean.

`strictRequired` is relaxed because ajv flags `required` inside an `allOf` branch when the property is declared in a sibling branch — a false positive for conditional contracts.

## 12.1 Corrections after the independent review

Hermes returned `CHANGES REQUIRED — NORMATIVE/EXECUTABLE DIVERGENCE REMAINS`. The confirmed defects are fixed in this revision:

| Finding | What changed here |
|---|---|
| **H1** `delivery.kind` | The normative enum of ACP-1.1 §6.1 is restored: `pull-request`, `merge-request`, `branch`, `patch`. Schema 0.3.0 had unilaterally replaced it; **that was the schema legislating over the specification.** The generic vocabulary is now a proposal for ACP-1.2 |
| **H2** `violation.rule` | 15 → **23 codes, taken verbatim from ACP-1.1 §15.1**, including the eight that were unreportable |
| **H3** programme checkpoint | `checkpoint` accepts `item` **or** `program`; `state`/`gates` required only for an item checkpoint; `from`/`to` added for the migration announced by §16.4 |
| **M-A** traceability | Rebuilt from the sources, counts recomputed, 18 untraced requirements added, and an external register naming owner, inputs, output, failure behaviour and gate effect |
| **M-B** contaminated fixtures | The ten Hermes named now fail for the rule they announce |
| **M-C** versioning | `v` is `const "1.1"`. **This schema is writer-strict for ACP-1.1**; reader tolerance is a separate layer and a future minor needs a future schema |
| **L-a** | `revalidated_parts` → `revalidated_claims`, the spec's term |
| **L-b** | Nine alias fixtures, each carrying a valid body so only the type name is wrong |
| **L-c** | `reconcile` may root an item or a programme thread; the spec says so first, the schema follows |
| **L-d** | No operative reference to the pre-A7 capability spelling survives outside the prohibited-alias table |
| **L-e** | `v` and the causal pointer grammar now say the same thing in spec and schema |
| **L-f** | ACP-1.1's own examples fixed: portable repository reference, structured `base`, subject on `authorize` |

**Discriminating test, run in full.** For each of the 90 invalid fixtures: it fails; the target rule is then repaired; the fixture must pass. **90 of 90 pass after repair**, so none is contaminated. The cascade of `unevaluatedProperties` errors that accompanies a failing `then` branch is an artefact of the validator's reporting, not a second defect: it disappears with the root cause.

## 13. Remaining divergences and risks

1. **No conformance claim.** ACP-1.1 is a candidate; this implements a candidate. A new independent review is required.
2. **Fields an LLM will systematically get wrong**: `after`, `basis.sha`, `evidence[].id`, `covers`, and now `claim`. All must be **read from a tool, never recalled**. The schema catches malformed values, never a well-formed fabrication. Unchanged since 0.1.0 and still the largest practical risk in the corpus.
3. **M2 remains open by choice.** Duplicate option ids are accepted; fixture `50` records it. Closing it needs an ACP-1.2 amendment, not a schema decision.
4. **The profile linter of §7 does not exist**, so fourteen referential invariants are unchecked.
5. **The profile-aware envelope pass does not exist**, so `ids.work_item_pattern` and `ids.reserved` enforce nothing (fixture `38`).
6. **51 of 113 traced requirements are external.** A green run says nothing about them.
7. **`v` accepts `1.x` for any x≥1**, so a future `1.2` document is validated against 1.1 rules and may be wrongly rejected for unknown members. That is the A8 tension made concrete: this schema is the strict-writer side and a reader must not use it unmodified.

## 14. Open decisions for reviewers

- ACP-1.2: `question.options` as a map keyed by id, closing M2 structurally?
- Should the profile record the schema `$id` it was validated against, making drift detectable?
- Should `unverified` require structured entries (`{area, why_not_verified}`)? More checkable, gameable differently.
- Should a rotated item's first `checkpoint` be root-eligible, since it begins a thread while continuing another?
- Is `change-request` the right Core noun, or should Core name no delivery vehicle at all and leave the concept entirely to bindings?
