# Traceability — ACP-1.1 requirement to schema to fixture

Maps every normative requirement of **ACP-1.1** (`feat/acp-1-1-normative-amendments@1bda3e997291e337cc1a3956462e643219d71547`) to the schema construct that enforces it, the fixtures that prove it, and — where the schema cannot reach — the external check that must.

**`external` is not a gap that was overlooked. It is the honest classification.** Rows marked external are enforced by nothing in this repository today.

Schema paths are relative to `envelope.schema.json` unless prefixed `profile:`.

---

## 1. Common envelope

| Requirement | ACP-1.1 § | Schema path | Valid fixture | Invalid fixture | External semantic check |
|---|---|---|---|---|---|
| `v` present, `major.minor` string | 16.1 (A20) | `properties/v` pattern `^1\.[1-9][0-9]*$` | every envelope fixture | `34-protocol-version-unsupported` | — |
| Major mismatch fails closed | 16.2 (A8) | same pattern | — | `34` | Reader must enter read-only mode: **external** |
| Unknown field tolerated by readers | 16.2 (A8) | *not enforceable*: schema is the strict-writer side | — | `26-unknown-field` (writer view) | Reader tolerance: **external** |
| `type` in closed catalogue of 27 | 5.3 | `$defs/eventType` | all | `27-unknown-event-type` | — |
| Prohibited aliases rejected | 5.3 | same enum | — | `27` (`escalate`) | Alias intent (`decision` vs `decide`): enum covers it |
| `actor` mandatory | 8.6 (A10) | root `required` | all | `31-event-without-actor` | — |
| `actor` is declared, not authentic | 8.6 | *deliberately unenforced* | — | — | Binding compares observed vs declared: **external** |
| `on_behalf_of` does not inherit capability | 8.6 rule 5 (A22) | `properties/on_behalf_of` type only | — | — | Capability resolution: **external** |
| Exactly one of `item` / `program` | 5.2.1 (A17) | root `oneOf` | `01` (item), `28`, `40` (program) | `61-both-item-and-program`, `62-neither-item-nor-program` | — |
| Extensions only in container | 5.2.3 (A14) | `$defs/extensions` + no root `patternProperties` | `35`, `41`, `09` | `65-extension-outside-container`, `47`, `48`, `49` | — |
| Extensions cannot shadow normative fields | 5.2.3 | container makes it structural | — | — | A key deliberately mirroring a Core field: **external** |
| Flat form (no `payload`) | 5.2.2 (A23) | shape of the whole schema | all | — | Normative decision of ACP-1.1, not a schema preference |
| Field-name collision policy | 5.2.2 | *process rule* | — | — | Enforced at review time: **external** |

## 2. Causality

| Requirement | ACP-1.1 § | Schema path | Valid fixture | Invalid fixture | External |
|---|---|---|---|---|---|
| `after` required unless root | 5.4.1 (A11) | `allOf[0]` | all non-root | `44-non-root-event-without-after` | — |
| Namespaced pointer only | 5.4.1 (A21) | `$defs/causalPointer` | all | `30-after-arbitrary-text` | — |
| Pointer produced by platform | 5.4.1 | *unenforceable* | — | — | A fabricated but well-formed pointer: **external** |
| Pointer actually resolves | 5.4.1 | — | `49-after-syntactically-valid-semantically-stale` | — | `violation:dangling-pointer`: **external** |
| `after` is the last event read | 5.4.1 | — | `49` documents the boundary | — | **external** (log reader) |
| Root-eligible types only | 5.4.1 | `$defs/rootEligibleType` = `spec`,`reconcile`,`decide` | `39-spec-root-event`, `43-reconcile-root`, `40-decide-root-programme-level` | `57-risk-as-root`, `58-debt-as-root`, `59-violation-as-root` | — |
| `decide` root only when programme-scoped | 5.4.1 (L4) | `allOf[2]` | `40` | `60-decide-item-level-root` | — |
| `root` and `after` mutually exclusive | 5.4.1 | `allOf[1]` `not` | — | `46-root-declared-with-after` | — |
| One root per thread | 5.4.1 | — | — | — | `violation:duplicate-root`: **external** |
| Causal fork detection | 5.4 | — | — | — | **external** (log reader) |

