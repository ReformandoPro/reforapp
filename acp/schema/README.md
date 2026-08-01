# ACP schemas — formal contract for the event envelope and the profile

Status: **draft, published for review. Not active, not adopted, not automated.**

| | |
|---|---|
| JSON Schema dialect | **Draft 2020-12** (`https://json-schema.org/draft/2020-12/schema`) |
| Envelope schema | `envelope.schema.json`, `$id: urn:acp:schema:envelope:0.1.0` |
| Profile schema | `profile.schema.json`, `$id: urn:acp:schema:profile:0.1.0` |
| Layer | Implementation (see `docs/agents/acp-architecture.md` on `chore/agent-protocol-mvp`) |
| Semantics | ACP Core only, plus fields a profile is allowed to tighten |
| Executable code shipped | **None.** No validator, no workflow, no bot, no script |

---

## 1. Purpose

These two schemas turn ACP-1 from prose into something that can be answered with yes or no:

| Question | Answered by |
|---|---|
| Is this ACP event well formed? | `envelope.schema.json` |
| Which fields are mandatory? | `required` per event type, section 4 |
| Which fields depend on the event type? | the `if/then` chain on `type` |
| Which combinations are forbidden? | `unevaluatedProperties`, `not`, `dependentRequired`, `const` |
| Which invariants can be checked syntactically? | section 5A |
| Which need semantic validation afterwards? | section 5B — **read this one** |
| Is this programme configuration coherent? | `profile.schema.json` |

A document that satisfies these schemas is **well formed**. It is not thereby **true**, **authorized**, **fresh**, or **consistent with the log**. Section 5B is the list of things a passing validation does not tell you, and it is longer than the list of things it does.

## 2. Why URN identifiers

Both schemas use `urn:acp:schema:...` rather than an `https://` `$id`. ACP does not own a domain, and a `$id` pointing at a URL nobody controls is a promise that will break. URNs are valid JSON Schema identifiers and never 404. The cost: a validator must be handed both files rather than fetching them.

## 3. Layout

```
acp/schema/
  envelope.schema.json      one ACP event
  profile.schema.json       one programme configuration (for example acp/acp.yml, parsed to JSON)
  README.md                 this file
  fixtures/
    valid/                  37 documents that MUST be accepted
    invalid/                43 documents that MUST be rejected, each for a stated reason
```

**Fixture convention.** A fixture whose filename contains `profile` is validated against `profile.schema.json`; every other fixture is validated against `envelope.schema.json`. Files are numbered so the corpus has a stable order. Fixtures contain no comments, by design: a `$comment` member would itself be an unknown property and would contaminate the reason a negative fixture fails. The reasons live in the tables in sections 8 and 9 instead.

## 4. The envelope contract

### 4.1 Shape

Six common members, then one contract per event type:

```
v        integer, const 1     protocol major version
type     enum                 the discriminator
item     workItemId           required by most types, not all
actor    actorId              logical agent identity
role     roleId
after    causalPointer        platform-assigned identifier of the last event read
x-*                           local extension namespace, always permitted
```

Type-specific members are added by an `if/then` branch on `type`. Because only the matching branch is applied, a field belonging to another event type is not merely discouraged: it is **unevaluated**, and the root `unevaluatedProperties: false` rejects it. That is what makes "which combinations are forbidden" a mechanical question. `verdict` on a `heartbeat` fails; so does `touches` on a `checkpoint`.

### 4.2 Event types

27 types. 24 are the normative catalogue of ACP-1 section 5.3; three are additions, justified in section 7.

`answer` · `approve` · `assume` · `authorize` · `block` · `checkpoint` · `claim` · `close` · `debt`\* · `decide` · `handoff` · `heartbeat` · `progress` · `question` · `reconcile` · `release` · `revalidate`\* · `review` · `revoke` · `risk`\* · `spec` · `submit` · `supersede` · `triage` · `unblock` · `validate` · `violation`

\* addition to ACP-1 section 5.3.

### 4.3 Required members per type

