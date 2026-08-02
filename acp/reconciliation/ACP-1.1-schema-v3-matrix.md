# ACP-1.1 ↔ Schema V3 — matriz de reconciliación bidireccional

Reconciliación mecánica entre la especificación normativa y su implementación ejecutable. **No es una revisión independiente**: quien la escribe es quien escribió ambos artefactos. Su propósito es preparar una revisión adversarial incremental de Hermes, no sustituirla.

| | |
|---|---|
| Especificación (normativa) | `feat/acp-1-1-normative-amendments@1bda3e997291e337cc1a3956462e643219d71547` |
| Schema (ejecutable) | `feat/acp-envelope-schema@ae3e4f5e35924e470ad909d63d5a9de55c351df0` |
| `origin/main` en el momento de la reconciliación | `48049b05a88c423f305f32bc70e66f4451f008a1` |
| merge-base de ambas ramas | `cbc335d52e2cb826cc55bf44e63b47291a3e498b` |
| Fuente normativa principal | `acp/ACP-1.md` @ ACP-1.1 |
| Fuentes auxiliares | `AGENTS.md`, `acp.yml`, `CHANGELOG.md`, `decisions/ACP-1.1-amendments.md` |
| **No** normativos | todo `docs/agents/**` (arquitectura y criterios de revisión) |

**Regla aplicada en toda la tabla:** `IMPLEMENTED` exige regla real **y** fixture discriminante. No se marca `IMPLEMENTED` porque `TRACEABILITY.md` lo diga.

## Recuento

| Estado | Requisitos | Qué significa |
|---|---|---|
| `IMPLEMENTED` | **76** | Regla en el schema + fixture que la discrimina |
| `PARTIAL` | **25** | La regla existe pero le falta algo concreto, indicado en Notes |
| `EXTERNAL` | **32** | Fuera del alcance de JSON Schema, con responsable asignado |
| `CONFLICT` | **2** | Contradicción literal entre spec y schema |
| `AMBIGUOUS` | **1** | La spec no decide |
| `MISSING` | **0** | Sin schema, sin fixture y sin external |
| **Total** | **136** | |

Los 136 requisitos de esta matriz **no** son los mismos 78 que declara `TRACEABILITY.md`: esa cifra es incorrecta y la auditoría está en `ACP-1.1-schema-v3-findings.md` (F-09).

---

## Matriz

### A. Envelope común

