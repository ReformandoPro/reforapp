# ACP schemas — formal contract for the event envelope and the profile

> ## Status: **ACP-1 amendment candidate**
>
> These schemas are **not** a conforming implementation of ACP-1 as published. They encode sixteen normative amendments (**A1–A16**) that have **not** been approved. Until they are:
>
> - a document valid here may be **invalid** under ACP-1 as written — every SHA in ACP-1's own examples is one of them;
> - a document valid under ACP-1 as written may be **rejected** here.
>
> Section 3 states each amendment, its cost, and whether it blocks adoption. `feat/acp-1-protocol` has **not** been modified.

| | |
|---|---|
| JSON Schema dialect | **Draft 2020-12** |
| Envelope | `envelope.schema.json`, `$id: urn:acp:schema:envelope:0.2.0` |
| Profile | `profile.schema.json`, `$id: urn:acp:schema:profile:0.2.0` |
| Layer | Implementation |
| Semantics | ACP Core only, plus fields a profile may tighten |
| Executable code shipped | **None** |
| Supersedes | schema 0.1.0 at commit `682e936` |

---

## 1. Purpose

| Question | Answered by |
|---|---|
| Is this ACP event well formed? | `envelope.schema.json` |
| Which fields are mandatory? | section 5.3 |
| Which fields depend on the event type? | the `if/then` chain on `type` |
| Which combinations are forbidden? | `unevaluatedProperties`, `not`, `dependentRequired`, `const` |
| Which invariants are checkable syntactically? | section 7A |
| Which need semantic validation afterwards? | section 7B — **read this one** |
| Is this programme configuration coherent? | `profile.schema.json` |

A document that satisfies these schemas is **well formed**. It is not thereby true, authorized, fresh, attributable, or consistent with the log.

## 2. Layer separation

The single rule: **Core may not contain anything one platform or one organization invented.**

| Concern | Lives in | Examples |
|---|---|---|
| **Core** | `envelope.schema.json` | event types, causality, basis, uncertainty, leases, composite state, gates, invalidation |
| **Profile** | `profile.schema.json` | identifier policy, roles, capabilities, permissions, gate composition, TTLs, silence policy, write surfaces |
| **Binding** | neither file, normatively | that `after` is a comment id; that a repository is `owner/name`; that a delivery is a pull request |
| **Implementation** | these files | replaceable without touching the protocol |

Four leaks were found in 0.1.0 and closed in 0.2.0 (A12, A13, A6 and the `x-` grammar A14). The test applied: *would this field still make sense on GitLab, on a mailing list, or in a filesystem-backed log?* If not, it is not Core.

## 3. Required normative amendments before adoption

Sixteen. Each states ACP-1's current text, what the schema does, the proposal, compatibility, and whether it blocks adoption. **"Blocks" means the schema and the specification cannot both be normative until it is resolved.**

### A1 — Full SHA (was D1) · **BLOCKS**

- **ACP-1 §21:** `sha_prefix ≥10 hex`.
- **Schema:** `^[0-9a-f]{40}$`.
- **Proposal:** require the full 40-character lowercase SHA on every basis.
- **Compatibility:** **breaking.** Every SHA in ACP-1's examples is 10 characters and becomes invalid; §5.2, §6.1, §11.2, §11.3 and Appendix A all need editing.
- **Rationale:** a prefix can become ambiguous as history grows. An anchor that can become ambiguous cannot support invalidation, which is the mechanism the whole protocol rests on.

### A2 — `risk` and `debt` are event types (was D2) · **BLOCKS**

- **ACP-1 §5.3:** catalogue of 24, declared "cerrado". §13.2, §13.3 and Appendix A use `risk` and `debt` as events.
- **Schema:** 26 types (adds both).
- **Proposal:** amend §5.3 to include them, or amend Appendix A to stop using them. **The specification currently contradicts itself and one of the two must change.**
- **Compatibility:** additive if §5.3 is amended.

### A3 — `revalidate` as its own type (was D3) · **BLOCKS**