| Type | Required beyond `v` and `type` |
|---|---|
| `spec` | `item`, `accept`, `touches`, `size` |
| `triage` | `item`, `priority`, `initiative` |
| `claim` | `item`, `lease`, `touches`, `intent` |
| `heartbeat` | `item`, `lease` |
| `release` | `item`, `reason` |
| `progress` | `item`, `done`, `remaining` |
| `handoff` | `item`, `to`, `resume`, `releases_lease` |
| `submit` | `item`, `basis`, `touches`, `evidence`, `unverified` |
| `review` | `item`, `basis`, `verdict`, `adversarial`, `unverified` |
| `revalidate` | `item`, `revalidates`, `old_basis`, `new_basis`, `scope_diff` |
| `validate` | `item`, `check`, `result`, `basis` |
| `approve` | `item`, `gate`, `basis`, `ttl` |
| `authorize` | `actor`, `target`, `scope`, `basis`, `limits`, `expires` |
| `revoke` | `target`, `reason` |
| `block` | `item`, `on`, `kind`, `unblock_when`, `escalate_after`, `workaround` |
| `unblock` | `item`, `target`, `how` |
| `question` | `item`, `to`, `question`, `options`, `default_if_silent`, `expires` |
| `answer` | `target`, `answer` |
| `assume` | `item`, `premise`, `verify_by`, `risk_if_wrong` |
| `decide` | `decision`, `version`, `scope` |
| `risk` | `risk` object |
| `debt` | `debt` object |
| `checkpoint` | `item`, `covers`, `state`, `resume`, `open`, `gates` |
| `reconcile` | `fixed` |
| `violation` | `rule`, `target`, `severity`, `effect` |
| `supersede` | `item`, `by`, `reason` |
| `close` | `item`, `resolution` |

### 4.4 Conditional rules

Everything below is enforced by the schema, not by convention:

| Condition | Consequence |
|---|---|
| `review.adversarial = true` | `falsified` required |
| `review.verdict` is `changes` or `reject` | `would_change_my_mind` required |
| `submit.evidence` is empty | `no_evidence_reason` required |
| `claim.preempts` present | `preempt_declaration` required, with `previous_lease_expired: true` **and** `previous_work_read: true` |
| `claim`/`spec` `touches` contains a bare wildcard | `touches_rationale` required |
| `question.kind = authorization` | `default_if_silent` must be exactly `deny` |
| `authorize` | `default_if_silent` and `default_rationale` forbidden outright |
| `revalidate.scope_diff.outside_scope = false` | `revalidated_parts` required |
| `assume.authority = default-on-timeout` | `source_question` required |
| `close.resolution` is `superseded` or `rotated` | `into` required |
| any assertion type | `basis.sha` required, exactly 40 lowercase hex |

Two of those deserve a note.

**`adversarial` is mandatory on every review.** An optional flag could simply be omitted to escape the `falsified` requirement. Mandatory, it turns evasion into a signed false statement that the profile's `adversarial_reviewers` list contradicts. The schema cannot catch the lie; it can force it to be made explicitly, which is the whole design philosophy of ACP's uncertainty fields.

**`unverified` has no minimum entry length.** A length threshold would be satisfied by padding and would convert a substantive obligation into a formatting one. The schema guarantees the list is present and non-empty. Whether its contents are honest is a job for the adversarial reviewer.

## 5. What the schemas can and cannot validate

### 5A. Syntactic — enforced here

Formats (`fullSha`, `digest`, `duration`, URN, causal pointer); required members per type; enumerations; forbidden combinations; per-type field isolation; structural shape; presence of a SHA on every assertion; non-empty and duplicate-free `touches`; the protocol major version.

### 5B. Semantic — NOT enforced here

Each row is an invariant the protocol depends on and the schema cannot reach. **A validator that reports "valid" has said nothing about any of these.**

| Invariant | Why the schema cannot check it | Needs |
|---|---|---|
| `after` really is the last event the author read | Requires the log | Log reader |
| Two events share an `after` (causal fork) | Requires sibling events | Log reader |
| `actor` matches the platform account that posted | Requires platform identity | Binding |
| A lease has expired | Requires platform timestamps | Binding + clock |
| `basis.sha` exists and is the head of `basis.ref` | Requires the repository | Git |
| The diff falls inside `touches` | Requires the diff | Git |
| `basis.scope` really covers the assertion | Human judgement | Reviewer |
| A review is independent of the submission | Requires actor comparison across events | Log reader |
| Evidence exists, and its digest matches | Requires fetching the artifact | Artifact store |
| An authorization is still fresh and unrevoked | Requires later events and a clock | Log reader |
| An event does not contradict earlier events | Requires the whole log | Log reader |
| A checkpoint omits no material evidence | Requires comparing against everything it covers | Human judgement |
| `unblock_when` is genuinely verifiable | It is a string | Human judgement |
| `accept` criteria are genuinely executable | They are strings | Human judgement |
| `question.default_if_silent` names a real option id | JSON Schema cannot cross-reference array contents | Log reader |
| `unverified` entries are truthful and material | Judgement | Adversarial reviewer |
| An `adversarial: false` claim is honest | Requires the profile | Profile cross-check |
| Two profile agents share an `id` but differ | `uniqueItems` compares whole items, and JSON Schema has no unique-by-property | Profile linter |
| A capability granted to a role is one the actor may exercise | Requires identity resolution | Binding |