## 3. Basis and freshness

| Requirement | ACP-1.1 § | Schema path | Valid fixture | Invalid fixture | External |
|---|---|---|---|---|---|
| 40-hex lowercase SHA | 6.1 (A1) | `$defs/fullSha` | `09`, `11`, `13` | `24-sha-too-short`, `25-sha-uppercase` | — |
| Basis mandatory on assertions | 6.1 | `ev.review`, `ev.validate`, `ev.approve`, `ev.authorize`, `ev.submit` | `11`, `16`, `17`, `22` | `01-review-without-basis` | — |
| `sha` mandatory inside basis | 6.1 | `$defs/basis` `required` | — | `02-review-basis-without-sha` | — |
| Branch never substitutes SHA | 6.1 | `ref` and `sha` both required | — | `02` | — |
| Portable repository reference | 6.1 (A13) | `$defs/repository` | `09` | `50-repo-binding-shorthand-in-core`, `51-repo-reference-without-system` | — |
| Structured `base` | 6.1 (A4) | `$defs/basis/properties/base` | `09` | — | — |
| `scope` when coverage is limited | 6.1 | `$defs/basis/properties/scope` | `09`, `11` | — | Whether the scope is honest: **external** |
| `environment` | 6.1 | optional in Core | `09` | — | Profile may require it: **external** |
| SHA exists / is head of ref | 6.2 | — | — | — | **external** (git) |
| Drift, TTL expiry, `SUSPECT` | 6.2 | — | — | — | **external** (clock + log) |

## 4. Write surface

| Requirement | ACP-1.1 § | Schema path | Valid fixture | Invalid fixture | External |
|---|---|---|---|---|---|
| `touches` non-empty, unique | 10.2 | `$defs/touches` | `01`, `03` | `15-claim-without-touches`, `17-claim-duplicate-touches` | — |
| Bare wildcard needs rationale | 10.2 | `ev.spec`/`ev.claim` `allOf` | `05-claim-wildcard-with-rationale` | `18-claim-wildcard-without-rationale` | — |
| Diff actually inside `touches` | 10.2 | — | — | — | **external** (git) |
| Overlap between active items | 10.2 | — | — | — | **external** (log reader) |

## 5. Lease

| Requirement | ACP-1.1 § | Schema path | Valid fixture | Invalid fixture | External |
|---|---|---|---|---|---|
| `claim` requires lease, touches, intent | 5.3 | `ev.claim` `required` | `03` | `15`, `16-claim-invalid-lease` | — |
| Duration grammar `h`/`d`/`w` | 16.3 (A9) | `$defs/duration` | `03` | `16` | — |
| `heartbeat` references its claim | 5.3 (A18) | `ev.heartbeat` `required` | `06-heartbeat`, `47`, `48` | `63-heartbeat-without-claim` | — |
| `release` references its claim | 5.3 (A18) | `ev.release` `required` | `08-release-lease` | `64-release-without-claim` | — |
| Preemption declared explicitly | 10.1 | `dependentRequired` | `04-claim-preemption` | `19-claim-preempts-without-declaration` | — |
| Lease actually expired | 10.1 | — | — | — | **external** (platform clock) |
| Two live claims / split brain | 10.3 C1 | — | — | — | **external** (log reader) |

## 6. Assurance