- **ACP-1 §6.3:** revalidation is a `review` carrying `revalidates` and `diff_outside_scope`. §7.4 and `AGENTS.md` §5 call it an event.
- **Schema:** distinct `revalidate` type requiring `old_basis`, `new_basis`, `scope_diff`.
- **Proposal:** promote to a type; total 27.
- **Compatibility:** additive to the catalogue; breaking for anyone who wrote the §6.3 form.
- **Rationale:** as a review field, nothing forces the three parts to appear together, and a revalidation missing the old basis asserts nothing.

### A4 — Structured `basis.base` (was D4) · **BLOCKS**

- **ACP-1 §6.1:** `base: main@a71c0e94`.
- **Schema:** `base: { ref, sha }`.
- **Compatibility:** breaking, mechanical.
- **Rationale:** the halves obey different rules; a single string cannot be validated as a pair.

### A5 — Structured `authorize.scope` (was D5) · **BLOCKS**

- **ACP-1 §13.5:** `scope: deploy:staging`.
- **Schema:** `{ action, environment?, resource? }` with a closed action enumeration.
- **Compatibility:** breaking, mechanical.
- **Rationale:** "must declare the concrete action authorized" is unenforceable against free text.

### A6 — `pr` leaves Core (was D6) · **BLOCKS**

- **ACP-1 §21:** `submit` requires `pr`.
- **Schema:** optional `delivery: { kind, id }`; a pull request number goes in `x-github-pr`.
- **Compatibility:** breaking (a required field is removed).
- **Rationale:** `pr` is one platform's noun inside the universal grammar. This was the clearest layer violation in 0.1.0.

### A7 — `specify` versus `spec` (was D7) · does not block

- **ACP-1:** capability `specify`, event type `spec`, never contrasted.
- **Schema:** both, in separate `$defs`, each documenting the other.
- **Compatibility:** documentation only.
- **Rationale:** confusing them silently disables `write_surfaces.require_touches_in` — which happened while writing 0.1.0 and was caught only because the fixture is the real `acp.yml`.

### A8 — Strict authoring, lenient reading (was D8) · **BLOCKS**

- **ACP-1 §16 rule 3:** an unknown member is ignored and never invalidates an event.
- **Schema:** root `unevaluatedProperties: false` rejects unknown members.
- **Proposal:** state in ACP-1 that the two apply to **different roles**: an *author* must produce documents valid against the current schema; a *reader* must not reject a `v: 1` event carrying a member added by a later minor version.
- **Compatibility:** clarifying, but it blocks: without it, an implementer who wires this schema into a reader violates §16 and will drop valid events.

### A9 — One time model (was D9) · does not block

- **ACP-1:** relative durations in envelopes, absolute dates in decision records.
- **Schema:** envelopes relative only; `timestamp` exists but is inadmissible for `expires`, `lease`, `ttl`.
- **Compatibility:** clarifying.
- **Rationale:** invariant I4 — the authoritative clock belongs to the platform.

### A10 — Actor model A: `actor` mandatory · **BLOCKS**

- **ACP-1 §21:** `actor` optional, "se deriva de la cuenta".
- **Schema:** `actor` **required on every event**.
- **Proposal:** **model A.** The envelope carries the *claimed* logical identity; the binding compares it with the identity the platform observed and raises `violation:unauthorized` on mismatch. Model B (identity only in the external record) was rejected: ACP-1 §8 and `profile.schema.json` both address actors by logical id, so under B every capability check would need a binding lookup, and the log would stop being self-describing when read outside its platform.
- **Compatibility:** breaking (new required field).
- **Honest limit:** a declared identity is a *claim*. It buys auditability, not authenticity. Under trust level 1 or 2 (`profile.identity.trust_level`) the claim is unverifiable and the schema cannot say so.

### A11 — Causal root model · **BLOCKS**