| Requirement ID | ACP-1.1 § | Normative text | Schema path | Profile path | Valid fixture | Invalid fixture | External check | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| ACP11-REQ-001 | 5.2.1 | `v` obligatorio, cadena mayor.menor | properties/v | — | todas | 34 | — | IMPLEMENTED |  |
| ACP11-REQ-002 | 16.1 | `v: 1` entero deja de ser válido | properties/v pattern | — | — | 34 | — | IMPLEMENTED |  |
| ACP11-REQ-003 | 16.2 | Mayor distinto ⇒ fallar cerrado | properties/v pattern `^1\.[1-9][0-9]*$` | — | — | 34 | lector: modo solo lectura | PARTIAL | El schema rechaza otro mayor, pero no puede imponer el modo solo lectura del lector |
| ACP11-REQ-004 | 16.2 | Un `1.x` posterior no debe rechazarse de plano | properties/v pattern acepta x≥1 | — | — | — | lector tolerante | AMBIGUOUS | Ver hallazgo F-06: la spec no dice si un validador 1.1 debe aceptar documentos 1.2 |
| ACP11-REQ-005 | 5.2.1 | `type` obligatorio, catálogo cerrado de 27 | $defs/eventType | $defs/eventType | todas | 27 | — | IMPLEMENTED | Catálogo idéntico en 7 artefactos, verificado |
| ACP11-REQ-006 | 5.3 | Alias prohibidos no conformes | $defs/eventType enum | — | — | 27 | — | IMPLEMENTED | 0 alias presentes en ningún artefacto, verificado |
| ACP11-REQ-007 | 5.3 | Un perfil restringe tipos, no los añade | $defs/eventType cerrado | $defs/capability | 36 | 36-profile-unknown-capability | — | IMPLEMENTED |  |
| ACP11-REQ-008 | 8.6 | `actor` obligatorio en todo evento | required[actor] | — | todas | 31 | — | IMPLEMENTED |  |
| ACP11-REQ-009 | 8.6 | `actor` es identidad declarada, no auténtica | descripción, sin regla | identity/trust_level | 36 | — | binding: comparar observed vs declared | EXTERNAL | Responsable: GitHub Binding |
| ACP11-REQ-010 | 8.6 | `observed_actor` nunca va en el envelope authored | ausencia deliberada | — | — | — | binding | EXTERNAL | Ausencia correcta: no hay campo que lo permita |
| ACP11-REQ-011 | 8.6 | `on_behalf_of` no hereda capacidades | properties/on_behalf_of (solo tipo) | — | — | — | resolutor de capacidades | EXTERNAL | Sin fixture: no hay nada sintáctico que probar |
| ACP11-REQ-012 | 5.2.1 | Exactamente uno de `item` o `program` | oneOf raíz | — | 01,28,40 | 61,62 | — | IMPLEMENTED |  |
| ACP11-REQ-013 | 5.2.1 | Ni ninguno ni ambos ⇒ violation:unscoped-event | oneOf raíz | — | — | 61,62 | — | PARTIAL | La regla se aplica; el CÓDIGO de violación no es emitible: ver F-01 |
| ACP11-REQ-014 | 5.2.3 | Extensiones solo en contenedor `extensions` | $defs/extensions + sin patternProperties raíz | properties/extensions | 41,09 | 65 | — | IMPLEMENTED |  |
| ACP11-REQ-015 | 5.2.3 | Gramática `^x-[a-z0-9][a-z0-9-]*$` | $defs/extensions propertyNames | properties/extensions propertyNames | 41 | 47,48,49,66,67,68 | — | IMPLEMENTED |  |
| ACP11-REQ-016 | 5.2.3 | Valor de extensión: cualquier JSON | $defs/extensions sin restricción de valor | — | 41 | — | — | IMPLEMENTED |  |
| ACP11-REQ-017 | 5.2.3 | Una extensión no sustituye un campo normativo | contenedor lo hace estructural | — | — | — | revisor / linter | EXTERNAL | `violation:shadowed-field` no es emitible: F-01 |
| ACP11-REQ-018 | 5.2.3 | Un lector tolerante preserva `extensions` | fuera de alcance del schema | — | — | — | lector | EXTERNAL |  |
| ACP11-REQ-019 | 5.2.2 | Forma plana normativa | forma del schema | — | todas | — | — | IMPLEMENTED | Decisión de la spec, no del schema; README §4.5 lo dice |
| ACP11-REQ-020 | 5.2.2 | Un nombre de campo tiene un solo significado | política de proceso | — | — | — | revisión humana | EXTERNAL |  |
| ACP11-REQ-021 | 16.2 | Campo desconocido: aceptar e ignorar (lector) | unevaluatedProperties:false = lado escritor | — | — | 26 | lector | PARTIAL | Tensión declarada en README §13.7; el schema no sirve como lector |
| ACP11-REQ-022 | 16.2 | Tipo desconocido: fallar cerrado | $defs/eventType | — | — | 27 | — | IMPLEMENTED |  |

### B. Causalidad

