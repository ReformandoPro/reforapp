# ACP-1.1 ↔ Schema V3 — hallazgos de conformidad

Complemento de [`ACP-1.1-schema-v3-matrix.md`](ACP-1.1-schema-v3-matrix.md). **No es una revisión independiente.** El autor de estos hallazgos escribió tanto la spec como el schema; el valor de este documento es que las comprobaciones son mecánicas y reproducibles, no que el juicio sea imparcial.

## Veredicto

> ### CHANGES REQUIRED — NORMATIVE/EXECUTABLE DIVERGENCE REMAINS

Dos divergencias literales entre spec y schema (**F-01**, **F-07**) y una trazabilidad publicada con cifras incorrectas (**F-09**). Ninguna es de rediseño: F-01 se cierra añadiendo ocho cadenas a un `enum`, F-07 quitando siete caracteres de un patrón, F-09 corrigiendo tres números.

**Bloqueantes de consolidación: F-01 y F-09.** El resto puede cerrarse en la ronda incremental de Hermes.

---

## 1. Verificación de identidad y alcance

Todo confirmado contra el remoto, no asumido.

| Elemento | Valor verificado | ¿Coincide con lo esperado? |
|---|---|---|
| `origin/main` | `48049b05a88c423f305f32bc70e66f4451f008a1` | — (se había movido desde `cbc335d5`) |
| ACP-1.1 | `1bda3e997291e337cc1a3956462e643219d71547` | **sí** |
| Schema V3 | `ae3e4f5e35924e470ad909d63d5a9de55c351df0` | **sí** |
| `chore/agent-protocol-mvp` | `c5d57bf41dfd77a3b8a14ab8f63b07f6af179e44` | movida; ahora con 7 documentos |
| `openclaw/agent-operating-protocol` | `abcd9fb2645857dcd3010b771ea729b650d017c2` | sin cambios |
| merge-base de las tres ramas | `cbc335d52e2cb826cc55bf44e63b47291a3e498b` | ninguna deriva de otra |
| Padre de ACP-1.1 | `0b714a9a…` (ACP-1) | correcto |
| Padre de V3 | `9d073e3c…` (V2) | fast-forward correcto |
| Diff ACP-1 → ACP-1.1 | 5 ficheros, +1020 −266, **0 fuera de `acp/`** | correcto |
| Diff V2 → V3 | 121 ficheros, +2134 −719, **0 fuera de `acp/schema/`** | correcto |

### Afirmaciones de la entrega V3, comprobadas una a una

| Afirmación | Resultado |
|---|---|
| envelope schema 0.3.0 | **confirmado** |
| profile schema 0.3.0 | **confirmado** |
| 50 fixtures válidas | **confirmado** |
| 67 fixtures inválidas | **confirmado** |
| 117 fixtures totales | **confirmado** |
| 66/66 y 18/18 `$ref` | **confirmado**, ninguna rota, ninguna externa, ninguna sin usar |
| cero claves duplicadas | **confirmado** (119 ficheros JSON, detección por `object_pairs_hook`) |
| catálogo de 27 eventos | **confirmado** en los 7 artefactos textuales y en las fixtures |
| digest idéntico | **confirmado**: 3 apariciones, todas `sha256:046f7cad…`, coincide con el recalculado |
| 50/50 válidas aceptadas · 67/67 inválidas rechazadas | **confirmado** re-ejecutando con ajv 8.20.0, Draft 2020-12, `strict`, `allErrors`, format assertion **on** |
| 78 requisitos en TRACEABILITY | **REFUTADO** — hay 95 filas. Ver F-09 |
| 52 schema-enforced | **REFUTADO** — no se corresponde con ninguna cuenta reproducible |
| 26 external | **REFUTADO** — 39 filas llevan marca external |

---

## 2. Hallazgos

### F-01 · `violation.rule` no admite ocho códigos que ACP-1.1 define — **High** · owner: **schema**

- **Requisito:** ACP11-REQ-073 · ACP-1.1 §15.1
- **Schema path:** `$defs/ev.violation/properties/rule/enum`
- **Hecho medido:** el `enum` tiene **15** valores; el catálogo de §15.1 tiene **23**. Faltan exactamente: `alias-type`, `dangling-pointer`, `duplicate-root`, `identity-mismatch`, `malformed`, `missing-touches`, `shadowed-field`, `unscoped-event`.
- **Ejemplo mínimo que debería ser válido y no lo es:**
  ```json
  { "v": "1.1", "type": "violation", "item": "RF-142", "actor": "hermes",
    "after": "github-comment:2451890205",
    "rule": "identity-mismatch", "target": "github-comment:2451890201",
    "severity": "critical", "effect": "void" }
  ```