- **ACP-1 §5.4, §21:** `after` "required in profile ≥ ACP-2"; root events undefined.
- **Schema:** `after` is **required unless** the event declares `root: true`; `root` is permitted only on `spec`, `decide`, `reconcile`, `risk`, `debt`, `violation`; declaring both `root` and `after` is rejected.
- **Proposal, in four parts:**
  1. **Root-eligible types:** the event that creates a work item, plus programme-level events belonging to no item thread.
  2. **Types that must carry `after`:** every other one. All work-item state mutations — `claim`, `submit`, `review`, `validate`, `approve`, `close` and the rest — **cannot omit it**, silently or otherwise.
  3. **Who generates the identifier:** the **platform**, never the author (I4). The author reads it and copies it.
  4. **How a root is represented:** explicitly, with `root: true`. Not by absence. Under ACP silence never carries meaning, and "no `after`" would otherwise be indistinguishable from "forgot the `after`".
- **Compatibility:** breaking (conditional required field).

### A12 — Identifier policy leaves Core · **BLOCKS**

- **ACP-1 §4.2 / schema 0.1.0:** Core pattern `^[A-Z][A-Z0-9]{0,7}-I?[1-9][0-9]{0,8}$`.
- **Schema 0.2.0:** Core requires only a stable, bounded, printable, whitespace-free token (1–64 chars). Prefix, pattern and reserved list move to `profile.ids` (`work_item_prefix`, `work_item_pattern`, `reserved`).
- **Compatibility:** widening for Core, tightening for profiles.
- **Cost, stated plainly:** the envelope schema alone **now accepts `R2.1`**, which the Reformando programme forbids. Fixture `valid/38` records exactly that. Rejecting it requires a second pass against the active profile. That check moved from syntax to semantics, and pretending otherwise would have meant keeping one organization's naming inside a universal Core.

### A13 — Portable repository reference · **BLOCKS**

- **Schema 0.1.0:** `repo` was `owner/name`.
- **Schema 0.2.0:** `repo: { system, id }`, where `id` is an opaque identifier or URI the binding resolves.
- **Compatibility:** breaking, mechanical.
- **Rationale:** `owner/name` is GitHub's convention. Encoding it in Core makes every other binding second-class. The profile **may** keep the native form, because a profile names its binding.

### A14 — Extension key grammar · does not block

- **Schema 0.1.0:** `^x-`, so `x-` alone and `x-Weird_Thing` were legal.
- **Schema 0.2.0:** `^x-[a-z0-9][a-z0-9-]*$`. `X-foo`, `x-`, `x_foo` are rejected.
- **Compatibility:** tightening; nothing in existence relied on the loose form.

### A15 — Actions that may never be a default · does not block

- **New:** `profile.silence.never_default_actions`.
- **Rationale:** see section 8. The envelope can only refuse a silent default on a question **explicitly** typed `kind: authorization`. This list gives a semantic validator the vocabulary to catch the disguised case.
- **Compatibility:** additive and optional.

### A16 — Catalogue parity (conformance requirement C1) · does not block

- **Problem:** the event-type enumeration exists in both schemas.
- **Decision:** **deliberate duplication with an enforced conformance requirement**, not a cross-file `$ref`. A `$ref` would force every consumer of the profile schema to resolve and register the envelope schema; profile documents are routinely validated alone.
- **The requirement:** both files carry an identical `catalogue-digest` in the `$comment` of `$defs/eventType` — the sha256 of the comma-joined sorted type list. At 0.2.0 it is `sha256:046f7cadad317948c7a92a808bade47bbbdf61bdb467ce26a49891da730e0e91`. **A release in which the two digests differ is non-conforming and must not be adopted.** Comparing two 64-character strings is a glance; diffing two 27-item lists is not. Drift stops being a "known risk" and becomes a check a human can run in two seconds without any tooling.

### Adoption summary

| Blocks adoption | Does not block |
|---|---|
| A1, A2, A3, A4, A5, A6, A8, A10, A11, A12, A13 | A7, A9, A14, A15, A16 |

**Eleven of sixteen block.** This schema cannot be adopted as ACP-1 conformant; ACP-1 must be amended first, or the schema must be relaxed. That is the honest state, and it is why the status banner says amendment candidate.

## 4. Envelope shape: flat versus common-metadata-plus-payload

Required comparison. **Decision: keep the flat form.** Not by inertia — the alternative was specified and evaluated.