| Requirement ID | ACP-1.1 § | Normative text | Schema path | Profile path | Valid fixture | Invalid fixture | External check | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| ACP11-REQ-023 | 5.4.1 | `after` obligatorio salvo raíz | allOf[0] | — | todas no-raíz | 44 | — | IMPLEMENTED |  |
| ACP11-REQ-024 | 5.4.1 | Puntero namespaced `<binding>-<clase>:<id>` | $defs/causalPointer | — | todas | 30 | — | IMPLEMENTED | Entero pelado eliminado |
| ACP11-REQ-025 | 5.4.1 | El puntero lo genera la plataforma | no verificable | — | — | — | binding | EXTERNAL | Riesgo principal: un puntero inventado bien formado |
| ACP11-REQ-026 | 5.4.1 | Raíz explícita con `root: true` | properties/root const true | — | 39,43,40 | — | — | IMPLEMENTED |  |
| ACP11-REQ-027 | 5.4.1 | Raíz solo en spec, reconcile, decide | $defs/rootEligibleType | — | 39,43,40 | 45,57,58,59 | — | IMPLEMENTED |  |
| ACP11-REQ-028 | 5.4.1 | `decide` raíz solo con `program` | allOf[2] | — | 40 | 60 | — | IMPLEMENTED |  |
| ACP11-REQ-029 | 5.4.1 | risk, debt, violation NO pueden ser raíz | $defs/rootEligibleType | — | 44,45,46 | 57,58,59 | — | IMPLEMENTED |  |
| ACP11-REQ-030 | 5.4.1 | `root` y `after` mutuamente excluyentes | allOf[1] not | — | — | 46 | — | IMPLEMENTED |  |
| ACP11-REQ-031 | 5.4.1 | Una sola raíz por hilo | — | — | — | — | lector del log | EXTERNAL | `violation:duplicate-root` no emitible: F-01 |
| ACP11-REQ-032 | 5.4.1 | Puntero inexistente ⇒ flag, no void | — | — | 49 | — | lector del log | EXTERNAL | `violation:dangling-pointer` no emitible: F-01 |
| ACP11-REQ-033 | 5.4 | Bifurcación causal ⇒ contested | — | — | 31-reconcile | — | lector del log | EXTERNAL |  |
| ACP11-REQ-034 | 5.4.1 | Binding sin punteros estables no es conforme | — | — | — | — | binding | EXTERNAL | Ninguna declaración de perfil lo captura hoy |
| ACP11-REQ-035 | 5.5 | Idempotencia por (type,item,actor,basis.sha,after) | — | — | — | — | lector del log | EXTERNAL |  |

### C. Basis y evidencia

