# Traceability — ACP-1.1 requirement to schema to fixture

Maps every normative requirement of **ACP-1.1** (`feat/acp-1-1-normative-amendments@983c3a4aeb4a5dc758cbc4a92a7343eaf83a7bad`) to the schema construct that enforces it, the fixtures that prove it, and — where the schema cannot reach — the external check that must.

### Source identity

| | |
|---|---|
| ACP-1.1 audited source head | `983c3a4aeb4a5dc758cbc4a92a7343eaf83a7bad` (`feat/acp-1-1-normative-amendments`) |
| Integrated by | PR **#151** |
| Merge commit into `main` | `9ee046e8bb645ae364cc38ef95875487d5060b3b` — second parent `983c3a4a…`, first parent `fbaa2f75…`, the five ACP-1.1 blobs identical to the audited head |
| Status | **reconciled / integrated — not adopted.** ACP-1.1 remains an amendment candidate; being merged into `main` records where the tree lives, not that it was approved |
| Superseded reference | `1bda3e99…` — the head this document cited before, an ancestor of the audited head by two commits. **No longer the canonical source** |

The two SHAs answer different questions and neither replaces the other: `983c3a4a…` is the normative identity of what was audited; `9ee046e8…` is the proof of where it was integrated.

---

**`external` is not a gap that was overlooked. It is the honest classification.** Rows marked external are enforced by nothing in this repository today.

Schema paths are relative to `envelope.schema.json` unless prefixed `profile:`.

---

## 1. Common envelope

| Requirement | ACP-1.1 § | Schema path | Valid fixture | Invalid fixture | External semantic check |
|---|---|---|---|---|---|
| `v` present, exactly `"1.1"` in a conforming writer | 16.1 (A20), 16.2 | `properties/v` `const "1.1"` | every envelope fixture | `34`, `82`, `83`, `84`, `85` | Tolerant reading of a later minor: **external** (Reader Compatibility Layer) |
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

---

## 12. Requisitos añadidos tras la revisión independiente

Hermes confirmó que estas reglas normativas no estaban trazadas. Se añaden con su fixture.

| Requirement | ACP-1.1 § | Schema path | Valid fixture | Invalid fixture | External check |
|---|---|---|---|---|---|
| `delivery.kind` es el enum normativo de la spec | 6.1 (A6) | `ev.submit/delivery/kind` | `09` (pull-request), `51`, `52`, `53` | `78`, `79`, `80`, `81` | — |
| `violation.rule` admite los 23 códigos de §15.1 | 15.1 | `ev.violation/rule` | `32`, `46`, `54`–`61` | `91-violation-unknown-rule` | — |
| Un checkpoint puede ser de item o de programa, con exactamente uno de los dos | **11.3.1**, 5.2.1 | `ev.checkpoint` + root `oneOf` | `30` (item), `62` (programa) | `86-checkpoint-item-and-program` | — |
| Un checkpoint de item lleva `state` y `gates`; uno de programa no | **11.3.1** | `ev.checkpoint/allOf[0]` | `30`, `62` | `87-item-checkpoint-without-state` | — |
| `from`/`to` describen el rango de migración y solo son admisibles en un checkpoint de programa, siempre en pareja | **11.3.1**, 16.4 | `ev.checkpoint` `from`,`to` + `dependentRequired` | `62` | `88`, `89`, `90` | Que `from` y `to` no sean iguales: **external** |
| `v` es exactamente `"1.1"` en un escritor conforme | 16.1, 16.2 | `properties/v` `const` | todas | `34`, `82`, `83`, `84`, `85` | Tolerancia de lector: **external** |
| Los alias prohibidos se rechazan por el enum de `type` | 5.3 | `$defs/eventType` | — | `69`–`77` | — |
| `reconcile` puede ser raíz de item o de programa | 5.4.1 | `$defs/rootEligibleType` + root `oneOf` | `43` (item), `63` (programa) | — | Que realmente inicie un hilo: **external** |
| Idempotencia por `(type, item, actor, basis.sha, after)` | 5.5 | — | — | — | **external** (lector del log) |
| Direccionamiento por URN de entidades | 4.1 | `$defs/urn` | `22`, `24` | — | Que la URN resuelva: **external** |
| Modificadores de estado con su gramática | 7.3 | `$defs/modifier` | `30` | — | Que el modificador corresponda al estado real: **external** |
| Registro de riesgo con `signal` y estado | 13.2 | `$defs/risk` | `26`, `44` | `57` | Que el riesgo se revise: **external** |
| Registro de deuda con `authorized_by` y `payoff_trigger` | 13.3 | `$defs/debt` | `27`, `45` | `58` | Que el firmante tenga autoridad: **external** |
| Registro de bloqueo con condición verificable y escalado | 13.4 | `ev.block` | `24` | — | Que `unblock_when` sea verificable: **external** |
| Enlaces bidireccionales sin extremos colgantes | 12.1 | — | — | — | **external** (`violation:dangling-link`) |
| Un lector falla cerrado ante un tipo desconocido | 16.2 | `$defs/eventType` (lado escritor) | — | `27` | Conducta del lector: **external** |
| Deriva de proyección detectada en la reconciliación | 15.3 | — | — | — | **external** (motor de proyección) |
| Ids de opción únicos y `default_if_silent` resoluble | 13.6 | **ninguno** | `50` documenta el hueco | — | **external** (validador semántico) |

## 13. Registro de requisitos external

Cada fila external deja de ser una etiqueta. Responsable, entradas, salida, comportamiento ante fallo y efecto sobre gates.