- **Impacto.** Los ocho códigos ausentes son precisamente los que **introdujo ACP-1.1**: el sujeto ausente (A17), la raíz duplicada y el puntero colgante (A11), el desajuste de identidad (A10), la extensión que sustituye un campo (A14). El protocolo define infracciones que su propio formato prohíbe denunciar. Cinco requisitos de la matriz dependen de ello (REQ-013, 017, 031, 032, 073) y hoy están degradados a `PARTIAL`/`EXTERNAL` por esta causa y no por una limitación real de JSON Schema.
- **Corrección mínima:** añadir las ocho cadenas al `enum` y una fixture negativa con un código inventado. Sin cambios en la spec.

### F-02 · La evidencia no exige digest — **Medium** · owner: **schema** (o spec)

- **Requisito:** ACP11-REQ-047 · ACP-1.1 §12.3, literal: *«un artifact no es evidencia hasta que tiene digest y comando»*
- **Schema path:** `$defs/evidenceReference/required` = `["cmd","env","result"]`
- **Impacto.** Una `submit` puede declarar evidencia sin `id`, y entonces nadie puede comprobar que la salida citada es la que se produjo. Es exactamente la diferencia entre evidencia y alegación que §12.3 establece.
- **Corrección mínima:** añadir `id` a `required`, **o** enmendar §12.3 para decir que el digest es obligatorio solo cuando la salida es reproducible (`reproducible: true`). La segunda opción es más fiel al propio texto de §12.3, que ya contempla salidas no normalizables. **Decidir en la spec, no en el schema.**

### F-03 · M2: las opciones de `question` no tienen ni `uniqueItems` — **Medium** · owner: **schema** + **spec**

- **Requisito:** ACP11-REQ-093 · ACP-1.1 §13.6
- **Hecho medido:** `ev.question.properties.options` es un array **sin `uniqueItems`**. No solo se aceptan ids duplicados: se aceptan objetos de opción **idénticos**.
- **Recomendación única** (respuesta al punto 12 del encargo): **no bloquea la consolidación, pero el diferimiento actual es demasiado blando.** Tres acciones, en este orden:
  1. **Añadir `uniqueItems: true` ya.** Es una mejora estricta, no legisla nada: ACP-1.1 no permite en ningún sitio dos opciones idénticas. Cierra el caso trivial sin tocar la spec.
  2. **Añadir una fixture negativa** con dos opciones idénticas, y **conservar** `50-question-duplicate-option-ids` como válida —ids iguales, cuerpos distintos— que es el hueco real.
  3. **Convertir el límite en requisito normativo explícito**, no en nota de README: ACP-1.1 §13.6 debe decir que un validador semántico *debe* rechazar ids duplicados y que `default_if_silent` *debe* nombrar un id existente. Hoy el hueco vive en la documentación del schema, que es el sitio donde menos lo va a leer quien escribe preguntas.
  4. Diferir a ACP-1.2 solo el cambio estructural (mapa por id).

### F-04 · La pasada perfil-consciente no existe — **Medium** · owner: **external validator**

- **Requisitos:** ACP11-REQ-112, REQ-113
- **Hecho medido:** el Core acepta `R2.1` como `item` (fixture `38-item-core-accepts-any-stable-token`, válida a propósito). `ids.work_item_pattern` y `ids.reserved` del perfil no se aplican a ningún envelope porque no hay componente que los aplique.
- **Impacto.** El coste declarado de A12 es real y hoy no lo paga nadie: la reserva de identificadores del roadmap **no está protegida por nada**.
- **Corrección mínima:** ninguna en el schema. Es la primera pieza de la capa L2 del plan de suite (§5).

### F-05 · `authorizationScope.action` enumera acciones que la spec no enumera — **Low** · owner: **spec**

- **Requisito:** ACP11-REQ-082 · ACP-1.1 §13.5
- **Hecho medido:** el Core fija once acciones (`merge`, `release`, `deploy`, `migrate`, `remote-write`, `rotate-secret`, `delete-data`, `modify-workflow`, `modify-platform-config`, `publish`, `spend`). §13.5 solo muestra `action: deploy` en un ejemplo.
- **Impacto.** El schema está fijando vocabulario normativo. Funciona, y coincide con `never_default_actions` del perfil, pero es el schema legislando.
- **Corrección mínima:** llevar la lista a §13.5 como enumeración normativa. Cero cambios en el schema.