| Requirement ID | ACP-1.1 § | Normative text | Schema path | Profile path | Valid fixture | Invalid fixture | External check | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| ACP11-REQ-036 | 6.1 | SHA de 40 hex minúsculas | $defs/fullSha | review/require_full_sha | 09,11 | 24,25 | — | IMPLEMENTED |  |
| ACP11-REQ-037 | 6.1 | Basis obligatorio en review/revalidate/validate/approve/authorize/submit | required por tipo | — | 09,11,16,17,22 | 01,12 | — | IMPLEMENTED |  |
| ACP11-REQ-038 | 6.1 | `sha` obligatorio dentro del basis | $defs/basis required | — | — | 02 | — | IMPLEMENTED |  |
| ACP11-REQ-039 | 6.1 | Una rama nunca sustituye a un SHA | required[ref,sha] | — | — | 02 | — | IMPLEMENTED |  |
| ACP11-REQ-040 | 6.1 | Repositorio portable {system,id} | $defs/repository | — | 09 | 50,51 | — | IMPLEMENTED |  |
| ACP11-REQ-041 | 6.1 | `base` estructurada {ref,sha} | $defs/basis/base | — | 09 | — | — | PARTIAL | Sin fixture negativa para la forma `main@sha` |
| ACP11-REQ-042 | 6.1 | `scope` cuando la cobertura es limitada | $defs/basis/scope | — | 09,11 | — | juicio | PARTIAL | «cuando la cobertura es limitada» no es decidible sintácticamente |
| ACP11-REQ-043 | 6.1 | `environment` opcional en Core | $defs/basis/environment | — | 09 | — | perfil | IMPLEMENTED |  |
| ACP11-REQ-044 | 6.1 | `delivery` {kind,id}; `pr` fuera de Core | $defs/ev.submit/delivery | — | 09 | — | — | IMPLEMENTED | L2: vocabulario genérico |
| ACP11-REQ-045 | 6.2 | El SHA existe y es head de la rama | — | — | — | — | git | EXTERNAL |  |
| ACP11-REQ-046 | 6.2 | Deriva de base, TTL, SUSPECT | — | invalidation/* | 36 | — | reloj + log | EXTERNAL |  |
| ACP11-REQ-047 | 12.3 | Evidencia = digest + comando + entorno | $defs/evidenceReference required[cmd,env,result] | — | 09 | — | almacén de artefactos | PARTIAL | **`id` (digest) NO es obligatorio**: F-02 |

### D. Superficie de escritura

| Requirement ID | ACP-1.1 § | Normative text | Schema path | Profile path | Valid fixture | Invalid fixture | External check | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| ACP11-REQ-048 | 10.2 | `touches` no vacío y sin duplicados | $defs/touches | write_surfaces | 01,03 | 15,17 | — | IMPLEMENTED |  |
| ACP11-REQ-049 | 10.2 | Comodín desnudo exige justificación | ev.spec/ev.claim allOf | — | 05 | 18 | — | IMPLEMENTED |  |
| ACP11-REQ-050 | 10.2 | `touches` obligatorio en spec y claim | required por tipo | write_surfaces/require_touches_in | 01,03 | 15 | — | IMPLEMENTED |  |
| ACP11-REQ-051 | 10.2 | El diff cae dentro de `touches` | — | — | — | — | git | EXTERNAL |  |
| ACP11-REQ-052 | 10.3 | Solape entre items activos | — | — | — | — | lector del log | EXTERNAL |  |

### E. Lease

| Requirement ID | ACP-1.1 § | Normative text | Schema path | Profile path | Valid fixture | Invalid fixture | External check | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| ACP11-REQ-053 | 5.3 | `claim` exige lease, touches, intent | ev.claim required | — | 03 | 15,16 | — | IMPLEMENTED |  |
| ACP11-REQ-054 | 16.3 | Duración `h`/`d`/`w` | $defs/duration | lease/* | 03 | 16 | — | IMPLEMENTED |  |
| ACP11-REQ-055 | 5.3 | `heartbeat` referencia su claim | ev.heartbeat required[claim] | lease/require_claim_reference | 06,47,48 | 63 | — | IMPLEMENTED |  |
| ACP11-REQ-056 | 5.3 | `release` referencia su claim | ev.release required[claim] | lease/require_claim_reference | 08 | 64 | — | IMPLEMENTED |  |
| ACP11-REQ-057 | 10.1 | Preempción con declaración explícita | dependentRequired | lease/preempt_requires | 04 | 19 | — | IMPLEMENTED |  |
| ACP11-REQ-058 | 10.1 | El lease ha caducado de verdad | — | — | — | — | motor de leases | EXTERNAL |  |
| ACP11-REQ-059 | 10.3 | Dos claims vivos / split brain | — | — | — | — | motor de leases | EXTERNAL |  |
| ACP11-REQ-060 | 5.3 | `progress` exige done y remaining | ev.progress required | — | 07 | — | — | PARTIAL | Sin fixture negativa |

### F. Aseguramiento

| Requirement ID | ACP-1.1 § | Normative text | Schema path | Profile path | Valid fixture | Invalid fixture | External check | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| ACP11-REQ-061 | 5.3 | `review` exige basis, verdict, adversarial, unverified | ev.review required | review/* | 11,12,13 | 01,43,05 | — | IMPLEMENTED |  |
| ACP11-REQ-062 | 8.3 | Adversarial ⇒ `falsified` | ev.review allOf[0] | review/require_falsified_if_adversarial | 13 | 03 | — | IMPLEMENTED |  |
| ACP11-REQ-063 | 8.3 | No-approve ⇒ `would_change_my_mind` | ev.review allOf[1] | review/require_would_change_my_mind_if_not_approve | 12 | 04 | — | IMPLEMENTED |  |
| ACP11-REQ-064 | 5.3 | `unverified` presente; `[]` admisible | $defs/uncertaintyDeclaration minItems 0 | review/allow_empty_unverified | 42 | 05 | — | IMPLEMENTED |  |
| ACP11-REQ-065 | 5.3 | `submit` exige basis, touches, evidence, unverified | ev.submit required | — | 09,10 | 05,06 | — | IMPLEMENTED |  |
| ACP11-REQ-066 | 5.3 | Evidencia ausente solo con razón explícita | ev.submit allOf | — | 10 | 06 | — | IMPLEMENTED |  |
| ACP11-REQ-067 | 8.2 | Nadie revisa lo que entregó | — | review/self_review const forbidden | 36 | 41 | lector del log + identidad | EXTERNAL | Solo comprobable desde trust_level 3 |
| ACP11-REQ-068 | 5.3 | `validate` exige check, result, basis | ev.validate required | — | 16 | — | — | PARTIAL | Sin fixture negativa |
| ACP11-REQ-069 | 5.3 | `approve` exige gate, basis, ttl | ev.approve required | roles/*/approve_gates | 17 | — | — | PARTIAL | Sin fixture negativa |
| ACP11-REQ-070 | 5.3 | `approve` computa vs `validate` consiente | dos ramas distintas | — | 16,17 | — | evaluador de gates | EXTERNAL | La distinción es semántica |
| ACP11-REQ-071 | 8.4 | Satisfacción de un gate entre eventos | — | gates/* | 36 | — | evaluador de gates | EXTERNAL |  |
| ACP11-REQ-072 | 5.3 | `violation` exige rule, target, severity, effect | ev.violation required | — | 32,46 | — | — | PARTIAL | Sin fixture negativa; además F-01 |
| ACP11-REQ-073 | 15.1 | 23 códigos de violación normativos | ev.violation/rule enum = 15 | — | 32 | — | — | CONFLICT | **F-01: 8 códigos de ACP-1.1 no son emitibles** |

### G. Revalidación

| Requirement ID | ACP-1.1 § | Normative text | Schema path | Profile path | Valid fixture | Invalid fixture | External check | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| ACP11-REQ-074 | 6.3 | Tipo propio | $defs/eventType | — | 14,15 | — | — | IMPLEMENTED |  |
| ACP11-REQ-075 | 6.3 | old_basis + new_basis + scope_diff | ev.revalidate required | — | 14 | 22,55 | — | IMPLEMENTED |  |
| ACP11-REQ-076 | 6.3 | `scope_diff.paths` no vacío | minItems 1 | — | 14 | 56 | — | IMPLEMENTED | M3 cerrado |
| ACP11-REQ-077 | 6.3 | outside_scope=false ⇒ revalidated_parts | scope_diff allOf | — | 15 | 23 | — | IMPLEMENTED |  |
| ACP11-REQ-078 | 6.3 | Solo el autor original puede revalidar | — | invalidation/revalidate_same_actor_only | 36 | — | lector del log | EXTERNAL |  |
| ACP11-REQ-079 | 6.3 | No reinicia el TTL | — | invalidation/revalidate_resets_ttl const false | 36 | — | reloj + log | EXTERNAL |  |
| ACP11-REQ-080 | 6.3 | El diff está de verdad fuera del ámbito | — | — | — | — | git | EXTERNAL |  |

### H. Autoridad y silencio

| Requirement ID | ACP-1.1 § | Normative text | Schema path | Profile path | Valid fixture | Invalid fixture | External check | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| ACP11-REQ-081 | 13.5 | `authorize` exige target, scope, basis, limits, expires | ev.authorize required | — | 22 | 10,11,12 | — | IMPLEMENTED |  |
| ACP11-REQ-082 | 13.5 | Acción concreta estructurada | $defs/authorizationScope | $defs/authorizationAction | 22 | — | — | PARTIAL | El enum de acciones es invención del schema: la spec no lo enumera (F-05) |
| ACP11-REQ-083 | 13.5 | `limits` no vacío | minProperties 1 | — | 22 | 13 | — | IMPLEMENTED |  |
| ACP11-REQ-084 | 13.5 | `authorize` no puede llevar default | ev.authorize not | silence/never_default | 22 | 14 | — | IMPLEMENTED |  |
| ACP11-REQ-085 | 13.5 | Autorización atada a un SHA | required[basis] | invalidation/authorization_ttl | 22 | 12 | binding | IMPLEMENTED |  |
| ACP11-REQ-086 | 13.5 | Una autorización no se puede inferir | — | — | — | — | evaluador de autorización | EXTERNAL |  |
| ACP11-REQ-087 | 13.5 | Frescura y revocación | — | invalidation/on_revoke | 23 | — | evaluador de autorización | EXTERNAL |  |
| ACP11-REQ-088 | 5.3 | `revoke` exige target y reason | ev.revoke required | — | 23 | — | — | PARTIAL | Sin fixture negativa |
| ACP11-REQ-089 | 13.6 | `question` exige options, default, expires | ev.question required | silence/* | 18 | 07,08 | — | IMPLEMENTED |  |
| ACP11-REQ-090 | 13.6 | kind=authorization ⇒ default `deny` | ev.question allOf | — | 19 | 09 | — | IMPLEMENTED |  |
| ACP11-REQ-091 | 13.6 | El silencio nunca autoriza acciones sensibles | parcial (solo kind declarado) | silence/never_default_actions | 19 | 09 | validador semántico | PARTIAL | README §8 lo declara explícitamente; el caso disfrazado no se detecta |
| ACP11-REQ-092 | 13.6 | `default_if_silent` nombra una opción real | — | — | — | — | validador semántico | EXTERNAL |  |
| ACP11-REQ-093 | 13.6 | IDs de opción únicos | **ninguna**; ni `uniqueItems` | — | 50 (documenta el hueco) | — | validador semántico | PARTIAL | M2 diferido. Ver recomendación F-03 |
| ACP11-REQ-094 | 13.6 | `assume` por timeout cita su pregunta | ev.assume allOf | — | 21 | 54 | — | IMPLEMENTED |  |
| ACP11-REQ-095 | 5.3 | `answer` exige target y answer | ev.answer required | — | 20 | — | — | PARTIAL | Sin fixture negativa |
| ACP11-REQ-096 | 5.3 | `decide` exige decision, version, scope | ev.decide required | — | 28,40 | 60 | — | IMPLEMENTED |  |

### I. Coordinación y ciclo de vida

| Requirement ID | ACP-1.1 § | Normative text | Schema path | Profile path | Valid fixture | Invalid fixture | External check | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| ACP11-REQ-097 | 5.3 | `block` exige on, kind, unblock_when, escalate_after, workaround | ev.block required | — | 24 | — | — | PARTIAL | Sin fixture negativa pese a tener 5 campos obligatorios |
| ACP11-REQ-098 | 5.3 | `unblock` exige target y how | ev.unblock required | — | 25 | — | — | PARTIAL | Sin fixture negativa |
| ACP11-REQ-099 | 5.3 | `handoff` exige to, resume, releases_lease | ev.handoff required | — | 29 | 20 | — | IMPLEMENTED |  |
| ACP11-REQ-100 | 11.2 | `resume` con done, remaining, traps, next_action | $defs/resume required | limits/resume_tokens | 29 | 20 | — | IMPLEMENTED |  |
| ACP11-REQ-101 | 5.3 | `checkpoint` exige covers, state, resume, open, gates | ev.checkpoint required | limits/checkpoint | 30 | 21 | — | IMPLEMENTED |  |
| ACP11-REQ-102 | 11.3 | Un checkpoint no sustituye al log | — | — | 30 | — | motor de proyección | EXTERNAL |  |
| ACP11-REQ-103 | 5.3 | `reconcile` exige fixed | ev.reconcile required | reconcile/* | 31,43 | — | — | PARTIAL | Sin fixture negativa |
| ACP11-REQ-104 | 5.3 | `risk` exige el objeto risk con signal | $defs/risk required | ids/risk_prefix | 26,44 | 57 | — | IMPLEMENTED |  |
| ACP11-REQ-105 | 5.3 | `debt` exige authorized_by y payoff_trigger | $defs/debt required | limits/debt | 27,45 | 58 | — | IMPLEMENTED |  |
| ACP11-REQ-106 | 13.3 | Deuda no autorizada es violación | required[authorized_by] | limits/debt/require_authorization | 27 | — | evaluador de autoridad | PARTIAL | El campo existe; que el firmante tenga autoridad es externo |
| ACP11-REQ-107 | 5.3 | `triage` exige priority e initiative | ev.triage required | — | 02 | — | — | PARTIAL | Sin fixture negativa |
| ACP11-REQ-108 | 5.3 | `supersede` exige by y reason | ev.supersede required | — | 33 | — | — | PARTIAL | Sin fixture negativa |
| ACP11-REQ-109 | 5.3 | `close` exige resolution; rotated/superseded ⇒ into | ev.close required + allOf | — | 34 | 33 | — | IMPLEMENTED |  |
| ACP11-REQ-110 | 5.3 | `spec` exige accept, touches, size | ev.spec required | — | 01,39 | — | — | PARTIAL | Sin fixture negativa propia |

### J. Identificadores y tiempo

| Requirement ID | ACP-1.1 § | Normative text | Schema path | Profile path | Valid fixture | Invalid fixture | External check | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| ACP11-REQ-111 | 4.2 | Work item id Core: token estable 1-64 imprimible | $defs/workItemId | ids/work_item_pattern | 47,48,38 | — | pasada perfil-consciente | IMPLEMENTED |  |
| ACP11-REQ-112 | 4.2 | El patrón concreto es del perfil | — | ids/work_item_pattern | 36 | 52 | pasada perfil-consciente | EXTERNAL | No existe la pasada: F-04 |
| ACP11-REQ-113 | 4.2 | R1, R2, R2.1 reservados | — | ids/reserved | 36 | — | pasada perfil-consciente | EXTERNAL | Core acepta `R2.1` (fixture 38): coste declarado de A12 |
| ACP11-REQ-114 | 4.2 | IDs de riesgo/deuda/decisión genéricos en Core | $defs/entityId | ids/*_prefix | 26,27,28 | — | — | IMPLEMENTED | L3 cerrado |
| ACP11-REQ-115 | 16.3 | Todo valor authored es duración relativa | $defs/duration | — | 03,18,22 | 29 | — | IMPLEMENTED |  |
| ACP11-REQ-116 | 16.3 | Ningún instante absoluto en un envelope | $defs/timestamp no usado en expires | — | — | 29 | — | PARTIAL | `decide.review_by` sí acepta `date-time`; depende de format-assertion |
| ACP11-REQ-117 | 16.3 | Los timestamps observados los pone la plataforma | ausencia deliberada | — | — | — | binding | EXTERNAL |  |
| ACP11-REQ-118 | 7.3 | Modificadores de estado | $defs/modifier | — | 30 | — | — | CONFLICT | **F-07**: el patrón admite `needs:`, que §7.3 no lista |

### K. Perfil

| Requirement ID | ACP-1.1 § | Normative text | Schema path | Profile path | Valid fixture | Invalid fixture | External check | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| ACP11-REQ-119 | 16.1 | `acp` como mayor.menor | profile:properties/acp | — | 36,37 | — | — | IMPLEMENTED |  |
| ACP11-REQ-120 | 8.1 | Capacidades = tipos de evento + veto | — | $defs/capability | 36,37 | 36-profile-unknown-capability | — | IMPLEMENTED | Paridad verificada: conjuntos idénticos |
| ACP11-REQ-121 | 8.1 | `approve_gates` sustituye a `approve:<gate>` | — | roles/*/approve_gates | 36 | — | profile linter | IMPLEMENTED | Que los gates existan es externo |
| ACP11-REQ-122 | 8.4 | Permisos default deny | — | permissions/default | 36,37 | — | — | IMPLEMENTED |  |
| ACP11-REQ-123 | 8.4 | Acciones irreversibles: authorization o forbidden | — | $defs/permissionObject allOf | 36 | 39 | — | PARTIAL | Solo en forma expandida; 8 permisos del perfil real usan forma corta |
| ACP11-REQ-124 | 8.2 | self_review forbidden | — | review/self_review const | 36 | 41 | — | IMPLEMENTED |  |
| ACP11-REQ-125 | 6.2 | stale no satisface gates | — | invalidation/stale_counts_for_gates const false | 36 | 40 | — | IMPLEMENTED |  |
| ACP11-REQ-126 | 13.6 | never_default contiene authorize | — | silence/never_default contains | 36 | 42 | — | IMPLEMENTED |  |
| ACP11-REQ-127 | 13.6 | Vocabulario de never_default_actions | — | $defs/authorizationAction | 36 | 53 | validador semántico | IMPLEMENTED |  |
| ACP11-REQ-128 | 8.6 | trust_level declarado | — | identity/trust_level | 36 | — | — | IMPLEMENTED | Perfil real declara 1 |
| ACP11-REQ-129 | 8.6 | Por debajo de 3 no hay independencia garantizada | — | review/independence_guaranteed | 36 | — | profile linter | PARTIAL | **F-08**: el gate `code` exige review independiente con trust_level 1 |
| ACP11-REQ-130 | — | Automatización activa exige implementación | — | automation allOf | 36 | 37 | — | IMPLEMENTED |  |
| ACP11-REQ-131 | 5.2.3 | Extensiones del perfil en contenedor | — | properties/extensions | 36,37 | 66,67,68 | — | IMPLEMENTED | L1 cerrado |
| ACP11-REQ-132 | — | Integridad referencial del perfil | — | **no expresable** | 36 | — | profile linter | EXTERNAL | 14 invariantes; el perfil real las cumple todas hoy (verificado) |

