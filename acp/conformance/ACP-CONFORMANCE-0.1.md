# ACP Conformance Suite 0.1

**Qué significa que una implementación cumple ACP, y cómo se demuestra.**

| | |
|---|---|
| Título | **ACP Conformance Suite** |
| Versión | **`0.1.0-draft`** |
| Estado | **`conformance-suite candidate — not adopted`** |
| Capa | Conformance (transversal a Core, Profile, Binding e Implementation) |
| Requisitos | **143 activos** + 1 retirado (`requirements.yml`) · 92 derivados de fuente, 51 propios de la suite |
| Trazabilidad de origen | [`traceability-map.yml`](traceability-map.yml) — **113/113 filas cubiertas, y ninguna agrupación de más de 3 filas** |
| Capas de conformidad | **8** (L0–L7) |
| Packs | **7** |
| Familias de casos | **19** |
| Casos de referencia obligatorios | **39** |
| Automatización | **Ninguna.** No hay harness, ni scripts, ni CI, ni casos ejecutables |
| Revisión | Descongelada tras el veredicto `ACP-1.1 AND SCHEMA V3 RECONCILED — READY TO UNFREEZE CONFORMANCE SUITE`. Revisión congelada anterior: `b34f70ff` |

> ### Advertencia
>
> Esta especificación **no implementa la suite**, **no ejecuta nada** y **no autoriza ninguna operación**. Define requisitos, formatos declarativos y obligaciones. Los dos JSON Schema que acompaña describen el formato de casos e informes; **no ejecutan casos**.
>
> Las fuentes que vincula están **reconciliadas entre sí y siguen sin aprobar**. **Reconciliación no es adopción**: ni de ACP-1.1, ni de Schema V3, ni de esta suite. Ninguna implementación puede declararse conforme hoy, porque no existe todavía ni un caso.

### Fuentes

| Fuente | Rama | SHA | Carácter |
|---|---|---|---|
| ACP-1.1 candidate | `feat/acp-1-1-normative-amendments` | `983c3a4aeb4a5dc758cbc4a92a7343eaf83a7bad` | **candidata normativa, reconciliada** |
| Schema V3 (envelope 0.3.0, profile 0.3.0) | `feat/acp-envelope-schema` | `42091572dafe3400ce16fb26039210d8c0c30a42` | **candidata normativa, reconciliada** |
| GitHub Binding 0.1.0-draft | `feat/acp-github-binding` | `ca978ac6736cf6b8c43753d46a07ee6002e9522d` | **candidata normativa** (solo pack GitHub) |
| Reconciliación ACP-1.1 ↔ V3 | `chore/acp-1-1-v3-reconciliation` | `3c884d75e2ea394f438dcb8ba2c729fd2b58574c` | informativa |
| Revisión congelada de esta suite | `feat/acp-conformance-suite` | `b34f70ff6b112267609f268ffe037e804e9499ec` | antecedente histórico |
| Borradores de arquitectura | `chore/agent-protocol-mvp` | `fb40920202cdff804f4fe1c72f656870bfab5997` | **informativos, no normativos** |
| `origin/main` al publicar | `main` | `48049b05a88c423f305f32bc70e66f4451f008a1` | — |

**Absorbe** `docs/agents/conformance-suite-draft.md`, cuya arquitectura de ocho capas se conserva íntegra y se convierte en normativa con IDs estables, catálogo de requisitos, formatos y reglas de agregación.

---

## Índice