| Requirement | ACP-1.1 § | Schema path | Valid fixture | Invalid fixture | External |
|---|---|---|---|---|---|
| `review` requires basis, verdict, adversarial, unverified | 5.3 | `ev.review` | `11`, `12`, `13` | `01`, `43-review-without-adversarial-declaration`, `05-submit-without-unverified` | — |
| Adversarial requires `falsified` | 8.3 | `ev.review` `allOf[0]` | `13` | `03-review-adversarial-without-falsified` | — |
| Non-approve requires `would_change_my_mind` | 8.3 | `ev.review` `allOf[1]` | `12` | `04` | — |
| `unverified` key mandatory, `[]` allowed | 5.3 (A19) | `$defs/uncertaintyDeclaration` `minItems: 0` | `42-review-unverified-empty` | `05` | Honesty of the declaration: **external** |
| `submit` needs evidence or a stated reason | 5.3 | `ev.submit` `allOf` | `09`, `10` | `06-submit-empty-evidence-without-reason` | — |
| Evidence carries `cmd` and `env` | 12.3 | `$defs/evidenceReference` | `09` | — | Artifact exists, digest matches: **external** |
| Review independence | 8.2 | *unenforceable* | — | — | **external**; also `profile:review/independence_guaranteed` |
| `validate` requires check, result, basis | 5.3 | `ev.validate` | `16` | — | — |
| Gate computation vs consent | 5.3 | `ev.validate` vs `ev.approve` | `16`, `17` | — | Gate satisfaction across events: **external** |

## 7. Revalidation

| Requirement | ACP-1.1 § | Schema path | Valid fixture | Invalid fixture | External |
|---|---|---|---|---|---|
| Own event type | 6.3 (A3) | `$defs/eventType` | `14`, `15` | — | — |
| `old_basis` + `new_basis` + `scope_diff` | 6.3 | `ev.revalidate` `required` | `14` | `22-revalidate-without-old-basis`, `55-revalidate-without-new-basis` | — |
| `scope_diff.paths` non-empty | 6.3 (M3) | `minItems: 1` | `14` | `56-revalidate-empty-scope-diff-paths` | — |
| Inside-scope diff must name what was rechecked | 6.3 | `scope_diff` `allOf` | `15-revalidate-partial` | `23` | — |
| Only the original author may revalidate | 6.3 | — | — | — | **external**; `profile:invalidation/revalidate_same_actor_only` |
| Does not reset the TTL | 6.3 | — | — | — | **external**; `profile:invalidation/revalidate_resets_ttl: false` |
| Diff genuinely outside reviewed scope | 6.3 | — | — | — | **external** (git) |

## 8. Authority and silence

| Requirement | ACP-1.1 § | Schema path | Valid fixture | Invalid fixture | External |
|---|---|---|---|---|---|
| `authorize` needs target, scope, basis, limits, expires | 13.5 | `ev.authorize` `required` | `22` | `10`, `11`, `12` | — |
| Concrete action, structured scope | 13.5 (A5) | `$defs/authorizationScope` | `22` | — | — |
| Limits non-empty | 13.5 | `minProperties: 1` | `22` | `13-authorize-with-empty-limits` | — |
| `authorize` cannot carry a silent default | 13.5 | `ev.authorize` `not` | — | `14-authorize-with-default-if-silent` | — |
| Authorization bound to a SHA | 13.5 | `basis` required | `22` | `12` | Whether the deployed artifact is that SHA: **external** |
| Authorization freshness / revocation | 6.2 R5 | — | `23-revoke` | — | **external** (log + clock) |
| `question` needs options, default, expiry | 13.6 | `ev.question` `required` | `18` | `07`, `08` | — |
| `kind: authorization` ⇒ default `deny` | 13.6 | `ev.question` `allOf` | `19` | `09-question-default-authorizes-deploy` | — |
| Disguised authorization question | 13.6 | **not enforceable** | — | — | **external**; `profile:silence/never_default_actions` |
| `default_if_silent` names a real option | 13.6 | **not enforceable** | — | — | **external** (no cross-references in JSON Schema) |
| Option ids unique | — (M2) | **not enforceable** | `50-question-duplicate-option-ids` documents it | — | **external**. See README §6 |
| `assume` from timeout cites its question | 13.6 | `ev.assume` `allOf` | `21` | `54-assume-timeout-without-source-question` | — |

## 9. Identifiers and time