```jsonc
// flat (chosen)                    // payload (rejected)
{ "v":1, "type":"claim",            { "v":1, "type":"claim",
  "item":"RF-142",                    "item":"RF-142",
  "actor":"claude",                   "actor":"claude",
  "after":2451889301,                 "after":2451889301,
  "lease":"6h",                       "payload": {
  "touches":["db/**"],                  "lease":"6h",
  "intent":"..." }                      "touches":["db/**"],
                                        "intent":"..." } }
```

| Criterion | Flat | Payload | Verdict |
|---|---|---|---|
| **Size** | 6 common members + type members, one level | one extra level, one extra member | Flat, marginally |
| **LLM readability** | matches ACP-1's authored YAML blocks exactly | authors must decide per field which level it belongs to | **Flat.** The wire format is hand-authored YAML; each nesting level is an indentation error waiting to happen |
| **Field isolation** | achieved by `unevaluatedProperties` at the root — `verdict` on a `heartbeat` is rejected (fixture `invalid/28`) | achieved structurally | **Tie.** This was the strongest argument for payload and it turns out flat already has the property |
| **Evolution** | a new common member widens the root | a new common member is visibly outside the payload | Payload, slightly |
| **JSON Schema complexity** | one `unevaluatedProperties` at the root | `unevaluatedProperties` inside each of 27 branches, plus a root one | **Flat.** Payload roughly doubles the closure surface |
| **ACP-1 compatibility** | identical to every example in the specification | a seventeenth amendment, touching every example and both other proposals | **Flat, decisively** |

**What is not claimed:** that flat produces fewer LLM authoring errors. No experiment was run; asserting it would be exactly the kind of unfalsifiable claim this protocol exists to prevent. The argument above is structural, not empirical. **The experiment that would settle it:** generate N envelopes of each shape from the same prompts and count schema violations by category. Until someone runs it, treat the readability row as reasoning, not evidence.

## 5. The envelope contract

### 5.1 Common members

```
v        integer, const 1     protocol major version                REQUIRED
type     enum (27)            discriminator                          REQUIRED
actor    actorId              claimed logical identity (A10)         REQUIRED
item     workItemId           opaque stable token (A12)              most types
after    causalPointer        platform-assigned predecessor (A11)    unless root
root     const true           declares a thread start (A11)          root-eligible types only
role     roleId                                                      optional
x-…      ^x-[a-z0-9][a-z0-9-]*$   extension namespace (A14)          always allowed
```

### 5.2 Event types (27)

`answer` · `approve` · `assume` · `authorize` · `block` · `checkpoint` · `claim` · `close` · `debt`\* · `decide` · `handoff` · `heartbeat` · `progress` · `question` · `reconcile` · `release` · `revalidate`\* · `review` · `revoke` · `risk`\* · `spec` · `submit` · `supersede` · `triage` · `unblock` · `validate` · `violation`

\* amendment candidates A2, A3. Root-eligible: `spec`, `decide`, `reconcile`, `risk`, `debt`, `violation`.

### 5.3 Required members per type

Beyond `v`, `type`, `actor`, and `after`-unless-`root`:

| Type | Required |
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
| `authorize` | `target`, `scope`, `basis`, `limits`, `expires` |
| `revoke` | `target`, `reason` |
| `block` | `item`, `on`, `kind`, `unblock_when`, `escalate_after`, `workaround` |
| `unblock` | `item`, `target`, `how` |
| `question` | `item`, `to`, `question`, `options`, `default_if_silent`, `expires` |
| `answer` | `target`, `answer` |
| `assume` | `item`, `premise`, `verify_by`, `risk_if_wrong` |
| `decide` | `decision`, `version`, `scope` |
| `risk` / `debt` | the corresponding object |
| `checkpoint` | `item`, `covers`, `state`, `resume`, `open`, `gates` |
| `reconcile` | `fixed` |
| `violation` | `rule`, `target`, `severity`, `effect` |
| `supersede` | `item`, `by`, `reason` |
| `close` | `item`, `resolution` |

### 5.4 Conditional rules