### F-06 · `v` acepta `1.x` con x≥1 — **Medium** · owner: **spec** + **README**

- **Requisito:** ACP11-REQ-004 · ACP-1.1 §16.2
- **Análisis pedido (punto 13 del encargo):**

| Escenario | Con `^1\.[1-9][0-9]*$` | Con `const "1.1"` |
|---|---|---|
| Escritor 1.1 | correcto | correcto |
| Escritor 1.2 validando contra schema 1.1 | **acepta y luego rechaza sus campos nuevos** por `unevaluatedProperties`: falso rechazo con mensaje engañoso | rechazo limpio y explícito por versión |
| Lector 1.1 leyendo 1.2 | el schema no sirve como lector en ninguno de los dos casos | idem |
| Falsa aceptación | posible: un 1.2 que casualmente no use campos nuevos se valida con reglas viejas | imposible |
| Falso rechazo | sí, y confuso | sí, pero claro |

- **Determinación:** el patrón actual **no es correcto para un artefacto que es explícitamente el lado escritor-estricto**. Un schema por minor es lo correcto a medio plazo.
- **Cambio mínimo recomendado:** `"const": "1.1"` en `properties/v`, y que el README diga que la tolerancia hacia adelante es responsabilidad de una capa lectora separada, no de este fichero. Un documento `1.2` debe fallar por versión, no por un campo que el schema de 1.1 no conoce. **No se ha aplicado: el encargo prohíbe modificar el schema.**

### F-07 · El modificador `needs:` no existe en la spec — **Low** · owner: **schema**

- **Requisito:** ACP11-REQ-118 · ACP-1.1 §7.3
- **Hecho medido:** patrón `^((blocked|awaiting|at-risk|debt|violating|needs):…|stale|contested|parked)$`. §7.3 lista `blocked`, `awaiting`, `at-risk`, `debt`, `violating`, `stale`, `contested`, `parked`. **`needs:` no está.**
- **Origen probable:** confusión con la familia de labels `acp/needs:*` de §14.2, que es binding, no estado.
- **Corrección mínima:** quitar `needs|` del patrón. Si el equipo lo quiere como modificador, añadirlo a §7.3 primero.

### F-08 · El gate `code` exige independencia que el nivel de confianza no permite probar — **Medium** · owner: **profile**

- **Requisito:** ACP11-REQ-129 · ACP-1.1 §8.6 regla 2
- **Hecho medido en el perfil real:** `identity.trust_level: 1`, `review.independence_guaranteed: false`, y a la vez `gates.code.requires[0] = {review: {verdict: approve, by_role: reviewer, count: 1, fresh: true}}` con `review.min_independent: 1`.
- **Impacto.** El perfil declara honestamente que no garantiza independencia y acto seguido define un gate cuya precondición es una review independiente. No es una contradicción de schema —ambas cosas son válidas por separado— pero sí un gate que **nadie puede evaluar con verdad** en el estado actual.
- **Corrección mínima:** que `gates.code` declare `independence: unverified` mientras `trust_level < 3`, o que el perfil registre esa combinación como riesgo aceptado y firmado. **Ningún cambio de schema.**

### F-09 · Las cifras de cobertura de `TRACEABILITY.md` son incorrectas — **High** · owner: **README + TRACEABILITY**

- **Hecho medido:**

| Cifra publicada | Valor real |
|---|---|
| «Requirements traced: 78» | **95 filas de requisito** |
| «Enforced by the schema: 52» | no reproducible con ninguna cuenta de las tablas |
| «Requiring an external check: 26» | **39 filas con marca external** |

- **Impacto.** Las tres cifras se repiten en `README.md` §1, §8B y §13, y en el informe de entrega de V3. Un revisor que audite «26 externos» buscará 26 y encontrará 39. Es el tipo de error que destruye la credibilidad de un documento de trazabilidad, que existe precisamente para poder confiar en sus cuentas.
- **Corrección mínima:** recalcular las tres cifras y corregirlas en `TRACEABILITY.md` y en las tres menciones del README. **No requiere cambios de schema ni de fixtures.**