1. [Qué es conformidad](#1) · 2. [Las ocho capas](#2) · 3. [Clases y claims](#3) · 4. [Catálogo de requisitos](#4) · 5. [Mapa de fuentes](#5) · 6. [Formato de caso](#6) · 7. [Formato de informe y agregación](#7) · 8. [Familias](#8) · 9. [Casos obligatorios](#9) · 10. [Packs](#10) · 11. [Manual frente a automatizable](#11) · 12. [Seguridad de la suite](#12) · 13. [Versionado y compatibilidad](#13) · 14. [Trazabilidad](#14) · 15. [Piloto manual](#15) · 16. [Criterios de adopción](#16) · 17. [Decisiones abiertas](#17) · 18. [Veredicto](#18)

---

<a name="1"></a>
## 1. Qué es conformidad

### 1.1 La afirmación que esta suite existe para impedir

> «Pasa el JSON Schema, luego cumple ACP.»

Es falsa, y es la forma más probable en que ACP se degradará. De los 143 requisitos de conformidad, **50 son comprobables por JSON Schema**. Los otros **93 no lo son**, y entre ellos están casi todos los que sostienen los gates: que el actor sea quien dice, que el lease haya caducado, que el SHA exista, que la review sea independiente, que la evidencia no esté fabricada.

**CONF-001.** Una implementación **NO DEBE** afirmar conformidad con ACP sin nombrar las capas superadas. «ACP compliant» sin capas es una afirmación vacía y esta suite la declara no conforme (§3.3).

### 1.2 Definición

Una implementación es conforme **a una capa** cuando: cada requisito de esa capa está ejercitado por al menos un caso ejecutado, ningún caso bloqueante falla, ningún caso queda `INCONCLUSIVE`, y las capas de las que depende son conformes.

Una implementación es conforme **a una clase** cuando es conforme a todas las capas de esa clase (§3).

**No existe «conforme a ACP» sin más.** Existen siete clases y ocho capas, y una implementación declara exactamente las que ha superado.

### 1.3 Lo que la suite no hace

| No hace | Por qué |
|---|---|
| No certifica | No hay autoridad de certificación y §17 recoge la pregunta |
| No mide calidad de código | Mide conformidad de comportamiento |
| No prueba honestidad | Un `unverified` mentiroso es sintácticamente perfecto (§11) |
| No prueba fiabilidad de un LLM como autor | Es un problema distinto; §17 lo separa explícitamente |
| No sustituye la revisión adversarial | Una suite verde y un diseño equivocado son compatibles |
| No autoriza nada | §12 |

---

<a name="2"></a>
## 2. Las ocho capas

Estructura común: propósito · entradas · requisitos · precondiciones · resultados · modos de fallo · evidencia · dependencias · **qué permite afirmar** · **qué NO permite afirmar**.

**CONF-002.** Ninguna capa **PUEDE** ser `CONFORMING` si una dependencia obligatoria inferior es `NON_CONFORMING`. La conformidad no se hereda hacia arriba saltando huecos.

### L0 — Serialization and Document Integrity

| | |
|---|---|
| **Propósito** | Probar que la entrada se parsea de forma determinista y segura, y que un documento hostil se rechaza |
| **Entradas** | Documentos marcados como ACP, documentos de perfil, corpus de casos |
| **Requisitos** | `ACP-CONF-CORE-001…008` (8) |
| **Precondiciones** | Ninguna. Es la base |
| **Resultados** | Documento parseado, forma canónica, digest, diagnósticos de parseo |
| **Modos de fallo** | `malformed-input`, `ambiguous-input`, `unsupported-version`, `resource-exhaustion`, `unsafe-input-handling`, `non-reproducible-digest` |
| **Evidencia** | Diagnóstico por documento, digest reproducible, límites aplicados |
| **Dependencias** | — |
| **Permite afirmar** | Que la entrada es procesable y que dos ejecuciones obtienen el mismo digest |
| **NO permite afirmar** | Absolutamente nada sobre el significado del documento |

### L1 — Envelope and Profile JSON Schema

| | |
|---|---|
| **Propósito** | Validar envelopes y perfiles contra los schemas Draft 2020-12 |
| **Entradas** | Documentos válidos L0, envelope schema, profile schema |
| **Requisitos** | `ACP-CONF-SCHEMA-001…016` (16) |
| **Precondiciones** | L0 conforme; **asersión de `format` activada** (`ACP-CONF-SCHEMA-003`) |
| **Resultados** | Veredicto por documento; para negativos, el keyword o `schemaPath` que disparó |
| **Modos de fallo** | `invalid-schema`, `unresolvable-reference`, `silent-check-loss`, `false-rejection`, `masked-rejection`, `catalogue-drift` |
| **Evidencia** | Veredicto y keyword por caso; versiones de validador; estado de la asersión de format |
| **Dependencias** | L0 |
| **Permite afirmar** | Que la forma del documento cumple el contrato: campos por tipo, condicionales, catálogo cerrado, sujeto único, gramática de extensiones, SHA de 40 |
| **NO permite afirmar** | Autenticidad del actor · corrección causal · frescura del lease · existencia del SHA · existencia de la evidencia · integridad referencial del perfil · honestidad de nada |

**CONF-003.** Una implementación conforme solo a L0–L1 **DEBE** declararse `ACP Core Syntax Conformant` y nada más. Es el punto exacto donde la mayoría de las suites mienten.

### L2 — Profile-Aware Validation

| | |
|---|---|
| **Propósito** | Combinar un evento válido de schema con un perfil concreto y evaluar la política |
| **Entradas** | Evento válido L1, documento de perfil, revisión del perfil |
| **Requisitos** | `ACP-CONF-PROFILE-001…015` (15) |
| **Precondiciones** | L0, L1 conformes; perfil identificado por revisión |
| **Resultados** | Evento válido de perfil; violaciones de política; clase de autorización requerida |
| **Modos de fallo** | `unauthorized`, `invalid-work-item-id`, `reserved-id`, `dangling-profile-reference`, `contradictory-permission`, `weakened-core-invariant`, `unaccountable-automation` |
| **Evidencia** | Revisión de perfil usada; lista de violaciones; informe de integridad referencial |
| **Dependencias** | L0, L1 |
| **Permite afirmar** | Que el evento es admisible **bajo ese perfil y esa revisión** |
| **NO permite afirmar** | Nada sobre el historial, la identidad observada, la plataforma ni los gates |

**Estado real:** ninguna implementación ejecuta hoy L2. La reconciliación lo registra como hueco: el patrón de identificadores y los reservados del perfil **no se aplican a ningún envelope**.

### L3 — Event-Log and Causal Semantics

| | |
|---|---|
| **Propósito** | Validar historia, causalidad, leases, supersesión y reconciliación |
| **Entradas** | Log de eventos ordenado, registros de plataforma, perfil, instante de evaluación |
| **Requisitos** | `ACP-CONF-LOG-001…019` (19) |
| **Precondiciones** | L0–L2 conformes; log completo o su incompletitud declarada |
| **Resultados** | Historia causal aceptada; eventos rechazados o marcados; forks sin resolver; claims activos |
| **Modos de fallo** | `dangling-pointer`, `causal-cycle`, `duplicate-root`, `unresolved-fork`, `lease-miscalculation`, `orphan-heartbeat`, `invalid-preemption`, `invalid-question`, `self-approval` |
| **Evidencia** | Grafo causal; leases con su cálculo; diagnósticos semánticos |
| **Dependencias** | L0, L1, L2 |
| **Permite afirmar** | Que la historia es internamente coherente y que las reglas de causalidad y lease se aplican |
| **NO permite afirmar** | Que los punteros los emitiera la plataforma · que el SHA exista · que el actor sea quien dice · que la evidencia sea real |

**CONF-004.** L3 es **portable**: se evalúa sin plataforma, sin red y sin reloj distinto del instante de evaluación declarado. Un binding nuevo reutiliza L0–L3 sin cambios (§10).

### L4 — Binding and Evidence Verification

| | |
|---|---|
| **Propósito** | Probar que los hechos observados en la plataforma sostienen las afirmaciones authored |
| **Entradas** | Eventos, registros de binding, estado de plataforma, mapa de identidades, repositorio |
| **Requisitos** | `ACP-CONF-BIND-GH-001…021` (21) |
| **Precondiciones** | L0–L3 conformes; binding nombrado y versionado; acceso de **solo lectura** |
| **Resultados** | Registro de binding verificado; estado de verificación de cada evidencia; mismatches de identidad; diagnósticos de recuperabilidad |
| **Modos de fallo** | `identity-mismatch`, `mutated-event`, `deleted-event`, `nonexistent-sha`, `forged-evidence`, `ambiguous-evidence`, `ui-state-as-truth`, `inferred-fact` |
| **Evidencia** | Comparación declarado↔observado con su nivel de garantía; verificación por evidencia; detección de mutación |
| **Dependencias** | L0–L3 |
| **Permite afirmar** | Que los anclajes existen, que la evidencia pertenece a su repositorio y SHA, y que la mutación del log se detecta |
| **NO permite afirmar** | Que detrás de una cuenta esté el agente declarado (salvo nivel ≥ 3) · que un digest no esté fabricado sin re-ejecutar · que no se editara un evento en la ventana sin sellar |

**CONF-005.** L4 es **específica del binding** y **NO DEBE** contaminar el core pack con vocabulario de plataforma. Un binding GitLab sustituye L4 y conserva L0–L3.

### L5 — Projection Determinism and Integrity

| | |
|---|---|
| **Propósito** | Probar que la reducción de la historia aceptada al estado operativo es determinista y atribuible |
| **Entradas** | Historia aceptada, registros de binding verificados, perfil, instante de evaluación, versión de motor |
| **Requisitos** | `ACP-CONF-PROJ-001…012` (12) |
| **Precondiciones** | L0–L4 conformes, o registros de binding pre-verificados en modo offline |
| **Resultados** | Proyección canónica; entradas de gate; diagnósticos; digest de origen |
| **Modos de fallo** | `non-deterministic-projection`, `implicit-clock`, `impure-reduction`, `checkpoint-divergence`, `silent-drift`, `false-certainty`, `evidence-erasure` |
| **Evidencia** | Proyección canónica con digest; versión de motor y revisión de perfil; diagnósticos |
| **Dependencias** | L0–L4 (o L0–L3 con registros pre-verificados) |
| **Permite afirmar** | Que dos ejecuciones con las mismas entradas producen el mismo estado y que la deriva se detecta |
| **NO permite afirmar** | Que el estado sea el correcto según el criterio humano · que un checkpoint sea completo o veraz |

**Estado real:** la especificación del Projection Engine **no está adoptada**. Los doce requisitos de L5 derivan de un borrador informativo y están marcados como tales. **L5 no puede ser `CONFORMING` hasta que exista su especificación**; puede ser `UNTESTED`.

### L6 — Gate and Authorization Evaluation

| | |
|---|---|
| **Propósito** | Probar que las decisiones sensibles usan evidencia fresca, válida y autorizada |
| **Entradas** | Proyección, definiciones de gate del perfil, registro de autorizaciones, instante de evaluación |
| **Requisitos** | `ACP-CONF-GATE-001…012` (12) |
| **Precondiciones** | L0–L5 conformes |
| **Resultados** | Estado del gate con explicación por requisito; bloqueantes; decisión de autorización |
| **Modos de fallo** | `stale-gate`, `unauthorized-action`, `stale-authorization`, `inferred-authorization`, `silent-authorization`, `unacknowledged-uncertainty`, `fail-open` |
| **Evidencia** | Evaluación con explicación de cada pase, fallo y bloqueante; ledger de evidencia usada |
| **Dependencias** | L0–L5 |
| **Permite afirmar** | Que un gate concreto se satisfizo con evidencia fresca en un instante concreto |
| **NO permite afirmar** | Que la decisión fuera acertada · que la autorización fuera querida · que una pregunta disfrazada de decisión no autorizara algo sensible |

### L7 — Operational Resilience and Recovery

| | |
|---|---|
| **Propósito** | Probar el comportamiento bajo fallo, pérdida de sesión y reescritura de historia |
| **Entradas** | Escenarios degradados, logs parciales, historia reescrita, dos revisiones de perfil |
| **Requisitos** | `ACP-CONF-OPS-001…012` (12) |
| **Precondiciones** | L0–L4 conformes; **sandbox desechable** para los escenarios que modifican historia |
| **Resultados** | Estado recuperado; huecos declarados; modo de fallo seguro; ausencia de efectos laterales |
| **Modos de fallo** | `unreconstructible-state`, `false-complete-recovery`, `inferred-fact`, `undetected-race`, `stuck-lease`, `version-mishandling`, `unauthorized-side-effect` |
| **Evidencia** | Estado recuperado con sus huecos; prueba de que no hubo mutación |
| **Dependencias** | L0–L4 |
| **Permite afirmar** | Que la implementación degrada de forma honesta y no inventa lo que no pudo leer |
| **NO permite afirmar** | Que resista fallos no probados · que la plataforma se comporte como en el sandbox |

---

<a name="3"></a>
<a name="claims"></a>
## 3. Clases de conformidad y claims

### 3.1 Las siete clases

| Clase | Capas exigidas | Depende de |
|---|---|---|
| **ACP Core Syntax Conformant** | L0, L1 | — |
| **ACP Profile Conformant** | L2 | Core Syntax |
| **ACP Event-Log Semantics Conformant** | L3 | Core Syntax |
| **ACP Binding Conformant** *(nombrando binding y versión)* | L4 | Core Syntax, Event-Log |
| **ACP Projection Conformant** | L5 | Profile, Event-Log, Binding |
| **ACP Gate Evaluation Conformant** | L6 | Projection |
| **ACP Operationally Conformant** | L7 | Binding |

### 3.2 Formato de claim

**CONF-006.** Un claim **DEBE** tener exactamente esta forma, con todos los campos presentes —incluidos los **SHA de las fuentes** contra las que se verificó y el **SHA de la implementación**— y **DEBE** citar el digest del informe que lo respalda. Un claim que nombre versiones sin SHA no es reproducible: «Core 1.1 candidate» ha designado tres árboles distintos en cuatro días.

```
ACP Conformance
  Core            1.1 candidate @ 983c3a4aeb4a5dc758cbc4a92a7343eaf83a7bad
  Schema          0.3.0 @ 42091572dafe3400ce16fb26039210d8c0c30a42
  Profile         Reformando 1.1-candidate
  Binding         GitHub 0.1.0-draft @ ca978ac6736cf6b8c43753d46a07ee6002e9522d
  Suite           0.1.0-draft
  Implementation  <name> <version> @ <40-hex sha>
  Layers L0-L4    conforming
  Layers L5-L7    untested
  Environment     mock, pinned clock, no network
  Issued          2026-08-02
  Report digest   sha256:<64 hex>
```

**CONF-007.** Un claim sin `report_digest_ref`, o cuyo digest no corresponda al informe, **no afirma nada**. El claim es una etiqueta; el informe es la evidencia.

### 3.3 Claims prohibidos

**CONF-008.** Las siguientes formas son **no conformes** y una implementación **NO DEBE** usarlas:

| Prohibido | Por qué |
|---|---|
| «ACP compliant» | No dice qué capas |
| «fully ACP compatible» | «fully» es indemostrable: 93 de 143 requisitos no son de schema |
| «ACP certified» | No existe autoridad de certificación (§17) |
| «ACP ready» | No significa nada |
| Cualquier claim sin versión de Core, schema, perfil, binding y suite | Cada omisión es una forma de exagerar |
| Cualquier claim sin entorno, fecha y digest del informe | Un claim no reproducible no es verificable |
| Un claim que omita las capas no probadas | Silenciar `untested` es la exageración más común |

**CONF-009.** Un claim **DEBE** enumerar las capas `untested` explícitamente. No mencionarlas es afirmarlas por omisión.

---

<a name="4"></a>
<a name="traceability"></a>
## 4. Catálogo de requisitos

**Dos espacios de nombres, y conviene no confundirlos:**

| Prefijo | Qué es | A quién obliga | Dónde vive |
|---|---|---|---|
| `ACP-CONF-<AREA>-nnn` | Requisito de conformidad: algo que una **implementación de ACP** debe satisfacer | a la implementación bajo prueba | `requirements.yml` (143 activos) |
| `CONF-nnn` | Regla normativa de esta especificación: algo que **la suite, sus casos, sus informes y quien emite un claim** deben cumplir | a la suite y a sus usuarios | este documento (38) |

Un ejemplo de la diferencia: `ACP-CONF-SCHEMA-003` obliga a que el validador tenga la asersión de `format` activada; `CONF-016` obliga a que todo verdict distinto de `PASS` lleve una razón. El primero se comprueba ejecutando la suite; el segundo se comprueba leyéndola.

`requirements.yml` contiene **143** requisitos activos con ID estable, más **1 retirado** que conserva su ID para que un informe antiguo siga siendo interpretable. Campos: `id`, `title`, `layer`, `source`, `source_section`, `normative_text`, `category`, `testability`, `severity`, `required_for`, `inputs`, `expected_result`, `failure_class`, `external_dependencies`, `notes`, y `status` con `deprecated_by` cuando se retira.

### 4.1 Distribución

| Capa | Reqs | | Componente external | Reqs | | Origen | Reqs | | Pack | Reqs |
|---|---|---|---|---|---|---|---|---|---|---|
| L0 | 9 | | `profile-linter` | 9 | | `normative` (ACP-1.1) | 81 | | `core-pack` | 66 |
| L1 | 34 | | `event-log-semantic-validator` | 18 | | `binding-normative` | 34 | | `binding-github-pack` | 24 |
| L2 | 16 | | `binding-verifier` | 9 | | `implementation-normative` | 12 | | `profile-pack` | 16 |
| L3 | 24 | | `identity-verifier` | 9 | | `informative-only` | 11 | | `projection-pack` | 12 |
| L4 | 23 | | `evidence-artifact-verifier` | 9 | | `suite-native` | 5 | | `gate-pack` | 12 |
| L5 | 12 | | `lease-reconciliation-engine` | 14 | | | | | `resilience-pack` | 12 |
| L6 | 12 | | `projection-engine` | 12 | | | | | `all` | 1 |
| L7 | 13 | | `gate-authorization-evaluator` | 12 | | | | | | |
| **Total** | **143** | | `reader-compatibility-layer` | 1 | | **Total** | **143** | | | |

**CONF-035.** Todo requisito cuya `testability` no sea `schema` **DEBE** nombrar su componente responsable. Son **93**, y **ninguno de los nueve componentes existe**.

**CONF-036.** Todo requisito **DEBE** declarar `normative_sources` con referencias resolubles —documento, SHA y sección o `schema_path`— y `traceability_status`. Los **11** cuya única base era un borrador informativo llevan `normative_sources: []`, su borrador en `supporting_sources` y `source_status: informative-only`: **un borrador no adoptado no es norma**, y presentarlo como tal era el defecto F3.

### 4.2 Por qué 143 requisitos frente a 113 filas de origen

Las dos cifras miden cosas distintas y **ninguna sustituye a la otra**:

| | Qué cuenta | Total |
|---|---|---|
| **113 / 60 / 53** | **Filas de `TRACEABILITY.md`**: requisitos de las fuentes reconciliadas, y si el schema los exige o son external | 113 filas |
| **143 / 50 / 93** | **Requirements de esta suite**: unidades verificables con dueño, capa, pack y evidencia esperada | 143 requisitos |

La reconciliación exacta, verificable contra [`traceability-map.yml`](traceability-map.yml):

```
113 filas de origen
  ├─ 49  one-to-one    una fila → un requirement
  ├─ 47  many-to-one   varias filas → un requirement canónico (nunca más de 3 filas)
  └─ 17  one-to-many   una fila → varios requirements verificables por separado
  = 113 cubiertas, 0 sin cubrir

143 requirements activos de la suite
  ├─ 92  derivados de al menos una fila     (traceability_status: source-derived)
  └─ 51  propios de la suite, sin fila fuente (traceability_status: suite-native)

+ 1 requirement retirado (ACP-CONF-SCHEMA-014), sin filas, conservado por trazabilidad
```

**Por qué 93 no equivale a 53.** Las 53 filas external son requisitos *de las fuentes* que el schema no puede exigir. Los 93 requisitos no-schema de la suite incluyen además: los propios de la suite —formato de informe, reglas de agregación, claims, packs, seguridad de ejecución— y los desdoblamientos de una fila external en varias comprobaciones con dueños distintos. **53 ⊂ 93, no 53 = 93.**

**Por qué 50 no equivale a 60.** Las 60 filas schema-enforced las cubren 50 requisitos porque algunas comparten un requirement canónico —siempre 2 o 3 filas que se comprueban por el mismo mecanismo— y porque la suite añade requisitos de schema que no son de las fuentes, como que ambos schemas compilen o que la asersión de `format` esté activada.

**Lectura importante:** solo **50 de 143** requisitos son comprobables por JSON Schema. Los **93 restantes** se reparten entre los nueve componentes de la tabla, y **ninguno existe hoy**.

### 4.3 Cobertura nominal frente a cobertura discriminante

**113/113 filas cubiertas no significa que la suite compruebe 113 obligaciones.** Significa que ninguna fila se quedó sin destino. Son dos afirmaciones distintas, y confundirlas es exactamente el defecto que la verificación independiente encontró en esta suite.

`ACP-CONF-SCHEMA-014` —«las reglas condicionales se aplican según lo especificado»— llegó a cubrir **27 filas de origen** con una única obligación genérica: la estructura de `basis`, la forma de `touches`, los miembros exigidos de `claim`, `review`, `submit`, `validate`, `revalidate`, `authorize` y `question`, la forma de los identificadores de Core y la de los registros de riesgo, deuda y bloqueo. Todas producen *invalid* cuando fallan, y de ahí venía la agrupación: mismo síntoma, no mismo mecanismo.

El problema no es estético. Un requirement así **admite un PASS falso**: una implementación puede rechazar un `claim` sin `lease` y aceptar un `authorize` sin `limits`, y el informe seguirá diciendo `PASS` en SCHEMA-014, porque «alguna regla condicional se aplicó». El PASS no demostraba ninguna de las 27 filas en particular. La cobertura era real como contabilidad y vacía como verificación.

**Regla de discriminancia.** Un requirement puede cubrir varias filas de origen **solo** si todas se comprueban por un mismo mecanismo, de modo que un PASS demuestre cada una de ellas. Enunciado en la forma en que se comprueba:

> Una implementación cumple todos los demás requirements y falla exactamente esta obligación. Si el informe no queda en FAIL en este requirement, y en ninguno más, el requirement no discrimina y debe descomponerse.

**CONF-037.** Todo requirement que cubra más de una fila de origen **DEBE** documentar en `notes` qué mecanismo comparten esas filas y por qué un PASS las demuestra todas. Ningún requirement **PUEDE** cubrir más de **3** filas de origen. Ningún requirement **PUEDE** agrupar obligaciones heterogéneas por el solo hecho de que todas produzcan el mismo resultado —*invalid*, *violation*, *reject*—: el síntoma compartido no es mecanismo compartido.

**CONF-038.** Una fila de origen con una parte de forma y una parte de juicio **DEBE** repartirse entre un requirement de schema y un requirement external con su componente responsable nombrado, y **NO PUEDE** fundirse en una sola obligación mixta. Un PASS de schema no demuestra el juicio, y un verificador external no puede alegar la forma.

**Qué se hizo con SCHEMA-014.** Se **retiró** —`status: deprecated`, sin filas, con `deprecated_by` apuntando a sus sustitutos— y sus 27 filas se repartieron entre requirements con mecanismo propio: `SCHEMA-023` (estructura de `basis`), `SCHEMA-024` (forma de `touches` y justificación del comodín), `SCHEMA-025` (`claim`), `SCHEMA-026` (`review` y sus condicionales), `SCHEMA-027` (`submit`), `SCHEMA-028` (`validate`), `SCHEMA-029` (`revalidate` y `scope_diff`), `SCHEMA-030` (miembros de `authorize`), `SCHEMA-035` (`authorize` sin default silencioso), `SCHEMA-031` (`question`), `SCHEMA-032` (forma de los identificadores en Core), `SCHEMA-033` (gramática de URN y modificadores), `SCHEMA-034` (forma de los registros de riesgo, deuda y bloqueo), `LOG-022` (adecuación de `scope` y `environment`), `LOG-023` (que una URN resuelva y un modificador corresponda al estado real) y `LOG-024` (que un riesgo se revise de verdad, que quien firma una deuda tenga autoridad y que la condición de desbloqueo sea comprobable). El ID se conserva retirado: **no se renumeró nada**, y un informe emitido contra la versión anterior sigue siendo interpretable.

**Auditoría del resto de agregados.** Se revisaron todos los requirements que cubren más de una fila. Cuatro incumplían la regla y se descompusieron: `BIND-GH-014` mezclaba completitud de evidencia con correspondencia diff↔alcance e integridad referencial (ahora `BIND-GH-014`, `BIND-GH-022` y `BIND-GH-023`); `PROFILE-013` mezclaba una comprobación de schema con un juicio de linter (ahora `PROFILE-013` y `PROFILE-016`); `LOG-023` y `SCHEMA-030` cubrían 5 y 4 filas heterogéneas. Estado tras la auditoría: **el agregado mayor cubre 3 filas**, **ninguno mezcla obligaciones de schema y external como cobertura única**, y las 17 filas con parte de forma y parte de juicio están explícitamente partidas (`mapping: one-to-many`).

**Lo que sigue sin estar demostrado.** La discriminancia está enunciada y auditada sobre el mapa; **no está ejecutada**. Ningún requirement nuevo tiene todavía un caso de referencia que lo aísle, y los nueve componentes external siguen sin existir. Que un requirement *pueda* discriminar no prueba que un ejecutor lo haga: eso exige el corpus de casos, y el corpus no está escrito.

### 4.4 Trazabilidad de origen

**CONF-010.** Todo requisito **DEBE** citar su fuente y su sección, y **DEBE** declarar si la fuente es normativa, candidata o informativa. No se inventan requisitos por inferencia: los que derivan de borradores informativos (los doce de L5) lo dicen.

---

<a name="5"></a>
<a name="mapa"></a>
## 5. Mapa de fuentes

### 5.1 Correspondencia

| Fuente | Elementos | Cómo se mapean |
|---|---|---|
| **ACP-1.1** | 136 requisitos de la matriz de reconciliación (`ACP11-REQ-001…136`) | Los normativos comprobables se convierten en requisitos de conformidad L0–L3, L6, L7 |
| **TRACEABILITY.md del Schema V3** | **113 filas** | Las **60** con regla de schema alimentan L1; las **53** marcadas external se reparten entre L2–L7 y nombran su componente responsable |
| **BIND-001…054** | 54 requisitos de binding | 21 se convierten en `ACP-CONF-BIND-GH-*` (L4); el resto son arquitectura sin caso propio |
| **INV-01…26** | 26 invariantes de plataforma | Se incorporan como texto normativo de requisitos L4 y L7 |
| **F1…F20** | 20 modos de fallo | Alimentan los escenarios de L7 y las clases de fallo del formato de caso |
| **Projection Engine draft** | Pipeline y determinismo | 12 requisitos L5, **marcados informativos** |
| **Perfil Reformando** | Gates, permisos, identidad | Requisitos L2 y L6 |

### 5.2 Cifras canónicas tras la reconciliación

La primera revisión de esta suite se redactó sobre fuentes con divergencias confirmadas y mapeaba contra cifras que ya no son las vigentes. Historia completa, para que nadie tenga que reconstruirla:

| Momento | Filas | Schema | External | Con fixture válida | Con inválida |
|---|---|---|---|---|---|
| Publicado en `TRACEABILITY.md` (incorrecto) | 78 | 52 | 26 | — | — |
| Medido al congelar esta suite (`b34f70ff`) | 95 | 56 | 39 | — | — |
| **Canónico tras la reconciliación (`42091572`)** | **113** | **60** | **53** | **78** | **63** |

Corpus de fixtures del Schema V3: **63 válidas + 90 inválidas = 153**. La revisión congelada citaba 50 / 67 / 117.

**CONF-034.** Esta suite **DEBE** mapear contra las cifras del SHA canónico que declara en su tabla de fuentes, y **DEBE** conservar visible la historia de las que sustituye. Copiar una cifra sin recalcularla es lo que produjo las dos filas superiores.

### 5.3 Requisito canónico y fuentes múltiples

**CONF-011.** Cuando dos fuentes expresan lo mismo, existe **un** requisito canónico con varias fuentes citadas. Ejemplo: «solo el SHA completo ancla evidencia» aparece en ACP-1.1 §6.1, en `INV-01` del binding y en `ACP11-REQ-036`; el requisito canónico es `ACP-CONF-SCHEMA-012`, con `ACP-CONF-BIND-GH-012` cubriendo la parte que solo el binding puede verificar.

### 5.4 H1, H2 y H3: cerrados en las fuentes

Los tres defectos High que bloqueaban esta suite están resueltos en los SHA canónicos, y la suite los refleja:

| # | Estado vigente que la suite asume |
|---|---|
| **H1** `delivery.kind` | Enum normativo de ACP-1.1 §6.1: **`pull-request`, `merge-request`, `branch`, `patch`**. El vocabulario genérico (`change-request`, `commit`, `artifact`, `external`) es **solo una propuesta para ACP-1.2** y ninguna implementación puede anticiparlo. Requisito `ACP-CONF-SCHEMA-017` |
| **H2** `violation.rule` | **23 códigos**, los de ACP-1.1 §15.1, incluidos los ocho que antes no podían emitirse. Requisito `ACP-CONF-SCHEMA-018` |
| **H3** checkpoint | **`item`** y **`program`** con reglas diferenciadas: `state` y `gates` **obligatorios en item y prohibidos en programa**; `from`/`to` **exclusivos de programa y siempre en pareja**, describiendo el rango de migración (ACP-1.1 §11.3.1). Requisito `ACP-CONF-SCHEMA-019`, más el external `ACP-CONF-LOG-021` para `from == to` |

### 5.4.1 N1 y N2: cerrados en esta suite

La verificación independiente posterior a `5578e99a` dio el veredicto *suite estructuralmente válida — refinamiento de mapping requerido*, con dos hallazgos:

| # | Hallazgo | Cierre |
|---|---|---|
| **N1** | `ACP-CONF-SCHEMA-014` era **overbroad**: una sola obligación genérica cubría 27 filas de origen heterogéneas, de modo que un PASS no demostraba ninguna en particular | **Cerrado.** SCHEMA-014 retirado y sus filas repartidas entre 16 requirements con mecanismo propio; auditados y descompuestos otros cuatro agregados. §4.3 |
| **N2** | La documentación afirmaba «113/113 cubiertas» sin distinguir cobertura nominal de cobertura discriminante | **Cerrado.** §4.3 y `README.md` §4 declaran la diferencia, la regla (`CONF-037`, `CONF-038`) y lo que sigue sin demostrarse |

**Discrepancia con el brief de verificación, declarada:** el hallazgo describía «24 filas, TRACE-037…TRACE-060». Lo medido sobre `traceability-map.yml` en `5578e99a` son **27 filas y no forman un rango contiguo**: TRACE-029, 030, 031, 034, 035, 038, 045, 046, 047, 049, 052, 055, 056, 057, 061, 062, 063, 064, 067, 068, 073, 076, 105, 106, 107, 108 y 109. Además **mezclaban clases**: 25 schema-enforced y 2 external puras, más cinco filas con parte de forma y parte de juicio. El defecto era real y algo mayor de lo enunciado; el cierre se hizo sobre lo medido, no sobre el rango del brief.

### 5.5 Conflictos: no se arbitran aquí

**CONF-012.** Cuando dos fuentes se contradicen, el requisito se marca `CONFLICT` y **la suite no decide**. Tres conflictos abiertos, todos de la reconciliación:

| # | Conflicto | Requisito afectado | Decisión requerida de |
|---|---|---|---|
| C1 | ~~ACP-1.1 §15.1 define 23 códigos; Schema V3 admite 15~~ | — | **CERRADO en `42091572`**: los 23 están en el enum |
| C2 | ACP-1.1 §12.3 exige digest en la evidencia; Schema V3 no lo requiere | `ACP-CONF-BIND-GH-014` | **Sigue abierto.** Spec o schema |
| C3 | ~~Schema V3 acepta `v: 1.x`~~ | `ACP-CONF-OPS-010`, `ACP-CONF-OPS-013` | **CERRADO en `42091572`**: `v` es `const "1.1"`. Lo que queda no es conflicto sino hueco: la capa de lectura tolerante **no existe** |

**Consecuencia operativa:** C1 y C3 cerrados; los cinco requisitos que describían violaciones no emitibles ya lo son. **C2 sigue abierto**: un caso que exija digest de evidencia reportará `NOT_IMPLEMENTED` por defecto de las fuentes, no de la implementación.

---

<a name="6"></a>
## 6. Formato de caso

`case-format.schema.json` (Draft 2020-12, `urn:acp:conformance:case-format:0.1.0`).

### 6.1 Principio

**CONF-013.** Un caso **DESCRIBE** lo que hay que evaluar; **NO CONTIENE** nada ejecutable. `steps` son descripciones en prosa con un límite de longitud; ninguna propiedad acepta un comando, un script, una URL de descarga ni código. La imposibilidad es **estructural**, no una convención: el schema cierra el objeto y no existe ninguna propiedad donde un comando pudiera vivir.

### 6.2 Campos

| Campo | Obligatorio | Función |
|---|---|---|
| `id` | sí | `ACP-<capa>-<familia>-<nnn>` |
| `title`, `layer` | sí | Identificación |
| `requirements` | sí, ≥1 | **Un caso sin requisito es intrazable y no conforme** |
| `polarity` | sí | `positive` / `negative` / `boundary` |
| `protocol_version`, `schema_version`, `profile`, `binding` | según capa | L4 **debe** nombrar su binding |
| `preconditions` | no | Declarativas, nunca comandos de preparación |
| `inputs` | sí | **Por referencia con digest.** Un caso nunca embebe el corpus |
| `evaluation_time` | condicional | **Obligatorio si el caso depende del reloj** |
| `steps` | no | Prosa. `observes` nombra qué se observa |
| `expected` | sí | `outcome`, y `failure_class` si es rechazo; **`keyword` obligatorio en negativos de L1** |
| `forbidden` | no | Resultados que no deben ocurrir: para el peligro de falso positivo |
| `evidence` | sí | Qué debe registrar la ejecución para ser auditable |
| `automation` | sí | Clase, si es offline, qué exige, y la razón |
| `depends_on` | no | Un caso cuya dependencia falló reporta `NOT_APPLICABLE`, **nunca `PASS`** |
| `status` | sí | `planned` / `specified` / `implemented` / `deprecated` |

### 6.3 Reglas que el formato impone

1. Un caso que depende del reloj **debe** fijar el instante: sin eso no es reproducible.
2. Un caso `offline: true` **no puede** exigir red ni lectura de plataforma.
3. **Ningún caso puede exigir escritura en plataforma.** Prohibido estructuralmente en 0.1.
4. Un negativo de L1 **debe** nombrar el keyword: si no, no prueba que falló por la razón correcta.
5. Un rechazo **debe** clasificar el fallo, con una de las **102** clases del enum.
6. Un caso de L4 **debe** nombrar su binding.
7. Un caso `deprecated` **debe** nombrar su sustituto.

La regla 4 viene de una lección medida: durante la migración del corpus del Schema V3, **dos fixtures heredadas empezaron a fallar antes de tiempo por una regla nueva** y el corpus siguió en verde mientras dejaban de probar lo suyo.

---

<a name="7"></a>
## 7. Formato de informe y reglas de agregación

`report-format.schema.json` (`urn:acp:conformance:report-format:0.1.0`).

### 7.1 Principio

**CONF-014.** Un informe es la **única base admisible** de un claim, y **DEBE** registrar tres cosas que se olvidan siempre: qué **no** se probó, qué quedó **indeciso**, y con qué **configuración de validador** se ejecutó.

**CONF-015.** `limitations` es **obligatorio y no vacío**. Ninguna ejecución de esta suite establece todo, y un informe que no declara sus límites es incorrecto por construcción.

### 7.2 Verdicts

**Por caso:** `PASS` · `FAIL` · `NOT_APPLICABLE` · `NOT_IMPLEMENTED` · `INCONCLUSIVE` · `ERROR`.
**Por capa:** `CONFORMING` · `NON_CONFORMING` · `PARTIAL` · `UNTESTED` · `INCONCLUSIVE`.

**CONF-016.** Todo verdict distinto de `PASS` **DEBE** llevar `reason`. Un `FAIL` desnudo o un `INCONCLUSIVE` sin explicación no son evidencia.

### 7.3 Reglas de agregación

**CONF-017.** Las seis reglas, y las cuatro primeras están **impuestas por el schema**, no solo documentadas:

| # | Regla | Impuesta por |
|---|---|---|
| A1 | Un `FAIL` de severidad `blocking` produce `NON_CONFORMING` para su capa | schema |
| A2 | `NOT_IMPLEMENTED > 0` impide `CONFORMING`: la capa es `PARTIAL`, o `UNTESTED` si no se ejecutó ningún caso | schema |
| A3 | `INCONCLUSIVE` **nunca** cuenta como `PASS`; con uno o más, la capa no puede ser `CONFORMING` | schema |
| A4 | `ERROR` invalida la ejecución afectada: no es `FAIL` ni `PASS`, y exige repetición | schema (obliga `reason`) |
| A5 | Ninguna capa superior puede ser `CONFORMING` si una dependencia obligatoria inferior es `NON_CONFORMING` | agregador (declarado en `depends_on`) |
| A6 | Una combinación de versiones no soportada fuerza `INCONCLUSIVE` en todas las capas y **prohíbe cualquier claim** | schema |

Dos reglas adicionales del schema, específicas y con historia:

- **Sin asersión de `format`, L1 no puede ser `CONFORMING`.** Medido: sin ella una fixture con una expresión regular malformada **se acepta** y el chequeo desaparece en silencio.
- Un entorno `live-read-only` **debe** tener red en modo `allowlist`.

### 7.4 Campos del informe

`suite_version` · `implementation` + `_version` + `_sha` · `protocol_version` · `schema_version` · `profile_version` · `binding_version` · `combination_supported` · `environment` (kind, platform, clock, network) · `validator_versions` · `format_assertion_enabled` · `started_at` · `finished_at` · `fixture_digest` · `requirements_digest` · `counts` (7 contadores) · `layer_results` · `case_results` · `failures` (completo, no resumido) · `limitations` · `untested_requirements` · `report_digest` · `claim`.

---

<a name="8"></a>
## 8. Familias de casos

Diecinueve, definidas en `catalogue.yml` con objetivo, capas, riesgos cubiertos y **negativos obligatorios**.

| Familia | Capas | Objetivo en una línea |
|---|---|---|
| `DOCINT` | L0 | La entrada se parsea determinista y lo hostil se rechaza |
| `ENVELOPE` | L1 | El contrato del envelope se aplica por tipo |
| `PROFVAL` | L1, L2 | El perfil está bien formado y no debilita el Core |
| `CATVER` | L1, L7 | Catálogo cerrado y reglas de versión |
| `IDENTITY` | L2, L4 | Declarada frente a observada, y cuenta compartida como indeterminado |
| `CAUSAL` | L3 | Raíces, punteros, forks y ciclos |
| `LEASE` | L3, L7 | Propiedad, caducidad, heartbeat, release, preempción |
| `SILENCE` | L3, L6 | El silencio tiene semántica y nunca autoriza |
| `AUTHZ` | L6 | Autorización específica, anclada, acotada, caduca, revocable |
| `REVIEW` | L3, L6 | Basis, postura adversarial, independencia |
| `FRESH` | L3, L5, L6 | La obsolescencia se recalcula; revalidar no lava un TTL |
| `EVIDENCE` | L4 | Existencia, repositorio, SHA, ejecución, caducidad |
| `BINDGH` | L4 | Registro separado, mutación detectada, UI nunca es verdad |
| `PROJ` | L5 | Determinismo, atribución, honestidad ante entrada parcial |
| `GATES` | L6 | Evaluación al cruzar, con explicación |
| `RECOVERY` | L7 | Arranque en frío y degradación honesta |
| `SECURITY` | L0, L4, L7 | Entrada hostil y cero mutación |
| `CONCUR` | L3, L7 | Las carreras se detectan, no se impiden |
| `COMPAT` | L1, L7 | Escritor estricto frente a lector tolerante |

**CONF-018.** Cada familia **DEBE** tener al menos un caso negativo por cada entrada de su lista `mandatory_negatives`. Una familia solo con positivos no prueba nada: prueba que el camino feliz funciona.

---

<a name="9"></a>
## 9. Casos de referencia obligatorios

**39** entradas en `catalogue.yml: mandatory_reference_cases`, cada una con familia, capa, requisito y polaridad.

**CONF-019.** La suite está **incompleta** mientras cualquiera de las 39 no tenga fichero de caso. Su ausencia se reporta como `NOT_IMPLEMENTED`, nunca se omite del recuento.

**CONF-020.** Este documento **NO crea** los ficheros de caso. Los define como obligación. Crear casos sin haber cerrado los tres conflictos de §5.4 produciría casos que codifican una contradicción.

Cobertura por polaridad: 30 negativos, 4 boundary, 5 positivos. La proporción es deliberada: **un corpus de conformidad se juzga por lo que rechaza.**

---

<a name="10"></a>
## 10. Packs

Siete, definidos en `catalogue.yml`. Cada uno declara capas, prefijos de requisito, dependencias, entorno, fixtures, evidencia, resultado y portabilidad.

| Pack | Capas | Plataforma | Resultado |
|---|---|---|---|
| `core-pack` | L0, L1, L3 | **no** | Core Syntax + Event-Log Semantics |
| `profile-pack` | L2 | no | Profile Conformant |
| `binding-github-pack` | L4 | **sí** | Binding Conformant (github 0.1.0-draft) |
| `projection-pack` | L5 | no | Projection Conformant (bloqueado: spec no adoptada) |
| `gate-pack` | L6 | no | Gate Evaluation Conformant |
| `resilience-pack` | L7 | **sí, sandbox** | Operationally Conformant |
| `security-pack` | L0, L4, L7 | no | Sin clase propia: **un fallo bloqueante aquí anula todos los demás claims** |

**CONF-021.** El `core-pack` **DEBE** ejecutarse sin plataforma, sin red y sin reloj distinto de los instantes declarados en los casos. Es la prueba de que ACP no es «cómo trabajamos en GitHub».

**CONF-022.** El `binding-github-pack` **NO DEBE** introducir vocabulario de plataforma en requisitos del core pack. Un futuro `binding-gitlab-pack` reutiliza L0–L3 y sustituye únicamente L4.

---

<a name="11"></a>
## 11. Manual frente a automatizable

**CONF-023.** Cada caso **DEBE** declarar su clase de automatización. Exagerarla es la forma principal en que una suite se convierte en teatro.

| Clase | Ejemplos | Regla |
|---|---|---|
| `fully-automatable` | validación de schema, claves duplicadas, grafo causal, existencia de SHA, comparación de digests | Decidible desde las entradas o con una lectura |
| `automatable-with-mock` | mismatch de identidad, comentario editado, artifact caducado, plataforma parcial | Requiere registro simulado; la semántica sí es decidible |
| `automatable-with-sandbox` | force push, renombrado de repo, re-run sobre el mismo SHA, carrera de claims | Exige repositorio desechable. **Nunca contra un repo real del programa** |
| `manual-evidence-review` | calidad de un checkpoint, si una pregunta es una autorización disfrazada, si un ámbito declarado es honesto, independencia con cuenta compartida | El juicio humano **es** el veredicto. El informe nombra al revisor |
| `not-reliably-automatable` | honestidad de `unverified`, veracidad del `env` declarado, identidad del proceso tras una cuenta, intención humana | **DEBE** reportarse `INCONCLUSIVE` o fuera de alcance. **Nunca `PASS`** |

**CONF-024.** Un caso `not-reliably-automatable` que reporte `PASS` es un defecto de la ejecución, no un éxito. La suite prefiere un `INCONCLUSIVE` honesto a un verde sin fundamento.

**Caso concreto y actual:** con `identity.trust_level: 1` en el perfil real, la independencia de revisión es `manual-evidence-review` y su resultado correcto es **`INCONCLUSIVE`**. Reportarla `PASS` sería exactamente la exageración que ACP existe para evitar.

---

<a name="12"></a>
## 12. Seguridad de la suite

**CONF-025.** Las fixtures son **entrada no confiable**. La suite **NO DEBE** ejecutarlas, interpretarlas como programa ni permitir que definan comportamiento.

| # | Requisito |
|---|---|
| S1 | Ninguna fixture es ejecutable; ninguna propiedad del formato de caso acepta un comando |
| S2 | Parseo seguro: sin resolución de tipos arbitrarios, sin alias, sin referencias externas |
| S3 | Límite declarado de tamaño de documento y profundidad de anidamiento |
| S4 | Límite declarado de nodos y aristas del grafo causal, y de profundidad de recursión |
| S5 | **Sin fetch de red arbitrario.** Solo destinos en allowlist |
| S6 | **Sin credenciales de producción**, nunca, en ningún entorno |
| S7 | Entornos aislados y desechables |
| S8 | Reloj controlado: los instantes son entradas, no lecturas del sistema |
| S9 | Red simulada cuando el caso lo permita |
| S10 | Redacción de secretos en toda salida y en todo informe |
| S11 | Artefactos temporales, con limpieza declarada |
| S12 | Reproducibilidad: mismo corpus y misma configuración, mismo informe |
| S13 | **Dry-run por defecto** |

**CONF-026.** La suite **NO DEBE** ejecutar nunca: merge, deploy, migración, escritura SQL, borrado, cambio de permisos ni rotación de secretos. En la versión **0.1 no existe excepción**: ni siquiera en sandbox. Un futuro sandbox desechable diseñado para ello requeriría su propia revisión de seguridad y una versión distinta de esta especificación.

**CONF-027.** Un fallo bloqueante del `security-pack` **anula todos los claims** de la ejecución, incluidas las capas que hubieran pasado. Una suite insegura no produce evidencia fiable de nada.

---

<a name="13"></a>
## 13. Versionado y compatibilidad

**CONF-028.** La suite tiene versión propia (`0.1.0-draft`), independiente de Core, schema, perfil y binding.

### 13.1 Matriz de soporte

**CONF-029.** Una ejecución **DEBE** declarar `combination_supported`. Si la combinación de versiones no está declarada soportada, **todas las capas son `INCONCLUSIVE` y no se emite claim** (regla A6).

| Eje | Compatibilidad de la suite 0.1 |
|---|---|
| Core | `1.1` candidate únicamente. `1.0` no está soportado: la suite asume `actor` obligatorio y sujeto único |
| Escritor | El writer schema acepta **exclusivamente `v: "1.1"`** (`const`). Un documento `1.2` **no debe validarse con Schema V3**: una versión futura exige un schema futuro |
| Lector | La tolerancia hacia adelante es **una capa separada** (`reader-compatibility-layer`), fuera del writer schema y **sin implementación** |
| Envelope schema | `0.3.0`. Con `0.2.0` los requisitos L1 no aplican |
| Profile schema | `0.3.0` |
| Binding | `github@0.1.0-draft` para el pack GitHub. Otros bindings requieren su propio pack |
| Projection Engine | **ninguna versión adoptada**: L5 solo puede ser `UNTESTED` |

### 13.2 Evolución de casos

| Cambio | Efecto en la versión de la suite |
|---|---|
| Caso nuevo que cubre un requisito ya existente | menor |
| Requisito nuevo | menor si es `major`/`minor`; **mayor si es `blocking`**, porque cambia lo que significa conformar |
| Endurecer un caso existente | **mayor** |
| Deprecar un caso | menor, y el caso **debe** nombrar su sustituto |
| Cambiar una regla de agregación | **mayor** |
| Golden fixtures de proyección nuevas o modificadas | mayor si cambia un resultado esperado |

**CONF-030.** Un caso deprecado **NO DEBE** borrarse en la misma versión que lo depreca: se conserva marcado, para que un informe antiguo siga siendo interpretable.

---

<a name="14"></a>
## 14. Trazabilidad

### 14.1 La cadena

```
Requisito ACP-1.1  (ACP11-REQ-nnn)
        ↓
Fila de TRACEABILITY del Schema V3
        ↓
Requisito de conformidad  (ACP-CONF-<AREA>-nnn)
        ↓
Caso  (ACP-L<n>-<FAMILIA>-nnn)
        ↓
Resultado de ejecución  (verdict + reason + evidencia)
        ↓
Claim  (capas + versiones + digest del informe)
```

**CONF-031.** La cadena **DEBE** ser recorrible en **ambos sentidos**. Desde un claim se llega a los casos que lo sostienen; desde un requisito normativo se llega al caso que lo prueba o a la declaración de que nadie lo prueba.

### 14.2 Seis detecciones obligatorias

**CONF-032.** Una futura implementación de la suite **DEBE** detectar y reportar:

| # | Anomalía | Por qué importa |
|---|---|---|
| D1 | **Requisito sin caso** | Un requisito que nadie prueba es una promesa vacía |
| D2 | **Caso sin requisito** | Un caso intrazable no aporta evidencia de conformidad |
| D3 | **Requisito duplicado** | Dos IDs para lo mismo inflan la cobertura |
| D4 | **Requisito obsoleto** | Su fuente cambió y el requisito no |
| D5 | **Fuente inexistente** | La sección citada ya no existe en ese SHA |
| D6 | **Versión incompatible** | La combinación ejecutada no está soportada |

**CONF-033.** Las cifras de cobertura **NO DEBEN** copiarse a mano de un documento a otro. La discrepancia de §5.2 —78 publicado frente a 95 real— ocurrió exactamente así y se propagó a tres documentos. Toda cifra publicada **DEBE** ser recalculable de su fuente.

---

<a name="15"></a>
## 15. Piloto manual

Subconjunto mínimo ejecutable **a mano**, sin harness.

### 15.1 Qué prueba

| # | Prueba | Capa | Cómo, sin herramientas |
|---|---|---|---|
| P1 | Un documento marcado parsea y no tiene claves duplicadas | L0 | Validador local |
| P2 | Un envelope por cada tipo usado valida contra el schema | L1 | Validador local con asersión de format |
| P3 | El actor existe en el perfil y tiene la capacidad del tipo | L2 | Lista de comprobación contra `acp.yml` |
| P4 | La cadena de `after` de un item resuelve, sin forks ni ciclos | L3 | Inspección del hilo |
| P5 | `claim` → `heartbeat` → `release` con referencias correctas y caducidad calculada | L3 | Aritmética sobre `created_at` |
| P6 | Una review queda obsoleta al cambiar el head | L3+L4 | Comparar `basis.sha` con el head |
| P7 | Una autorización explícita existe, está anclada y no ha caducado | L6 | Lectura del evento |
| P8 | Un checkpoint acota la lectura sin ocultar nada | L3 | Lectura del `covers` |
| P9 | Un item se reconstruye desde la plataforma sola | L7 | Recuperación en frío |
| P10 | Una proyección calculada a mano coincide con la publicada | L5 | Comparación |
| P11 | Un gate se evalúa a mano con explicación de cada requisito | L6 | Lista de comprobación |

### 15.2 Qué queda sin probar, y hay que decirlo

| Sin probar | Razón |
|---|---|
| Determinismo de proyección | Exige dos ejecuciones de un motor que no existe |
| Detección de mutación por sellos | Los sellos no existen todavía |
| Independencia de revisión | `trust_level: 1` la hace indecidible: `INCONCLUSIVE` |
| Carreras de claims | Exige sandbox |
| Force push, renombrado, re-run | Exige sandbox |
| Integridad referencial del perfil | Exige linter; comprobada a mano una vez, sin garantía continua |
| Patrón e ids reservados del perfil | Exige la pasada perfil-consciente, que no existe |
| Los 5 requisitos afectados por el conflicto C1 | Sus códigos de violación no son emitibles |

**CONF-034.** El piloto **NO DEBE** llamarse «ACP conforming». El claim correcto tras un piloto manual exitoso es:

```
ACP Conformance
  Core 1.1 candidate · Schema 0.3.0 · Profile Reformando 1.1-candidate
  Binding GitHub 0.1.0-draft · Suite 0.1.0-draft
  Layers L0-L1     conforming (manual)
  Layer  L2        partial
  Layer  L3        partial
  Layer  L4        partial
  Layers L5-L7     untested
  Environment      manual review, no harness
  Report digest    sha256:<64 hex>
```

---

<a name="16"></a>
## 16. Criterios de adopción

Seis gates. Cada uno con requisitos, evidencia, responsable y condiciones bloqueantes.

### Gate A — Adoptar ACP-1.1

| | |
|---|---|
| **Requisitos** | Las 23 enmiendas resueltas; los 3 conflictos de §5.4 cerrados; la matriz de reconciliación sin `CONFLICT` |
| **Evidencia** | Fichero de decisiones con `ACCEPT`/`MODIFY`/`REJECT`/`DEFER` por enmienda; matriz recalculada |
| **Responsable** | Product Owner, con revisión adversarial independiente |
| **Bloqueantes** | Cualquier `CONFLICT` abierto; cualquier cifra publicada no recalculable |

### Gate B — Adoptar Schema V3

| | |
|---|---|
| **Requisitos** | Gate A; C1 y C2 cerrados; corpus 153/153 con keyword previsto (63 válidas, 90 inválidas); asersión de format declarada |
| **Evidencia** | Ejecución reproducible con versión de validador; digest del corpus |
| **Responsable** | Revisor independiente, no el autor del schema |
| **Bloqueantes** | ~~F-01~~ y ~~F-09~~ cerrados en `42091572`. Queda **C2**, el digest de evidencia |

### Gate C — Adoptar el GitHub Binding

| | |
|---|---|
| **Requisitos** | Gate B; las **12 suposiciones de plataforma verificadas**; sintaxis de las dos marcas fijada; contenedor de eventos de programa decidido |
| **Evidencia** | Tabla de verificación con la comprobación realizada por suposición |
| **Responsable** | Operador de plataforma + revisor |
| **Bloqueantes** | Cualquier suposición aún marcada `[VERIFICAR]` de la que dependa un gate |

### Gate D — Ejecutar el piloto manual

| | |
|---|---|
| **Requisitos** | Gates A–C; nivel de garantía de identidad declarado; una cuenta por agente si se pretende independencia; reglas de parada escritas; dos work items elegidos |
| **Evidencia** | Informe conforme a `report-format.schema.json`, aunque se rellene a mano |
| **Responsable** | Product Owner |
| **Bloqueantes** | Ninguna acción sensible automatizada; `trust_level < 3` si el piloto pretende demostrar separación de poderes |

### Gate E — Añadir automatización

| | |
|---|---|
| **Requisitos** | Gate D superado en dos work items; casos de L0–L4 escritos y validados contra `case-format.schema.json`; golden fixtures de proyección; revisión de seguridad de §12; modo dry-run |
| **Evidencia** | Informes de dos pilotos; revisión de seguridad firmada |
| **Responsable** | Lead + Product Owner |
| **Bloqueantes** | Cualquier automatización que pueda mergear, desplegar, migrar o autorizar sin humano |

### Gate F — Declarar una implementación conforming

| | |
|---|---|
| **Requisitos** | Informe válido; claim en el formato de §3.2; capas no probadas enumeradas; `security-pack` sin fallo bloqueante; combinación de versiones soportada |
| **Evidencia** | Informe con digest, citado por el claim |
| **Responsable** | Quien emite el claim, nominalmente |
| **Bloqueantes** | Cualquier `INCONCLUSIVE` en una capa reclamada; cualquier frase prohibida de §3.3 |

---

<a name="17"></a>
## 17. Decisiones abiertas

Trece, sin decidir: **no hay evidencia para decidirlas y esta suite no arbitra.**

| # | Decisión | Por qué no se decide aquí |
|---|---|---|
| 1 | Lenguaje de referencia del futuro harness | Es una decisión de implementación, y la suite debe ser independiente de ella |
| 2 | Formato final de fixtures de caso | Depende de si el harness es local o distribuido |
| 3 | Repositorio de la suite: junto al protocolo o separado | Afecta a quién puede modificarla |
| 4 | Autoridad para emitir claims | Hoy cualquiera puede emitir uno; §3 exige que sea verificable, no que esté autorizado |
| 5 | Firma de informes | Sin firma, un informe se puede fabricar; con firma, hace falta gestión de claves |
| 6 | Confianza en los runners | Un runner comprometido produce informes verdes |
| 7 | Mocks frente a sandbox real | Los mocks son reproducibles y pueden divergir de la plataforma |
| 8 | Límites concretos de grafo | Hay que medir grafos reales antes de fijar números |
| 9 | Compatibilidad entre minors | Ligado al conflicto C3 |
| 10 | Certificación | Requiere decidir 4, 5 y 6 antes |
| 11 | Fiabilidad de autoría LLM | **Problema distinto del de conformidad de protocolo**; mezclarlos haría ilegibles ambos |
| 12 | Cómo medir honestidad epistemológica | La calidad de `unverified` es probablemente el mejor predictor de fiabilidad de un agente, y no sé medirla sin crear un incentivo a rellenarla |
| 13 | Cómo probar que un binding es tamper-evident | Exige simular un editor malicioso con permisos, en sandbox, y decidir qué ventana de detección es aceptable |

---

<a name="18"></a>
## 18. Veredicto

### Riesgos de esta especificación

1. **Ninguno de los nueve componentes de verificación existe.** 93 de 143 requisitos no tienen quién los compruebe.
2. **Un conflicto abierto** entre fuentes (C2, digest de evidencia). C1 y C3 se cerraron en la reconciliación.
3. **L5 deriva de un borrador informativo** y no puede ser `CONFORMING` hasta que su especificación se adopte.
4. **Cero casos escritos.** Están definidos como obligación, no como material.
5. **El riesgo estructural**: que alguien ejecute el core pack, lo vea verde y escriba «ACP compliant». Los requisitos `CONF-001`, `CONF-003`, `CONF-008` y `CONF-009` existen solo para eso, y son papel: nada obliga a nadie a cumplirlos salvo la revisión.
6. **La suite no puede probar honestidad**, y la honestidad es la propiedad de la que más depende ACP con agentes LLM.

### Veredicto

> ### ACP CONFORMANCE SUITE 0.1 PREPARADA PARA REVISIÓN INDEPENDIENTE

La suite **define conformidad de forma trazable**: 143 requisitos con ID estable, fuentes estructuradas y resolubles, componente responsable nombrado y correspondencia bidireccional con las 113 filas de origen (113/113 cubiertas, 0 sin cubrir); 8 capas con lo que cada una permite y no permite afirmar; 7 clases y un formato de claim que prohíbe la vaguedad; 2 formatos declarativos validados bajo Draft 2020-12 con las reglas de agregación **impuestas por el schema**, no solo documentadas; 19 familias, 39 casos obligatorios y una cadena de trazabilidad recorrible en ambos sentidos.

Lo que **no** está resuelto está declarado: los conflictos, los componentes ausentes, las capas que no pueden conformar todavía y las trece decisiones abiertas. Nada de eso impide que un revisor independiente juzgue si la definición de conformidad es correcta, que es exactamente lo que esta versión necesita ahora.

**Lo que un revisor debería atacar primero:** si las 8 capas son la descomposición correcta o si alguna esconde dos problemas distintos; si los 83 requisitos no-schema están bien repartidos entre los siete componentes o si alguno es en realidad comprobable y se marcó external por comodidad; y si el formato de claim es suficiente para impedir la exageración, sabiendo que solo la revisión lo hace cumplir.