### L. Paridad de catálogo

| Requirement ID | ACP-1.1 § | Normative text | Schema path | Profile path | Valid fixture | Invalid fixture | External check | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| ACP11-REQ-133 | 5.3 | Un solo catálogo cerrado de 27 | $defs/eventType | $defs/eventType | todas | 27 | — | IMPLEMENTED |  |
| ACP11-REQ-134 | 5.3 | Digest idéntico en ambos schemas | $comment | $comment | — | — | comparación manual | IMPLEMENTED | 3 apariciones, todas idénticas |
| ACP11-REQ-135 | 5.3 | Digest publicado en la spec | — | — | — | — | comparación manual | IMPLEMENTED | Coincide con el recalculado |

### M. Conformidad del validador

| Requirement ID | ACP-1.1 § | Normative text | Schema path | Profile path | Valid fixture | Invalid fixture | External check | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| ACP11-REQ-136 | — | format-assertion obligatorio | README §2.1 | ids/work_item_pattern format:regex | — | 52 | validador | IMPLEMENTED | M1 cerrado; comprobado que sin él la fixture 52 se acepta |

---

## Respuestas a las cinco preguntas objetivas

**1. ¿Cada requisito normativo está implementado, cubierto por fixtures, o marcado external?**
Sí, con dos excepciones que son `CONFLICT` (ACP11-REQ-073, ACP11-REQ-118) y veinticinco `PARTIAL`. **Ningún requisito queda `MISSING`**: no hay ninguno sin schema, sin fixture y sin marca external. De los 25 `PARTIAL`, **18 lo son solo por falta de fixture negativa** en tipos de evento que sí tienen regla.

**2. ¿Cada regla del schema tiene base normativa en ACP-1.1?**
Casi. Tres reglas no la tienen:
- `$defs/authorizationScope (properties/action)` enumera once acciones que la spec no enumera (ACP11-REQ-082).
- `$defs/modifier` admite la familia `needs:`, que §7.3 no lista (ACP11-REQ-118, F-07).
- `properties/v` acepta `1.x` con x≥1; la spec no se pronuncia (ACP11-REQ-004, F-06).

**3. ¿Alguna regla del schema legisla por encima de la spec?**
Sí, una en sentido estricto: **F-07**, el modificador `needs:`. Las otras dos son huecos de la spec, no excesos del schema, pero conviene cerrarlos en la spec y no en el schema.

**4. ¿Hay requisitos sin schema, sin fixture y sin external?**
No. Cero `MISSING`.

**5. ¿La trazabilidad publicada es completa y exacta?**
**No.** `TRACEABILITY.md` declara 78 requisitos / 52 con schema / 26 external, y sus tablas contienen **95 filas** con **39 marcas external**. Además catorce fixtures no aparecen en ninguna fila y once tipos de evento no tienen fila propia. Detalle en F-09 y F-10.