| Requirement | ACP-1.1 § | Schema path | Valid fixture | Invalid fixture | External |
|---|---|---|---|---|---|
| Core work item id is a generic token | 4.2 (A12) | `$defs/workItemId` | `47-item-lowercase-prefix`, `48-item-uuid-like`, `38` | — | — |
| Profile pattern `RF-*` | 4.2 | `profile:ids/work_item_pattern` | `36-profile-reformando` | `52-profile-invalid-work-item-regex` | Applying it to envelopes: **external** |
| Reserved historical ids `R1`,`R2`,`R2.1` | 4.2 | `profile:ids/reserved` | `36` | — | **external**. Core accepts `R2.1` (fixture `38`) |
| Risk/debt/decision ids generic in Core | — (L3) | `$defs/entityId` | `26`, `27`, `28` | — | Prefix policy: `profile:ids/*_prefix` |
| Authored durations only, no absolute instants | 16.3 (A9) | `$defs/duration` | `03`, `18`, `22` | `29-expires-absolute-timestamp` | — |
| Observed timestamps from the platform | 16.3 | *absent by design* | — | — | **external** (binding) |

## 10. Profile

| Requirement | ACP-1.1 § | Schema path | Valid fixture | Invalid fixture | External |
|---|---|---|---|---|---|
| `acp` as `major.minor` | 16.1 | `profile:acp` | `36`, `37` | — | — |
| Capabilities = event types + `veto` | 8.1 (A7) | `profile:$defs/capability` | `36`, `37` | `36-profile-unknown-capability` | — |
| `approve_gates` instead of `approve:<gate>` | 8.1 | `profile:roles/*/approve_gates` | `36` | — | Gates exist: **external** (M4) |
| Permissions default deny | 8.4 | `profile:permissions/default` | `36`, `37` | — | — |
| Contradictory permission (expanded form) | 8.4 | `profile:$defs/permissionObject` | `36` | `38-profile-contradictory-permission`, `39-profile-irreversible-allowed` | Shorthand contradictions: **not expressible** |
| Self-review forbidden | 8.2 | `profile:review/self_review` const | `36` | `41-profile-self-review-permitted` | — |
| Stale never satisfies a gate | 6.2 | `profile:invalidation/stale_counts_for_gates` const | `36` | `40-profile-stale-counts-for-gates` | — |
| Silence never authorizes | 13.6 | `profile:silence/never_default` `contains` | `36` | `42-profile-silence-can-authorize` | — |
| `never_default_actions` vocabulary | 13.6 (A15) | `profile:$defs/authorizationAction` | `36` | `53-profile-unknown-never-default-action` | Classifying a question into it: **external** |
| Identity trust level declared | 8.6 | `profile:identity/trust_level` | `36` (level 1) | — | Whether the level is true: **external** |
| Automation needs an implementation | — | `profile:automation` `allOf` | `36` (disabled) | `37-profile-automation-without-implementation` | — |
| Profile extensions in container | 5.2.3 (L1) | `profile:extensions` | `36`, `37` | `66`, `67`, `68` | — |
| Agents unique by id | — | `uniqueItems` (exact duplicates only) | — | `35-profile-duplicate-agent` | Same id, different body: **external** (M4) |
| Referential integrity (roles, owners, gates) | — | **not enforceable** | — | — | **external** — full list in README §7 |

## 11. Catalogue parity

| Requirement | ACP-1.1 § | Schema path | Valid fixture | Invalid fixture | External |
|---|---|---|---|---|---|
| One closed catalogue of 27 | 5.3 | `$defs/eventType` | all | `27` | — |
| Profile capabilities from the same set | 8.1 (A7) | `profile:$defs/capability` | `36` | `36-profile-unknown-capability` | — |
| Digest identical in both schemas | 5.3 (A16) | `$comment` in both | — | — | Comparing the two digest strings: **manual, two seconds** |

---

## Coverage summary

| | Count |
|---|---|
| Requirements traced | 78 |
| Enforced by the schema | 52 |
| Requiring an external check | 26 |
| Requirements with at least one valid fixture | 51 |
| Requirements with at least one invalid fixture | 44 |

**Twenty-six of seventy-eight requirements are not enforced by anything in this repository.** They need a semantic validator with access to the log, the repository, the platform clock and the active profile. That component does not exist. A green validation run says nothing about any of them.