### F-10 · Catorce fixtures y once tipos de evento sin fila en TRACEABILITY — **Medium** · owner: **TRACEABILITY**

- **Fixtures no citadas:** `20-answer`, `20-handoff-without-next-action`, `24-block`, `25-unblock`, `29-handoff-complete`, `30-checkpoint-complete`, `31-reconcile-causal-fork`, `32-violation`, `33-close-rotated-without-into`, `33-supersede`, `44-risk-with-after`, `45-debt-with-after`, `45-root-flag-on-non-root-eligible-type`, `46-violation-with-after`.
- **Tipos sin fila propia:** `answer`, `block`, `checkpoint`, `close`, `debt`, `handoff`, `progress`, `revoke`, `risk`, `supersede`, `triage`, `unblock`, `violation`.
- **Impacto.** La matriz de revisión de Hermes (§8) exige reconciliación evento por evento. Con once tipos sin fila, esa revisión no puede apoyarse en `TRACEABILITY.md`. Esta matriz los cubre (ACP11-REQ-095 a 110), pero el documento publicado del schema no.
- **Corrección mínima:** añadir una fila por tipo faltante.

### F-11 · Diez tipos de evento sin ninguna fixture negativa — **Medium** · owner: **fixture**

`answer`, `approve`, `block`, `progress`, `reconcile`, `revoke`, `supersede`, `triage`, `unblock`, `validate`.

Cuatro de ellos tienen reglas condicionales o varios campos obligatorios y merecen una negativa: **`block`** (cinco campos obligatorios), **`validate`** (tres), **`approve`** (tres, más `ttl`), **`revoke`** (referencia exacta al objetivo). Los otros seis son de un solo campo y su ausencia es defendible.

Es la traducción concreta de `FIXTURE CORPUS INSUFFICIENT`: el corpus creció de 80 a 117 pero **la insuficiencia se concentró en los tipos que nadie tocó**, no se eliminó.

### F-12 · El README subcuenta las dependencias de `format` — **Low** · owner: **README**

`README.md` §2.1 dice *«Only one keyword depends on it today»*. Hay **dos**: `format: regex` en `profile:ids/work_item_pattern` y `format: date-time` en `$defs/timestamp`, referenciado por `ev.decide/review_by`. Con format assertion desactivada, `review_by` acepta cualquier cadena.

### F-13 · Ocho permisos del perfil real usan forma corta — **Informational**

En `acp.yml` de ACP-1.1, 8 de 17 permisos usan cadena o lista en lugar de la forma expandida. Para esos ocho, la comprobación de contradicción de `$defs/permissionObject` **no se aplica**, tal como el README ya documenta. Se cuantifica aquí para que la próxima revisión sepa el tamaño del hueco.

### F-14 · El perfil real pasa hoy las catorce comprobaciones de integridad referencial — **Informational**

Ejecutadas manualmente las 14 comprobaciones de `README` §7 contra `acp.yml` de ACP-1.1: **cero referencias rotas**. Roles, revisores adversariales, veto holders, owners de reconciliación, `approve_gates`, gates referenciados, `by_role`, `owner_role` y unicidad de ids: todo resuelve. El linter sigue sin existir, pero el perfil que validaría está limpio en este SHA.

---

## 3. Cierre de los hallazgos previos

Verificado mecánicamente, no aceptando el resumen de V3.

| Hallazgo | Estado | Evidencia |
|---|---|---|
| **M1** format assertion requerida | **CLOSED** | README §2.1 lo declara como requisito de conformidad; reproducido: con assertion la fixture 52 se rechaza por `format`, sin ella **se acepta**. Matizado por F-12 (dos keywords, no una) |
| **M2** ids de opción duplicados | **PARTIAL** | Sigue external/diferido y documentado, con fixture `50` que lo demuestra. Pero falta `uniqueItems` incluso para duplicados exactos: F-03 |
| **M3** `scope_diff.paths` | **CLOSED** | `minItems: 1` presente; fixture `56` falla por `minItems` |
| **M4** integridad referencial del perfil | **CLOSED** | Tabla de 14 invariantes en README §7, cada una con su razón. Verificado además que el perfil real las cumple (F-14) |
| **M5** perfil Reformando actualizado | **CLOSED** | La fixture `36` es **byte a byte** el `acp.yml` de ACP-1.1 (comparación estructural exacta). `identity.trust_level: 1` y 10 `never_default_actions` presentes |
| **L1** gramática de extensiones del perfil | **CLOSED** | `propertyNames: ^x-[a-z0-9][a-z0-9-]*$`, sin `patternProperties` en la raíz; fixtures 66/67/68 |
| **L2** vocabulario de entrega genérico | **CLOSED** | `["change-request","commit","artifact","external"]` |
| **L3** ids de riesgo/deuda/decisión | **CLOSED** | Los tres apuntan a `$defs/entityId`; los prefijos viven en el perfil |
| **L4** `decide` raíz solo con programa | **CLOSED** | Regla presente; fixtures `40` válida y `60` inválida |
| **L5** cero SHAs cortos normativos | **CLOSED** | Los únicos SHAs no-40-hex en fixtures son `24-sha-too-short` y `25-sha-uppercase`, ambos negativos deliberados. `AGENTS.md` de ACP-1.1 verificado en solo lectura: 0 SHAs cortos, 5 punteros namespaced, `v: "1.1"` |