| Condition | Consequence |
|---|---|
| no `root` | `after` required |
| `root: true` | `after` forbidden; `type` must be root-eligible |
| `review.adversarial = true` | `falsified` required |
| `review.verdict` ≠ `approve` | `would_change_my_mind` required |
| `submit.evidence` empty | `no_evidence_reason` required |
| `claim.preempts` present | `preempt_declaration` required with both flags `true` |
| `touches` contains a bare wildcard | `touches_rationale` required |
| `question.kind = authorization` | `default_if_silent` must be exactly `deny` |
| `authorize` | `default_if_silent` / `default_rationale` forbidden |
| `revalidate.scope_diff.outside_scope = false` | `revalidated_parts` required |
| `assume.authority = default-on-timeout` | `source_question` required |
| `close.resolution` ∈ {`superseded`,`rotated`} | `into` required |
| any assertion | `basis.sha`, 40 lowercase hex |

Two notes kept from 0.1.0: **`adversarial` is mandatory on every review** (optional, it could simply be omitted to escape `falsified`; mandatory, evasion becomes a signed false statement the profile contradicts), and **`unverified` has no minimum entry length** (a threshold is satisfied by padding and converts a substantive obligation into a formatting one).

## 6. The profile contract

Covers versions, programme, repos, ids, agents, roles, capabilities, permissions, gates, leases, invalidation, review, silence, write surfaces, limits, reconcile, automation, `x-`.

**Capabilities** are protocol authority (closed enumeration; `veto` and `approve:<gate>` included). **Permissions** are platform effects: `default` accepts `deny`; each action may be `authorization`, `forbidden`, `allowed`, a list of roles, or an expanded object. Only the expanded object can express — and therefore be checked for — a contradiction:

```json
{ "force_push": { "mode": "forbidden", "roles": ["engineer"] } }   // rejected
{ "delete_data": { "mode": "allowed", "irreversible": true } }     // rejected
```

The flat shorthands cannot express a contradiction, so they cannot be checked for one. A profile wanting machine-audited permissions should use the object form.

Four Core invariants a profile may not weaken: `review.self_review = forbidden`; `invalidation.stale_counts_for_gates = false`; `silence.never_default` must contain `authorize`; `automation.enabled = true` requires `implementation`.

`identity.trust_level` (1 self-declared … 5 organization-managed) is optional but recommended, and is the field that keeps A10 honest: a profile claiming separation of powers at trust level 2 is overstating its guarantees.

## 7. What the schemas can and cannot validate

### 7A. Syntactic — enforced

Formats (`fullSha`, `digest`, `duration`, URN, causal pointer, extension keys); required members per type; enumerations; forbidden combinations; per-type field isolation; presence of a SHA on every assertion; presence of a claimed actor; presence of a causal predecessor or an explicit root declaration; non-empty duplicate-free `touches`; protocol major version; internal contradictions in expanded permission entries; well-formedness of a profile's identifier regex.

### 7B. Semantic — NOT enforced