| Invariante external | Responsable | Inputs | Output esperado | Comportamiento de fallo | ¿Bloquea gates? |
|---|---|---|---|---|---|
| `actor` declarado ↔ observado | binding | evento + identidad de plataforma + perfil | coincide / no coincide / indeterminado | `violation:identity-mismatch`, efecto `void` | **sí**: sin él no hay independencia |
| `on_behalf_of` no escala privilegios | resolutor de capacidades | evento + perfil | capacidades de `actor` únicamente | rechazo del evento | **sí** |
| `after` es el último evento leído | lector del log | log del hilo | confirmado / obsoleto | marca informativa | no |
| Bifurcación causal | lector del log | log del hilo | `contested` | bloquear avance de fase | **sí** |
| Una sola raíz por hilo | lector del log | log del hilo | conforme / duplicada | `violation:duplicate-root` | **sí** |
| El puntero causal resuelve | lector del log | log + puntero | resuelve / colgante | `violation:dangling-pointer`, efecto **`flag`** | no |
| Idempotencia | lector del log | log | conjunto deduplicado | descartar el duplicado | no |
| El SHA existe y es head | git | basis + repositorio | existe / obsoleto / inalcanzable | afirmación `STALE` o no verificable | **sí** |
| El diff cae dentro de `touches` | git | diff + `touches` | dentro / fuera | `violation:scope-creep` | no |
| Caducidad de lease | motor de leases | log + reloj de plataforma | vivo / caducado | devolver el item a `READY` | **sí** para `claim` |
| Solo el autor original revalida | lector del log | log | conforme / no conforme | descartar la revalidación | **sí** |
| Revalidar no reinicia el TTL | lector del log + reloj | log + `review_ttl` | fresco / caducado | excluir del gate | **sí** |
| Existencia y digest de la evidencia | verificador de artefactos | evidencia + almacén | verificada / no recuperable | degradar a `reproducible: false` | **sí** en riesgo alto |
| Frescura y revocación de autorizaciones | evaluador de autorización | log + reloj | vigente / muerta | denegar la acción | **sí** |
| Pregunta que es una autorización disfrazada | validador semántico | evento + `never_default_actions` | reclasificación o violación | fallar cerrado | **sí** |
| Ids de opción únicos y default resoluble | validador semántico | evento | conforme / ambiguo | **fallar cerrado; `default_if_silent` no se aplica y el vencimiento escala** | **sí** |
| Independencia de revisión | lector del log + identidad | log + perfil | satisfecha / indeterminada | `INCONCLUSIVE`, nunca satisfecha | **sí** |
| Identificador de work item conforme al perfil | pasada perfil-consciente | evento + perfil | conforme / reservado | `violation:reserved-id` | no |
| Integridad referencial del perfil | profile linter | perfil | 0 referencias rotas | bloquear adopción del perfil | **sí** |
| Determinismo y deriva de proyección | motor de proyección | log + perfil + instante | proyección canónica + digest | marcar obsoleta, exigir `reconcile` | **sí** para estado sensible |
| Enlaces bidireccionales | coordinador | log + entidades | 0 extremos colgantes | `violation:dangling-link` | no |
| Conducta del lector ante tipo desconocido | lector | evento | fallar cerrado para ese evento | no contarlo para ningún gate | **sí** |
| Honestidad de `unverified`, `falsified`, `env` | revisor adversarial | evento | juicio | `INCONCLUSIVE` | **sí** de facto |
| **Tolerancia del lector a campos desconocidos** de un minor posterior (§16.2) | **Reader Compatibility Layer** | evento con `v` de un minor posterior + versión soportada por el lector | evento aceptado con los miembros desconocidos **preservados**, o rechazo explícito por versión | Si el lector los descarta en silencio, pierde datos válidos y produce una proyección incompleta que parece completa | no directamente; **sí de forma indirecta**: un gate evaluado sobre una proyección con datos perdidos es un gate evaluado sobre menos de lo que había. El writer schema **no puede** cubrirlo: es `const "1.1"` por diseño |
| **Shadowing de extensiones**: una clave de `extensions` que duplica un campo normativo (§5.2.3) | **Event-Log Semantic Validator** | evento + catálogo de campos normativos de su tipo | conforme, o `violation:shadowed-field` | Fallar cerrado para ese evento: un campo normativo eludido por una extensión hace que el evento afirme algo distinto de lo que parece | **sí**: el evento no cuenta para ningún gate hasta resolverse |
| **`from == to` en un checkpoint de programa** (§11.3.1, §16.4) | **Event-Log Semantic Validator** | checkpoint de programa con `from` y `to` | rango válido, o rechazo | Un rango nulo no describe migración alguna; el checkpoint anuncia una transición que no ocurre. El schema comprueba la **gramática** de ambos y su presencia en pareja, no que **difieran** | **sí** para cualquier gate que dependa de la transición anunciada |

## Coverage summary

Recalculado desde las tablas de este fichero tras la revisión independiente. **Las cifras anteriores (78 / 52 / 26) eran incorrectas**; el error se propagó al README y a dos informes de entrega, y es el motivo por el que ninguna cifra publicada debe copiarse a mano.

| | Antes (incorrecto) | Recalculado |
|---|---|---|
| Filas-requisito trazadas | 78 | **113** |
| Exigidas por el schema | 52 | **60** |
| Requieren comprobación external | 26 | **53** |
| Con al menos una fixture válida | no publicado | **78** |
| Con al menos una fixture inválida | no publicado | **63** |

**53 de 113 requisitos no los exige nada en este repositorio.** Necesitan un validador semántico con acceso al log, al repositorio, al reloj de plataforma y al perfil activo. Ese componente no existe. Una ejecución en verde no dice nada sobre ninguno de ellos, y el registro de §13 nombra quién debería.