Ninguno **REGRESSED**.

---

## 4. Los requisitos external, por componente futuro

Los 32 `EXTERNAL` de la matriz dejan de ser una categoría genérica. Cada uno tiene dueño, entradas, salida, modo de fallo y si bloquea gates.

### 4.1 GitHub Binding (o cualquier binding)

| Req | Invariante | Inputs | Output | Modo de fallo | ¿Bloquea gates? |
|---|---|---|---|---|---|
| 009, 010 | `observed_actor` vs `declared_actor` | evento + identidad de plataforma | `violation:identity-mismatch` o nada | suplantación indetectable | **sí**: sin él no hay independencia |
| 025 | El puntero causal lo emitió la plataforma | id del comentario | booleano | puntero inventado bien formado | sí |
| 034 | El binding produce punteros estables | capacidades del binding | declaración de conformidad | causalidad no rastreable | **sí, todos los de frescura** |
| 117 | Timestamps observados | recepción del evento | instante RFC 3339 | toda caducidad indeterminada | sí |

### 4.2 Validador semántico de eventos

| Req | Invariante | Inputs | Output | Modo de fallo | ¿Bloquea? |
|---|---|---|---|---|---|
| 091 | Pregunta que es una autorización disfrazada | evento + `never_default_actions` | reclasificación o violación | el silencio autoriza un deploy | **sí** |
| 092, 093 | `default_if_silent` existe; ids únicos | evento | violación | default que no resuelve a nada | sí |
| 020 | Colisión de nombres de campo | catálogo + evento | aviso | dos significados para un nombre | no |
| 017 | Extensión que sustituye campo normativo | evento | `violation:shadowed-field` | campo normativo eludido | sí |

### 4.3 Profile linter

| Req | Invariante | Inputs | Output | Modo de fallo | ¿Bloquea? |
|---|---|---|---|---|---|
| 132 | Las 14 integridades referenciales | `acp.yml` | lista de referencias rotas | gate que apunta a un rol inexistente | **sí** |
| 112, 113 | Patrón e ids reservados aplicados a envelopes | perfil + evento | violación | `R2.1` usado como work item | sí |
| 129 | Coherencia trust level ↔ independencia | perfil | aviso | gate no evaluable con verdad | sí |

### 4.4 Motor de log de eventos (lector)

| Req | Invariante | Inputs | Output | Modo de fallo | ¿Bloquea? |
|---|---|---|---|---|---|
| 031 | Una raíz por hilo | log del item | `violation:duplicate-root` | dos historias paralelas | sí |
| 032 | Puntero resoluble | log | `violation:dangling-pointer` (flag) | cadena causal rota | no (flag) |
| 033 | Bifurcación causal | log | `contested` | trabajo sobre spec vieja | **sí** |
| 035 | Idempotencia | log | dedup | efecto duplicado | no |
| 067 | Independencia de la review | log + identidad | violación | auto-aprobación | **sí** |
| 078, 079 | Revalidación: mismo autor, TTL no reinicia | log + reloj | violación | review eterna | **sí** |
| 021 | Tolerancia del lector a campos desconocidos | evento | evento aceptado | pérdida de eventos válidos | no |

### 4.5 Verificador de identidad

| Req | Invariante | Inputs | Output | Modo de fallo | ¿Bloquea? |
|---|---|---|---|---|---|
| 011 | `on_behalf_of` no escala privilegios | evento + perfil | violación | delegación como escalada | **sí** |
| 086 | Una autorización no se infiere | log | violación | acción no autorizada | **sí** |