| Invariant | Why unreachable | Needs |
|---|---|---|
| `after` is really the last event read | requires the log | log reader |
| Two events share an `after` (causal fork) | requires siblings | log reader |
| A `root: true` event really is the first of its thread | requires the log | log reader |
| `actor` matches the account that posted (**A10's whole point**) | requires platform identity | binding |
| A lease has expired | requires platform timestamps | binding + clock |
| `basis.sha` exists and is head of `basis.ref` | requires the repository | git |
| `basis.repo.id` resolves to a real repository | opaque by design | binding |
| The diff falls inside `touches` | requires the diff | git |
| The work item id satisfies the profile (**A12's cost**) | Core carries no naming policy | profile-aware pass |
| A review is independent of the submission | cross-event comparison | log reader |
| An `adversarial: false` claim is honest | requires the profile | profile cross-check |
| Evidence exists and its digest matches | requires the artifact | artifact store |
| An authorization is still fresh and unrevoked | later events + clock | log reader |
| A question is *really* an authorization despite its declared kind | judgement | semantic validator, section 8 |
| `question.default_if_silent` names a real option id | no cross-references in JSON Schema | log reader |
| An event does not contradict earlier events | requires the whole log | log reader |
| A checkpoint omits no material evidence | judgement | human |
| `unblock_when` is genuinely verifiable | it is a string | human |
| `accept` criteria are genuinely executable | they are strings | human |
| `unverified` entries are truthful and material | judgement | adversarial reviewer |
| Two profile agents share an `id` but differ | `uniqueItems` compares whole items | profile linter |

No regular expression approximates any of these. A regex that half-checks a distributed invariant produces confident wrong answers.

## 8. Silent defaults: exactly what is protected

**The envelope schema does not block all sensitive defaults. It blocks one case.**

| Case | Blocked? | By what |
|---|---|---|
| `question` with `kind: authorization` and a default other than `deny` | **Yes** | `const: "deny"` (fixture `invalid/09`) |
| `authorize` carrying `default_if_silent` | **Yes** | explicit `not` (fixture `invalid/14`) |
| `question` requesting a deploy while declaring `kind: decision` | **No** | nothing syntactic distinguishes it |
| `question` whose innocuous-looking option triggers an irreversible action | **No** | requires knowing what the option does |

The third row is the dangerous one, and it is well formed. `profile.silence.never_default_actions` (A15) exists so a semantic validator — or a human reading a short list — can catch it: any question whose default resolves to one of those actions must be treated as `kind: authorization` regardless of what it declares.

**Do not state, in any adoption document, that the envelope schema prevents silence from authorizing sensitive action.** It prevents it for questions that have already been classified correctly. Classification is semantic.

## 9. Fixtures

**Convention.** A filename containing `profile` is validated against `profile.schema.json`; everything else against `envelope.schema.json`. Numbered for stable ordering. No `$comment` inside fixtures: an unknown member would contaminate the reason a negative fixture fails. Reasons live in the table below.

### 9.1 Valid (41) — all must be accepted

`01-spec-minimal` · `02-triage` · `03-claim` · `04-claim-preemption` · `05-claim-wildcard-with-rationale` · `06-heartbeat` · `07-progress` · `08-release-lease` · `09-submit-with-unverified` · `10-submit-no-evidence-with-reason` · `11-review-approve` · `12-review-changes-with-would-change-my-mind` · `13-review-adversarial-falsified` · `14-revalidate-outside-scope` · `15-revalidate-partial` · `16-validate` · `17-approve-gate` · `18-question-with-default-and-expiry` · `19-question-authorization-default-deny` · `20-answer` · `21-assume-after-expiry` · `22-authorize` · `23-revoke` · `24-block` · `25-unblock` · `26-risk` · `27-debt` · `28-decide` · `29-handoff-complete` · `30-checkpoint-complete` · `31-reconcile-causal-fork` · `32-violation` · `33-supersede` · `34-close-done` · `35-envelope-with-extension` · `36-profile-reformando` · `37-profile-minimal-generic` · `38-item-core-accepts-any-stable-token` · `39-spec-root-event` · `40-decide-root-programme-level` · `41-extension-keys-strict-grammar`

Three deserve comment:

- **`36-profile-reformando`** is `acp/acp.yml` from `feat/acp-1-protocol@0b714a9a`, transcoded to JSON **without a single edit**, and left untouched in 0.2.0 on purpose: the real configuration must keep validating as new policy keys are added, or those keys are not optional in practice. It caught the `specify`/`spec` confusion in 0.1.0.
- **`38-item-core-accepts-any-stable-token`** is the former `invalid/31`. Under A12, Core accepts `R2.1`. Its reclassification **is** the documentation of what A12 costs.
- **`39` and `40`** are the two root shapes: an item-creating `spec` and a programme-level `decide`.

### 9.2 Invalid (53) — all must be rejected, each by the stated keyword

A fixture failing for a *different* reason is a defect in the corpus, not a passing test.

| Fixture | Rule broken | Keyword |
|---|---|---|
| `01-review-without-basis` | an assertion needs an anchor | `required` |
| `02-review-basis-without-sha` | a basis without a SHA cannot be invalidated | `required` |
| `03-review-adversarial-without-falsified` | must state what was attacked | `required` |
| `04-review-changes-without-would-change-my-mind` | a non-approving verdict needs an exit condition | `required` |
| `05-submit-without-unverified` | ignorance must be declared | `required` |
| `06-submit-empty-evidence-without-reason` | absent evidence only as an explicit statement | `required` |
| `07-question-without-default` | silence must have a defined meaning | `required` |
| `08-question-without-expires` | a question without a clock stalls the system | `required` |
| `09-question-default-authorizes-deploy` | silence never authorizes (declared case) | `const` |
| `10-authorize-without-expires` | an authorization must die | `required` |
| `11-authorize-without-limits` | must bound the worst case | `required` |
| `12-authorize-without-basis` | an artifact is authorized, not an intention | `required` |
| `13-authorize-with-empty-limits` | `limits: {}` is a blank cheque | `minProperties` |
| `14-authorize-with-default-if-silent` | silence never authorizes | `not` |
| `15-claim-without-touches` | overlap detection needs a surface | `required` |
| `16-claim-invalid-lease` | `"6 hours"` is not a duration | `pattern` |
| `17-claim-duplicate-touches` | a surface is a set | `uniqueItems` |
| `18-claim-wildcard-without-rationale` | claiming everything must be justified | `required` |
| `19-claim-preempts-without-declaration` | taking over needs two explicit statements | `dependentRequired` |
| `20-handoff-without-next-action` | an incomplete handoff does not release the lease | `required` |
| `21-checkpoint-without-resume` | does not bound recovery | `required` |
| `22-revalidate-without-old-basis` | nothing to compare against | `required` |
| `23-revalidate-partial-without-revalidated-parts` | must say what was revalidated | `required` |
| `24-sha-too-short` | 10-hex prefix, as in ACP-1's own examples (A1) | `pattern` |
| `25-sha-uppercase` | canonical form is lowercase | `pattern` |
| `26-unknown-field` | unknown member outside the extension namespace | `unevaluatedProperties` |
| `27-unknown-event-type` | the catalogue is closed | `enum` |
| `28-field-from-another-event-type` | `verdict` on a `heartbeat` | `unevaluatedProperties` |
| `29-expires-absolute-timestamp` | deadlines are relative (A9) | `pattern` |
| `30-after-arbitrary-text` | a causal pointer must resolve mechanically | `oneOf` |
| `31-event-without-actor` | **A10**: every authored event claims an identity | `required` |
| `32-unverified-empty` | an empty declaration is not a declaration | `minItems` |
| `33-close-rotated-without-into` | rotation must name its continuation | `required` |
| `34-protocol-version-unsupported` | `v: 2` — reject, do not guess | `const` |
| `35-profile-duplicate-agent` | identical agent entries | `uniqueItems` |
| `36-profile-unknown-capability` | `deploy` is a permission, not a capability | `oneOf` |
| `37-profile-automation-without-implementation` | no machine action without an accountable component | `required` |
| `38-profile-contradictory-permission` | forbidden and granted at once | `not` |
| `39-profile-irreversible-allowed` | irreversible cannot be freely allowed | `enum` |
| `40-profile-stale-counts-for-gates` | stale evidence must not satisfy a gate | `const` |
| `41-profile-self-review-permitted` | no self-approval | `const` |
| `42-profile-silence-can-authorize` | `never_default` must contain `authorize` | `contains` |
| `43-review-without-adversarial-declaration` | the adversarial stance must be stated | `required` |
| `44-non-root-event-without-after` | **A11**: a mutation cannot omit its predecessor | `required` |
| `45-root-flag-on-non-root-eligible-type` | **A11**: a `claim` cannot begin a thread | `enum` |
| `46-root-declared-with-after` | **A11**: root and predecessor are exclusive | `not` |
| `47-extension-key-uppercase` | **A14**: `X-github-pr` is not an extension | `unevaluatedProperties` |
| `48-extension-key-empty-namespace` | **A14**: `x-` names nothing | `unevaluatedProperties` |
| `49-extension-key-underscore` | **A14**: `x_github_pr` is not an extension | `unevaluatedProperties` |
| `50-repo-binding-shorthand-in-core` | **A13**: `owner/name` is binding vocabulary | `type` |
| `51-repo-reference-without-system` | **A13**: a reference must name its system | `required` |
| `52-profile-invalid-work-item-regex` | **A12**: `^[A-Z` is not a regular expression | `format` |
| `53-profile-unknown-never-default-action` | **A15**: unknown action name | `enum` |

## 10. `additionalProperties` policy

| Level | Setting | Reason |
|---|---|---|
| Envelope root | `unevaluatedProperties: false` | rejects unknown members **and** members of another event type |
| Per-type contracts | nothing | closure happens once, at the root; repeating it would break `unevaluatedProperties` |
| Nested value objects | `additionalProperties: false` | a typo in a member name must not pass silently |
| `x-[a-z0-9][a-z0-9-]*` | any value | the extension path |
| Profile root | `additionalProperties: false` plus `x-` | a configuration typo that silently does nothing is worse than a rejected file |
| `permissions` | open keys, closed values | action names are profile vocabulary; their values are not |

## 11. Versioning

| Axis | Where | Rule |
|---|---|---|
| Core protocol | envelope `v` | integer major; `v: 2` rejected on purpose |
| Specification | profile `spec` | free string |
| Profile | profile `profile_version` | semver |
| Binding | profile `binding`, e.g. `github@0.1.0` | semver |
| Schema | `$id` suffix — now **0.2.0** | semver |

**Extending without breaking:** use `x-`. A member that proves generally useful is promoted from `x-` to a Core optional member in a minor bump, and becomes required only in a major one.

**0.1.0 → 0.2.0 is a breaking schema change** (A10, A11, A12, A13, A14 all reject documents 0.1.0 accepted, or vice versa). It happens before any release, which is the only cheap moment.

## 12. How this corpus was verified

**ajv 8.20.0**, Draft 2020-12 (`strict: true`, `strictRequired: false`, `allErrors: true`), against a temporary harness **deliberately not committed** — validation tooling is automation, and automation is out of scope for this phase.

At the published commit: both schemas compile; all `$ref` resolve, none external; **41 of 41** valid fixtures accepted; **53 of 53** invalid fixtures rejected, each firing the keyword in section 9.2; no duplicate keys in any of the 96 JSON files; `git diff --check` clean.

`strictRequired` is relaxed because ajv flags `required` inside an `allOf` branch when the property is declared in a sibling branch — a false positive for conditional contracts.

No instruction here depends on a script that does not exist. Reproducing the check requires choosing a Draft 2020-12 validator; the corpus does not depend on which.

## 13. Remaining risks

1. **Fields an LLM will systematically get wrong**: `after`, `basis.sha`, `evidence[].id`, `covers`. Every one must be **read from a tool, never recalled from context**. The schema catches malformed values; it cannot catch a well-formed fabrication. Unchanged from 0.1.0 and still the largest practical risk in the corpus.
2. **A10 buys auditability, not authenticity.** At trust level 1 or 2 a claimed actor is unverifiable.
3. **A12 moved a real check out of the schema.** Work item naming is now unenforceable without a profile-aware pass, and no such pass exists.
4. **Catalogue parity depends on discipline**, now with a two-second check (A16) instead of none. Better, not automatic.
5. **Eleven amendments block adoption.** Nothing here can be called ACP-1 conformant until ACP-1 changes.
6. **`chore/agent-protocol-mvp` moved to `95d62235`** during this work, adding an *ACP envelope schema review matrix* that has **not** been read. It may state requirements this version does not meet.
7. **The flat-versus-payload decision rests on structural argument, not measurement** (section 4).
8. **Duplicate agent ids** remain undetectable unless entries are byte-identical; modelling `agents` as a map keyed by id is proposed for a future profile major.
9. **`workaround` still accepts `"none"`**; mandatory presence is the most a schema can do.

## 14. Open decisions for reviewers

- Should `risk` and `debt` be event types (as here) or entity records outside the envelope (as ACP-1 §13 implies)? They are currently both.
- Should `v` accept a minor version, so Core can add optional members without a schema major bump?
- Should the profile record the schema version it was validated against, making drift detectable?
- Should `unverified` require structured entries (`{area, why_not_verified}`)? More checkable, gameable in a different way.
- Should `root: true` also be required on the *first* `checkpoint` of a rotated item, which begins a new thread while continuing an old one?