No attempt is made to approximate any of these with regular expressions. A regex that half-checks a distributed invariant is worse than no check, because it produces confident wrong answers.

## 6. The profile contract

`profile.schema.json` validates a programme configuration: versions, programme, repos, ids, agents, roles, capabilities, permissions, gates, leases, invalidation, review policy, silence policy, write surfaces, limits, reconciliation, automation, `x-` extensions.

Two distinctions it enforces:

- **Capabilities are protocol authority** — which class of event a role may emit, plus `veto` and `approve:<gate>`. A closed enumeration: an unknown capability is a validation error.
- **Permissions are platform effects** — what an actor may do in the world. `permissions.default` accepts `deny` (and `allow`, for profiles that want it). Each action may be `authorization`, `forbidden`, `allowed`, a list of roles, or an expanded object.

The expanded object is what makes contradictions detectable:

```json
{ "force_push": { "mode": "forbidden", "roles": ["engineer"] } }
```

is rejected — forbidden and simultaneously granted. So is `{ "mode": "allowed", "irreversible": true }`: an irreversible action may be `authorization` or `forbidden`, never freely allowed. **The flat shorthand forms cannot express a contradiction, so they cannot be checked for one.** A profile that wants its permissions machine-audited should use the object form.

The profile schema also encodes four ACP Core invariants that a profile must not weaken:

| Field | Constraint | Core invariant |
|---|---|---|
| `review.self_review` | must be `forbidden` | an agent cannot independently approve its own delivery |
| `invalidation.stale_counts_for_gates` | must be `false` | stale evidence does not satisfy a gate |
| `silence.never_default` | must contain `authorize` | silence never authorizes |
| `automation.enabled = true` | requires `implementation` | no machine action without an accountable component |

`identity.trust_level` (1 self-declared … 5 organization-managed) is optional but recommended: a profile that claims separation of powers while every agent shares one account is overstating its guarantees, and the protocol should say so out loud rather than imply otherwise.

## 7. Discrepancies found in ACP-1

Each was resolved in favour of the option that makes an invariant checkable. All of them require an amendment to `acp/ACP-1.md` on `feat/acp-1-protocol`; **none has been applied there** — that branch was not touched.

| # | ACP-1 says | Schema does | Why |
|---|---|---|---|
| D1 | Section 21 grammar: `sha_prefix`, at least 10 hex | Exactly 40 lowercase hex | A prefix can become ambiguous as a repository grows; an anchor that can become ambiguous cannot support invalidation. **Every SHA in ACP-1's examples is 10 characters and would now be invalid.** |
| D2 | Section 5.3 declares a closed catalogue of 24 types | 27 | `risk` and `debt` are used as event types in Appendix A and defined field by field in 13.2 and 13.3, but are missing from 5.3. Either 5.3 or Appendix A is wrong. |
| D3 | Section 6.3 models revalidation as `type: review` with a `revalidates` member; 7.4 and `AGENTS.md` speak of a `revalidate` event | Distinct `revalidate` type | As a review field, nothing forces the old basis, the new basis and the scope claim to be present together. As a type, all three are required. |
| D4 | `base: main@a71c0e94` — a single string | `base: { ref, sha }` | A string cannot be validated as a pair, and the two halves are checked differently. |
| D5 | `scope: deploy:staging` — a label | `scope: { action, environment }` | "Must declare the concrete action authorized" is unenforceable against a free string. |
| D6 | Section 21 lists `pr` as required on `submit` | `delivery: { kind, id }`, optional; a pull request number belongs in `x-github-pr` | `pr` is a GitHub concept. Core must not name it. This was a binding leak in the Core grammar. |
| D7 | Capability `specify` versus event type `spec` | Both kept, in separate namespaces | Two names for one concept, in two registries. Confusing them silently disables `write_surfaces.require_touches_in` — which is exactly what happened while writing this schema, and is why the distinction is now documented in both places. |
| D8 | Section 16 rule 3: "an unknown member is ignored, never invalidates the event" | Root `unevaluatedProperties: false` rejects unknown members | Not a contradiction once the roles are separated: **the schema is strict for authoring, the protocol is lenient for reading.** A reader on schema 0.1.0 must not reject a v1 event carrying a member added in a later minor version; it should ignore it. Stated here because a naive implementation that uses this schema as its reader will violate ACP-1 section 16. |
| D9 | Both relative durations (`expires: 24h`) and absolute dates (`decided: 2026-07-28`) appear | Envelopes: relative only. `timestamp` exists but is not admissible for `expires`, `lease` or `ttl` | Invariant I4: the authoritative clock is the platform's, not the agent's. Absolute instants remain legal in entity records, which are files, not envelopes. |