### 4.6 Motor de leases y reconciliación

| Req | Invariante | Inputs | Output | Modo de fallo | ¿Bloquea? |
|---|---|---|---|---|---|
| 058 | Caducidad real del lease | log + reloj | lease libre/vivo | dos agentes en el mismo item | sí |
| 059 | Split brain | log | `contested` | trabajo duplicado | sí |
| 052 | Solape de `touches` | items activos | `contested` | conflicto en el merge | no |

### 4.7 Verificador de artefactos y repositorio

| Req | Invariante | Inputs | Output | Modo de fallo | ¿Bloquea? |
|---|---|---|---|---|---|
| 045 | El SHA existe y es head | git | booleano | review sobre algo inexistente | **sí** |
| 046 | Deriva y TTL | git + reloj | frescura | gate con evidencia rancia | **sí** |
| 051 | Diff dentro de `touches` | git | violación | escritura fuera de superficie | sí |
| 080 | Diff fuera del ámbito revisado | git | booleano | revalidación indebida | **sí** |
| 047 | Evidencia existe y el digest cuadra | almacén | booleano | evidencia fabricada | **sí** |

### 4.8 Evaluador de autorización y gates

| Req | Invariante | Inputs | Output | Modo de fallo | ¿Bloquea? |
|---|---|---|---|---|---|
| 070, 071 | Satisfacción de gate entre eventos | log + perfil | gate satisfecho o no | merge sin fundamento | **sí, por definición** |
| 087 | Frescura y revocación de autorizaciones | log + reloj | vigente / muerta | deploy con permiso caducado | **sí** |
| 106 | Quien firma la deuda tiene autoridad | perfil + log | violación | deuda contraída por cualquiera | no |

### 4.9 Motor de proyección

| Req | Invariante | Inputs | Output | Modo de fallo | ¿Bloquea? |
|---|---|---|---|---|---|
| 102 | El checkpoint no sustituye al log | log + checkpoint | drift | historia perdida al leer | no |
| 018 | Preservar extensiones al reproyectar | evento | evento íntegro | pérdida de datos | no |

**Diecinueve de los treinta y dos bloquean algún gate.** Ese es el tamaño real de lo que hoy no valida nada.

---

## 5. Plan de suite de conformidad por capas

No se implementa aquí. Es el mapa de qué componente cierra qué.

| Capa | Qué comprueba | Requisitos | Estado |
|---|---|---|---|
| **L0** Sintaxis JSON | JSON bien formado, sin claves duplicadas | previo a todos | **existe** (comprobación trivial) |
| **L1** JSON Schema | los 101 requisitos `IMPLEMENTED` + `PARTIAL` de la matriz | REQ-001..136 salvo los 32 external | **existe**: schema V3 + 117 fixtures |
| **L2** Validación perfil-consciente | 112, 113, 129, 132, 106 | **no existe** — F-04 |
| **L3** Semántica del log de eventos | 021, 031, 032, 033, 035, 052, 058, 059, 067, 078, 079, 092, 093, 102 | **no existe** |
| **L4** Verificación de binding | 009, 010, 011, 025, 034, 045, 046, 047, 051, 080, 117 | **no existe** |
| **L5** Consistencia de proyección | 018, 020, 102 | **no existe** |
| **L6** Evaluación de gates | 070, 071, 086, 087 | **no existe** |

**Orden recomendado de construcción:** L2 primero, porque es la más barata (un fichero de perfil, sin acceso a red) y desbloquea las catorce integridades referenciales y la reserva de identificadores. Después L4 identidad, que es la que sostiene la separación de poderes. L3 y L6 al final, que son las caras.

---

## 6. Qué debería revisar Hermes de forma incremental

Para que la próxima revisión no repita esta:

1. **Solo F-01, F-07 y F-09** si se corrigen antes: son objetivas y su cierre es verificable en un minuto.
2. **El juicio que esta reconciliación no puede dar**: si los 32 external están bien clasificados o si alguno es en realidad expresable en JSON Schema y se marcó external por comodidad. Esa es exactamente la pregunta que el autor no puede responder sobre su propio trabajo.
3. **Las 25 filas `PARTIAL`**, en particular las 18 que solo esperan una fixture negativa: decidir cuáles merecen una y cuáles no.
4. **F-06**, la tensión de versionado: es una decisión de diseño, no un defecto, y necesita alguien que no la haya tomado ya.