## 8. Valid fixtures (37)

All must be accepted. Together they exercise every one of the 27 event types.

`01-spec-minimal` · `02-triage` · `03-claim` · `04-claim-preemption` · `05-claim-wildcard-with-rationale` · `06-heartbeat` · `07-progress` · `08-release-lease` · `09-submit-with-unverified` · `10-submit-no-evidence-with-reason` · `11-review-approve` · `12-review-changes-with-would-change-my-mind` · `13-review-adversarial-falsified` · `14-revalidate-outside-scope` · `15-revalidate-partial` · `16-validate` · `17-approve-gate` · `18-question-with-default-and-expiry` · `19-question-authorization-default-deny` · `20-answer` · `21-assume-after-expiry` · `22-authorize` · `23-revoke` · `24-block` · `25-unblock` · `26-risk` · `27-debt` · `28-decide` · `29-handoff-complete` · `30-checkpoint-complete` · `31-reconcile-causal-fork` · `32-violation` · `33-supersede` · `34-close-done` · `35-envelope-with-extension` · `36-profile-reformando` · `37-profile-minimal-generic`

`36-profile-reformando.json` is not a hand-written example: it is `acp/acp.yml` from `feat/acp-1-protocol` at `0b714a9a`, transcoded to JSON without edits. That the real configuration validates unchanged is the point of including it. `37-profile-minimal-generic.json` exists to demonstrate the profile schema is not shaped around one organization.

## 9. Invalid fixtures (43)

All must be rejected, each for the stated reason. The keyword column is the JSON Schema keyword that must fire — a fixture that fails for a *different* reason is a defect in the corpus, not a passing test.

| Fixture | Rule broken | Keyword |
|---|---|---|
| `01-review-without-basis` | an assertion needs an anchor | `required` |
| `02-review-basis-without-sha` | a basis without a SHA cannot be invalidated | `required` |
| `03-review-adversarial-without-falsified` | adversarial review must state what it attacked | `required` |
| `04-review-changes-without-would-change-my-mind` | a non-approving verdict needs an exit condition | `required` |
| `05-submit-without-unverified` | ignorance must be declared | `required` |
| `06-submit-empty-evidence-without-reason` | no evidence is admissible only as an explicit statement | `required` |
| `07-question-without-default` | silence must have a defined meaning | `required` |
| `08-question-without-expires` | a question without a clock stalls the system | `required` |
| `09-question-default-authorizes-deploy` | silence never authorizes | `const` |
| `10-authorize-without-expires` | an authorization must die | `required` |
| `11-authorize-without-limits` | an authorization must bound the worst case | `required` |
| `12-authorize-without-basis` | an artifact is authorized, not an intention | `required` |
| `13-authorize-with-empty-limits` | `limits: {}` is a blank cheque | `minProperties` |
| `14-authorize-with-default-if-silent` | silence never authorizes | `not` |
| `15-claim-without-touches` | overlap detection needs a declared surface | `required` |
| `16-claim-invalid-lease` | `"6 hours"` is not a duration | `pattern` |
| `17-claim-duplicate-touches` | a surface is a set | `uniqueItems` |
| `18-claim-wildcard-without-rationale` | claiming everything must be justified | `required` |
| `19-claim-preempts-without-declaration` | taking over needs two explicit statements | `dependentRequired` |
| `20-handoff-without-next-action` | an incomplete handoff does not release the lease | `required` |
| `21-checkpoint-without-resume` | a checkpoint without a resume packet does not bound recovery | `required` |
| `22-revalidate-without-old-basis` | nothing to compare against | `required` |
| `23-revalidate-partial-without-revalidated-parts` | must say what was revalidated | `required` |
| `24-sha-too-short` | 10-character prefix (as in ACP-1's own examples) | `pattern` |
| `25-sha-uppercase` | canonical form is lowercase | `pattern` |
| `26-unknown-field` | unknown member outside `x-` | `unevaluatedProperties` |
| `27-unknown-event-type` | the catalogue is closed | `enum` |
| `28-field-from-another-event-type` | `verdict` on a `heartbeat` | `unevaluatedProperties` |
| `29-expires-absolute-timestamp` | deadlines are relative (I4) | `pattern` |
| `30-after-arbitrary-text` | a causal pointer must resolve mechanically | `oneOf` |
| `31-item-reserved-product-id` | `R2.1` is a product milestone, not a work item | `pattern` |
| `32-unverified-empty` | an empty declaration is not a declaration | `minItems` |
| `33-close-rotated-without-into` | rotation must name its continuation | `required` |
| `34-protocol-version-unsupported` | `v: 2` is out of scope; reject, do not guess | `const` |
| `35-profile-duplicate-agent` | identical agent entries | `uniqueItems` |
| `36-profile-unknown-capability` | `deploy` is a permission, not a capability | `oneOf` |
| `37-profile-automation-without-implementation` | machine action needs an accountable component | `required` |
| `38-profile-contradictory-permission` | forbidden and granted at once | `not` |
| `39-profile-irreversible-allowed` | irreversible cannot be freely allowed | `enum` |
| `40-profile-stale-counts-for-gates` | stale evidence must not satisfy a gate | `const` |
| `41-profile-self-review-permitted` | no self-approval | `const` |
| `42-profile-silence-can-authorize` | `never_default` must contain `authorize` | `contains` |
| `43-review-without-adversarial-declaration` | the adversarial stance must be stated, not omitted | `required` |

## 10. `additionalProperties` policy

| Level | Setting | Reason |
|---|---|---|
| Envelope root | `unevaluatedProperties: false` | Rejects unknown members **and** members belonging to another event type — the second is impossible with `additionalProperties` |
| Per-type contracts | nothing | Closure happens once, at the root. Repeating it inside branches would break `unevaluatedProperties` |
| Nested objects (`basis`, `resume`, `evidence`, `limits`, `state`, `risk`, `debt`) | `additionalProperties: false` | Closed value objects; a typo in a member name must not pass silently |
| `x-*` | always permitted, any shape | The extension path, and where binding-specific data belongs |
| Profile root | `additionalProperties: false` plus `x-` | A configuration typo that silently does nothing is worse than a rejected file |
| `permissions` | open key space, closed value space | Action names are profile vocabulary; the values are not |

## 11. Versioning

Five independent axes, following the architecture note:

| Axis | Where | Rule |
|---|---|---|
| Core protocol | envelope `v` | Integer major. `v: 2` is rejected by this schema, on purpose |
| Specification | profile `spec` | Free version string |
| Profile | profile `profile_version` | Semver |
| Binding | profile `binding`, e.g. `github@0.1.0` | Semver |
| Schema | `$id` suffix, `0.1.0` | Semver |

Compatible changes, safe in a minor schema bump: new optional member on an existing type; a new value in an enumeration that only widens it; new `$defs`; documentation.

Breaking changes, requiring a major bump: a new required member; a narrowed enumeration or pattern; a removed member; a new conditional rule that rejects previously valid documents. **Making `adversarial` mandatory on `review`, done during this review, is exactly such a change** — it happened before any release, which is the only cheap moment for it.

Extension without breaking anything: use `x-`. A member that proves generally useful is promoted from `x-` to a Core optional member in a minor bump, and only becomes required in a major one.

## 12. Relation to Core, profiles and bindings

- **Core** owns the meaning: event types, causality, basis, uncertainty, leases, state, gates, invalidation. `envelope.schema.json` encodes only Core, plus fields a profile may tighten. It contains no organization, agent, repository, path, label or deployment policy.
- **Profiles** choose policy inside what Core allows, and may tighten Core but never redefine it. `profile.schema.json` validates that choice, and refuses profiles that weaken the four Core invariants in section 6.
- **Bindings** map Core onto a platform without changing meaning. Nothing binding-specific is normative here. A GitHub binding would say that `after` is a comment id and that a pull request number goes in `x-github-pr`; the schema only says `after` must be a resolvable identifier.
- **Implementations** — these files. Replaceable without touching the protocol.

## 13. How this corpus was verified

Verified locally with **ajv 8.20.0** in Draft 2020-12 mode (`strict: true`, `strictRequired: false`, `allErrors: true`), against a temporary harness that is deliberately **not** part of this repository, since validation tooling is automation and automation is out of scope for this phase.

Result at the published commit: both schemas compile; **37 of 37** valid fixtures accepted; **43 of 43** invalid fixtures rejected, each firing the keyword stated in section 9.

`strictRequired` is relaxed because ajv's heuristic flags `required` inside an `allOf` branch when the property is declared in the sibling branch — a false positive for conditional contracts, not a schema defect.

No command in this file needs a script that does not exist. Reproducing the check requires choosing a Draft 2020-12 validator; the corpus does not depend on which one.

## 14. Self-critique and open decisions

Problems found while attacking this design. Those that were fixable were fixed; the rest are recorded rather than hidden.

**Fixed during review**

1. `adversarial` was optional on `review`, so omitting it escaped the `falsified` requirement entirely. Now mandatory (section 4.4).
2. `write_surfaces.require_touches_in` was typed as a list of capabilities. It is a list of event types, and `spec` is not the capability `specify`, so the real profile failed to validate. Caught by fixture 36 — which is the argument for transcoding the real configuration instead of writing a flattering example.
3. `submit` required `pr`, a GitHub concept, in a Core schema. Replaced by `delivery` (D6).
4. `basis.base` and `authorize.scope` were strings that could not be checked as structured claims (D4, D5).

**Not fixed, and why**

5. **The envelope is large** — 27 types, roughly 1,000 lines. The common core is six members and each contract is flat, but the surface an author must know is wide. Mitigated by error precision: `unevaluatedProperties` names the offending member. Not solved.
6. **Duplication across types.** `review` and `revalidate` share `verdict`/`unverified`/basis handling; `risk` and `debt` are thin wrappers around a payload. Merging them would collapse distinctions that carry weight — the frontier between what can be automated (`validate`) and what cannot (`review`) is the clearest of them. Duplication accepted.
7. **The event-type enumeration is duplicated** in `profile.schema.json`. A cross-file `$ref` would be DRY but would force every profile consumer to resolve the envelope schema. Portability was chosen over DRY; the list must now be updated in two places, and this is the most likely thing to drift.
8. **`unevaluatedProperties: false` is rigid** and sits in tension with ACP-1 section 16 rule 3 (D8). The role separation — strict authoring, lenient reading — resolves it in principle, but an implementer who wires this schema into a reader will get it wrong. This deserves a normative sentence in ACP-1 itself.
9. **Fields an LLM will systematically get wrong**: `after` (a real platform identifier — it will be invented), `basis.sha` (40 characters — it will be truncated or hallucinated), `evidence[].id` (a real digest — it will be fabricated), `covers` (a real event range). Every one is a value that must be **read from a tool, never recalled from context.** The schema catches malformed values; it cannot catch a well-formed fabrication. This is the single largest practical risk in the whole corpus and it is not solvable at this layer.
10. **Duplicate agent ids in a profile are undetectable** unless the entries are byte-identical. Modelling `agents` as a map keyed by id would make duplicates structurally impossible; it would also diverge from the current configuration shape. Proposed for a future profile major version.
11. **`question.default_if_silent` is not checked against `options[].id`.** JSON Schema cannot cross-reference array contents.
12. **`workaround` accepts `"none"`**, so the field can be satisfied without thought. Keeping it mandatory still forces an explicit answer, which is the most a schema can do.

**Open decisions for reviewers**

- Should `risk` and `debt` be event types (as here) or entity records outside the envelope (as ACP-1 section 13 implies)? They are currently both.
- Should `v` accept a minor version, so that Core can add optional members without a schema major bump?
- Should the profile carry the schema version it was validated against, making drift detectable?
- Should `unverified` require a structured entry (`{area, why_not_verified}`) instead of free strings? More checkable, and more gameable in a different way.
