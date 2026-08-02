# ACP GitHub Binding

**Cómo se proyecta el protocolo ACP sobre GitHub, y qué GitHub no puede garantizar.**

| | |
|---|---|
| Título | **ACP GitHub Binding** |
| Versión | **`0.1.0-draft`** |
| Capa | **Binding** (ACP Core → plataforma) |
| Core objetivo | **ACP-1.1 amendment candidate** (`feat/acp-1-1-normative-amendments@1bda3e997291e337cc1a3956462e643219d71547`) |
| Schema de referencia | **envelope 0.3.0 / profile 0.3.0** (`feat/acp-envelope-schema@ae3e4f5e35924e470ad909d63d5a9de55c351df0`) |
| Estado | **`binding candidate — not adopted`** |
| Absorbe | `docs/agents/github-binding-draft.md` (`chore/agent-protocol-mvp`), cuyo análisis se conserva y se marca donde se discrepa |

> ### Advertencia
>
> Este documento **no activa ACP**, **no crea automatización** y **no autoriza ninguna operación sobre GitHub**.
>
> No contiene ni describe scripts, código, workflows, GitHub Actions, bots, GitHub Apps, webhooks, plantillas, labels, Projects ni llamadas a la API. Es exclusivamente arquitectura y especificación de capa.
>
> El Core al que se vincula es una **candidata sin aprobar**, y el schema de referencia es una **implementación de esa candidata**. Nada de lo descrito aquí está adoptado, y ningún requisito de este documento autoriza a nadie a actuar sobre el repositorio.

### Lenguaje normativo

**DEBE** / **NO DEBE** = requisito de conformidad del binding. **DEBERÍA** = recomendación fuerte con excepciones justificables. **PUEDE** = opción. Los requisitos llevan identificador `BIND-nnn`; los invariantes de plataforma, `INV-nn`. Ambos son citables desde la matriz de conformidad del Core.

### Advertencia sobre hechos de plataforma

Este documento afirma cosas sobre el comportamiento de GitHub. **Varias de esas afirmaciones no las he podido verificar contra la documentación oficial en el momento de escribir**, y el binding entero depende de ellas. Están recogidas una a una en **§13.1 (Hechos de plataforma por verificar)** con la comprobación exacta que las confirmaría o refutaría. **Ninguna afirmación marcada `[VERIFICAR]` debe usarse como base de una decisión de gate hasta comprobarse.** Un binding que presenta suposiciones sobre la plataforma como garantías es peor que no tener binding: da confianza sin fundamento.

---

## Índice

1. [Objetivos](#1) · 2. [Modelo GitHub](#2) · 3. [Mapping ACP → GitHub](#3) · 4. [Identidad](#4) · 5. [Almacenamiento de eventos](#5) · 6. [Modelo de evidencia](#6) · 7. [Proyección](#7) · 8. [Modos de fallo](#8) · 9. [Recuperación](#9) · 10. [Modelo de confianza](#10) · 11. [Seguridad](#11) · 12. [Invariantes específicos de GitHub](#12) · 13. [Limitaciones conocidas](#13) · 14. [Preguntas abiertas](#14) · 15. [Piloto manual](#15)

---

<a name="1"></a>
## 1. Objetivos

### 1.1 Qué resuelve el Binding

Una sola cosa, y conviene enunciarla con precisión: **el Binding decide dónde vive cada concepto de ACP dentro de GitHub, y qué se puede afirmar con verdad a partir de lo que GitHub garantiza.**

De ahí se derivan cinco responsabilidades concretas:

| # | Responsabilidad |
|---|---|
| B1 | Asignar cada entidad del Core a una primitiva de GitHub, y declarar cuál es autoritativa y cuál derivada |
| B2 | Producir los valores que el Core exige pero que el autor no puede fabricar: punteros causales, identidad observada, timestamps |
| B3 | Traducir las garantías de GitHub —y la ausencia de ellas— a la clasificación de evidencia que el Core usa para los gates |
| B4 | Definir qué hacer cuando GitHub se comporta de un modo que el Core no contempla: comentarios editados, force push, repos renombrados, caídas |
| B5 | Declarar los límites: qué no se puede garantizar sobre GitHub, para que nadie construya un gate encima |

### 1.2 Qué NO resuelve

| No resuelve | Dónde vive |
|---|---|
| El significado de los eventos, estados, gates o invalidación | ACP-1.1 (Core) |
| La forma exacta del envelope y sus reglas condicionales | Schema V3 (Implementation) |
| Qué roles, capacidades, TTLs y políticas rigen un programa | Profile |
| Cómo se calcula una proyección a partir del log | Projection Engine |
| Qué se comprueba y en qué capa | Conformance Suite |
| Ejecutar cualquier cosa | Nada de este documento. No hay automatización aquí |

**Regla de no invasión (BIND-001).** El Binding **NO DEBE** cambiar el significado de ningún concepto del Core. Si una primitiva de GitHub no encaja en el Core, el Binding declara la limitación; **no redefine el Core para que encaje**. Esta regla es la razón de existir de la separación en capas: en el momento en que el binding empieza a legislar, ACP deja de ser portable y pasa a ser «cómo trabajamos en GitHub».

### 1.3 La frontera, en una frase

> **El Core dice qué es verdad. El Binding dice qué se puede saber.**

Cuando el Core exige «una review anclada a un SHA fresco» y GitHub solo puede ofrecer «una review en la UI cuyo commit revisado no se muestra en la lista», la respuesta del Binding no es relajar el Core: es decir que ese dato es **débil** (§6) y no cuenta para el gate.

---

<a name="2"></a>
## 2. Modelo GitHub

Cada primitiva, evaluada por lo único que le importa al protocolo: **si cambia bajo tus pies, cómo se nombra sin ambigüedad, si el nombre sobrevive, y qué garantiza de verdad.**

Notación de mutabilidad: **INM** inmutable por construcción · **APP** append-only en la práctica · **MUT** mutable por cualquiera con permiso · **VOL** volátil, puede desaparecer.

### 2.1 Sustrato de código

| Entidad | Mut. | Identificador estable | Estabilidad del nombre | Qué garantiza | Qué NO garantiza |
|---|---|---|---|---|---|
| **Commit** | **INM** | SHA-1 de 40 hex | Permanente mientras exista una referencia | Direccionamiento por contenido: el mismo SHA es el mismo árbol, siempre | Que siga alcanzable: si nadie lo referencia, puede quedar huérfano y ser recolectado `[VERIFICAR]` |
| **Tree / Blob** | **INM** | SHA | Permanente | Contenido exacto de un fichero o directorio | Alcanzabilidad |
| **Branch (ref)** | **MUT** | nombre | Ninguna: se mueve, se borra, se renombra | Nada duradero. Es un puntero | Que apunte hoy a donde apuntaba ayer |
| **Tag** | **MUT** | nombre | Baja: puede moverse salvo protección | Nada por sí solo | Inmutabilidad, salvo reglas de protección |
| **Repository** | **MUT** en nombre, estable en id | `id` numérico de base de datos | `owner/name` **cambia** al renombrar o transferir; el `id` sobrevive `[VERIFICAR]` | Continuidad de identidad vía `id` | Que `owner/name` siga resolviendo al mismo repo |

**INV-01.** Un nombre de rama **NO DEBE** usarse jamás como ancla de evidencia. Solo el SHA completo de 40 hexadecimales minúsculas ancla una afirmación (ACP-1.1 §6.1).

**INV-02.** La identidad de un repositorio en el registro del binding **DEBE** ser el `id` numérico, no `owner/name`. `owner/name` es una etiqueta de presentación. Un repositorio renombrado no es un repositorio nuevo, y un `owner/name` reutilizado por otro repositorio no es el mismo.

### 2.2 Sustrato de coordinación

| Entidad | Mut. | Identificador | Estabilidad | Qué garantiza | Qué NO garantiza |
|---|---|---|---|---|---|
| **Issue** | **MUT** (cuerpo, título, labels, estado) | número por repo + `node_id` | El número no se reutiliza dentro del repo `[VERIFICAR]` | Contenedor persistente con hilo de comentarios | Que su cuerpo, labels o estado reflejen nada en particular |
| **Issue Comment** | **MUT** en contenido, **APP** en creación | `id` entero + `node_id` | El `id` no se reutiliza; **el comentario puede editarse y borrarse** | `created_at` asignado por la plataforma; autor observado; orden de creación | Inmutabilidad del cuerpo. **Ni append-only real** |
| **Pull Request** | **MUT** | número (comparte espacio con issues) + `node_id` | El número no se reutiliza | Asocia una rama a un destino; expone `head.sha` en un instante dado | Que `head.sha` sea el mismo que cuando alguien lo miró |
| **PR Review** | **APP** con estado derivado **MUT** | `id` | El `id` persiste | Que un actor emitió un veredicto sobre **un commit concreto** | Que el veredicto siga vigente: se descarta, caduca, o el head se mueve |
| **Review Comment** | **MUT** | `id` | Persiste | Comentario anclado a línea y commit | Que la línea siga existiendo |
| **Discussion** | **MUT** | número + `node_id` | Persiste | Hilo de larga vida fuera del ruido de issues | Ordenación fuerte; su API y permisos difieren de los de issues `[VERIFICAR]` |
| **Label** | **MUT** | nombre (y `id`) | **Renombrable y borrable**, y el renombrado se propaga a todo lo etiquetado | Filtrado y agregación baratos | **Nada.** Cualquiera con permiso las cambia sin dejar evento |
| **Milestone** | **MUT** | número | Persiste | Agrupación con fecha | Semántica alguna |
| **Project (v2)** | **MUT** | `id` de proyecto + `id` de item | Persiste | Vistas y campos personalizados | Que un campo no lo haya movido alguien a mano; historia de cambios |
| **Assignee** | **MUT** | login | — | Nada protocolario | Que el asignado esté trabajando, ni que tenga lease |

**INV-03.** Labels, cuerpo de issue, asignaciones, milestones, campos de Project y estado abierto/cerrado son **PROYECCIÓN**, nunca verdad de protocolo. Un cambio en cualquiera de ellos **NO ES** un evento ACP.

### 2.3 Sustrato de ejecución y evidencia

| Entidad | Mut. | Identificador | Estabilidad | Qué garantiza | Qué NO garantiza |
|---|---|---|---|---|---|
| **Check Run** | **MUT** hasta completarse, luego **APP** | `id` | Persiste mientras el repo exista | Asociación a un `head_sha` concreto y una conclusión | Que la conclusión se refiera al código actual; que no haya un re-run posterior |
| **Check Suite** | **MUT** | `id` | Persiste | Agrupación por SHA | Completitud |
| **Workflow Run** | **APP** una vez terminado; **re-ejecutable** | `id` (+ `run_attempt`) | Persiste | Que una ejecución concreta produjo una conclusión sobre un SHA | Que sea la única ejecución sobre ese SHA. **Un re-run cambia el resultado observable sin cambiar el SHA** |
| **Job / Step** | **APP** al terminar | `id` | Persiste | Detalle de ejecución | Retención de logs indefinida `[VERIFICAR]` |
| **Artifact** | **VOL** | `id` + nombre | **Caduca y se borra** (retención por defecto del orden de 90 días, configurable) `[VERIFICAR]` | Que existió un fichero con ese nombre en esa ejecución | Que siga descargable. **Ni su contenido, salvo que se registre un digest** |
| **Release** | **MUT** | `id` + tag | Persiste; el tag puede moverse | Punto de publicación nombrado | Inmutabilidad de los assets |
| **Deployment** | **APP** con estados **APP** | `id` | Persiste | Que se registró un despliegue a un entorno con un SHA | Que el entorno esté hoy en ese SHA |
| **Environment** | **MUT** | nombre | Renombrable | Nombre de destino y sus reglas de protección | Que sus reglas fueran las mismas ayer |
| **Audit log de organización** | **APP** | — | Retención dependiente del plan `[VERIFICAR]` | Rastro de acciones administrativas | Cobertura de ediciones de comentarios `[VERIFICAR]` |

**INV-04.** Un `workflow_run` re-ejecutado sobre el mismo SHA **produce evidencia nueva que puede contradecir a la anterior sin que ningún SHA cambie**. Toda evidencia de ejecución **DEBE** identificar la ejecución (`run_id` y, si existe, el intento), no solo el SHA. Sin el `run_id`, «los tests pasaron en `abc…`» es indistinguible de «los tests pasaron alguna vez en `abc…` y ahora fallan».

**INV-05.** Un artifact es evidencia **caduca por diseño**. Su digest, registrado en el evento, es lo único que sobrevive a su borrado.

### 2.4 Las tres primitivas que sostienen todo el binding

De las veinte entidades anteriores, solo tres dan garantías fuertes, y el binding entero se apoya en ellas:

1. **El SHA de commit** — direccionamiento por contenido. Es lo que hace computable la invalidación del Core.
2. **El `id` y el `created_at` de un comentario** — asignados por la plataforma, no por el autor. Es lo que hace posible el reloj causal y el reloj real sin confiar en el reloj de un agente.
3. **El autor observado de un comentario** — la única atribución que no es autodeclarada.

Todo lo demás es conveniencia o proyección. **Un binding sobre otra plataforma es viable si y solo si esa plataforma ofrece estas tres cosas** (ACP-1.1 §5.4.1: un binding que no puede producir punteros estables no es conforme).

---

<a name="3"></a>
## 3. Mapping ACP → GitHub

### 3.1 Tabla maestra

`A` = autoritativo · `D` = derivado (proyección) · `E` = evidencia

| Concepto ACP | Primitiva GitHub | Rol | Notas normativas |
|---|---|---|---|
| **Program** | Repositorio de coordinación + `acp.yml` | A | Un program, un repo de coordinación (Core §4.3) |
| **WorkItem** | Issue | A como contenedor | El número de issue **NO ES** necesariamente el `item` del Core (§3.2) |
| **Initiative** | Issue padre y/o Milestone | D | El vínculo autoritativo es el campo `initiative` del evento `spec`, no la relación de GitHub |
| **Event** | Issue comment con marcador ACP | **A** | La única primitiva de GitHub con `id` y `created_at` de plataforma en un hilo (§5) |
| **Event pointer** (`after`) | `github-comment:<id>` | A | El binding lo produce **después** de publicar (§5.4) |
| **Projection** | Cuerpo del issue + labels + Project | D | Regenerable, nunca autoritativa (INV-03) |
| **Checkpoint** | Comment ACP `type: checkpoint`, enlazado desde el cuerpo | A | El enlace en el cuerpo es proyección; el comentario es la verdad |
| **Basis** | `{system: git, id: <repo id>}` + ref + SHA de 40 | A/E | INV-01, INV-02 |
| **Delivery** | PR (o commit / artifact / externo) | E | `delivery.kind: change-request`; el número de PR va en `extensions.x-github-pr` |
| **Evidence** | Check run + workflow run + artifact + digest | E | Clasificada por fuerza en §6 |
| **Lease** | Eventos `claim` / `heartbeat` / `release` | A | **GitHub no tiene primitiva de lease.** No hay assignee, label ni draft que lo represente (§3.4) |
| **Gate** | Definición en `acp.yml` + evento `validate` | A | Las branch protection rules son **evidencia**, no el gate |
| **Approval** (Core) | Evento `approve` | A | Un «Approve» de PR es **evidencia**, no un `approve` de ACP (§3.5) |
| **Authorization** | Evento `authorize` del PO | A | Ni el botón de merge, ni una reacción, ni un label autorizan nada |
| **Question / Answer** | Eventos `question` / `answer` | A | Una respuesta en prosa **no es** un `answer` |
| **Assume** | Evento `assume` | A | El vencimiento se calcula contra `created_at` de la pregunta (§4.5) |
| **Risk / Debt** | Evento + issue en el registro del program | A / D | El issue de registro es proyección del evento |
| **Violation** | Evento `violation` | A | Ver limitación en §13.4: ocho códigos de ACP-1.1 no son hoy emitibles por el schema |
| **Review** | Evento `review` (+ PR review como evidencia) | A / E | §3.5 |
| **Revalidate** | Evento `revalidate` | A | El diff que justifica el ámbito es evidencia de git |
| **Handoff** | Evento `handoff` | A | Quitar un assignee no es un handoff |
| **Reconcile** | Evento `reconcile` | A | No reescribe historia de GitHub; registra la interpretación aceptada |
| **Program checkpoint** | Discussion en categoría dedicada | D→A | Contiene el resumen; los eventos que lo respaldan siguen en sus issues |
| **Rama de trabajo** | `acp/<item>/<slug>` | D | Derivable en ambos sentidos; es conveniencia, no verdad |

### 3.2 `item` frente a número de issue

**BIND-002.** El `item` del Core y el número de issue de GitHub son **espacios de nombres distintos**. El binding **DEBE** registrar la correspondencia explícitamente y **NO DEBE** derivar uno del otro por convención implícita.

Razón, y no es teórica: el Core admite cualquier token estable (ACP-1.1 §4.2, enmienda A12), un item puede **rotar** a otro issue conservando su identidad lógica (§11.5 del Core), y un item puede sobrevivir a la migración del repositorio. Si `RF-142` significa «issue 142» por convención, la rotación rompe la identidad y la migración la destruye.

**BIND-003.** El perfil **DEBE** declarar la política de identificadores (`ids.work_item_pattern`). El binding **NO DEBE** aceptar como `item` un identificador que el perfil reserve. Hoy esta comprobación **no la hace nada** (§13.3).

### 3.3 Program-level frente a item-level

ACP-1.1 §5.2.1 exige exactamente uno de `item` o `program`. En GitHub:

| Sujeto | Dónde se publica el evento |
|---|---|
| `item: <id>` | Comentario en el issue del work item |
| `program: <id>` | Comentario en el **issue de programa** designado, o en una Discussion de la categoría de programa |

**BIND-004.** El perfil **DEBE** designar exactamente un contenedor para eventos de programa. Si no lo hace, los eventos de programa quedan dispersos y el arranque en frío no puede encontrarlos, que es precisamente lo que la recuperación necesita.

**BIND-005.** Un evento **NO DEBE** publicarse en un contenedor que no corresponda a su sujeto. Un evento con `item: RF-142` publicado en el issue 987 es un evento mal ubicado: su puntero causal apunta a otro hilo y la reconstrucción del item lo pierde.

### 3.4 Leases: lo que GitHub no tiene

**No existe primitiva de lease en GitHub.** Ni assignee, ni label, ni draft PR, ni Project field lo representan, porque ninguno tiene caducidad, exclusividad ni timestamp de plataforma en el sentido que el Core necesita.

**BIND-006.** El lease vive **exclusivamente** en el log: `claim` lo abre, `heartbeat` lo extiende, `release` lo cierra, y su caducidad se calcula contra el `created_at` que GitHub asignó al evento.

**BIND-007.** Ninguna de estas acciones libera un lease: cerrar el PR, quitarse el assignee, cambiar un label, cerrar el issue, terminar la sesión del agente. **Solo un `release` o la caducidad.**

**BIND-008.** El binding **PUEDE** reflejar el lease en un assignee o un label como proyección, y **DEBE** documentar que esa proyección puede estar desactualizada respecto al log.

### 3.5 Lo que la UI de GitHub parece decir y no dice

La tabla más importante de este documento. Cada fila es una confusión que ya ha ocurrido en equipos reales:

| Lo que se ve en GitHub | Lo que un agente asume | Lo que significa en ACP |
|---|---|---|
| Review «Approved» | El código está aprobado | **Evidencia** de un veredicto sobre un commit. Si el head se movió, es `STALE`. No es un `approve` de ACP, que además necesita `gate`, `basis` y `ttl` |
| Checks verdes | Las validaciones pasan | Evidencia sobre **un SHA y un run concretos**. Un re-run posterior puede haberlas puesto rojas sin cambiar el SHA (INV-04) |
| Botón de merge habilitado | Está autorizado mergear | Solo dice que las branch protection rules se cumplen. **La autorización es un evento `authorize` del PO** |
| Issue cerrado | El trabajo está hecho | Proyección. La fase del item la fija un evento `close` con `resolution` |
| Label `acp/phase:done` | La fase es DONE | Índice regenerable. Cualquiera pudo ponerla a mano |
| Assignee asignado | Hay alguien trabajando | Nada. Solo un `claim` vivo significa eso |
| Comentario «adelante, hazlo» | Hay autorización | Conversación. **Una autorización no se puede inferir** (Core §13.5) |
| PR en draft | El trabajo no está listo | Convención social. La fase la fija el log |
| Reacción 👍 del PO | Consentimiento | Nada en absoluto |
| Silencio de un humano | Aprobación tácita | El silencio **nunca** autoriza acciones sensibles (Core §13.6) |

**BIND-009.** El binding **NO DEBE** derivar ningún evento ACP automáticamente de un estado de la UI. Un estado de la UI **PUEDE** citarse como evidencia dentro de un evento que un actor autorizado escribe explícitamente.

Esta es, con diferencia, la regla que más trabajo evita a largo plazo y la que más incomoda al principio: significa que aprobar un PR en la interfaz **no hace nada** en el protocolo hasta que alguien escribe el evento.

---

<a name="4"></a>
## 4. Identidad

El Core (§8.6) define cuatro conceptos y deja explícitamente su realización al binding. Aquí se realiza.

### 4.1 Los cuatro conceptos en GitHub

| Concepto Core | Realización en GitHub | Quién lo produce | Falsificable |
|---|---|---|---|
| **`declared_actor`** | Campo `actor` del envelope | el autor | **Sí, trivialmente**: es texto |
| **`observed_actor`** | `comment.user.login` (y su `id` numérico) | GitHub | No por el autor del comentario. Sí por quien controle la cuenta |
| **`identity_assurance`** | Nivel 1–5 declarado en `acp.yml` | el perfil | Sí: es una declaración, no una medición |
| **`identity_mismatch`** | Resultado de comparar los dos anteriores con el mapa del perfil | el binding | — |

**BIND-010.** El `observed_actor` **NO DEBE** aparecer nunca en el envelope authored. Vive en el registro del binding, junto al `id` del comentario y su `created_at`. Un envelope que declare su propia identidad observada está afirmando algo que no le corresponde afirmar.

**BIND-011.** El binding **DEBE** identificar al actor observado por el **`id` numérico de la cuenta**, no solo por el login. Los logins de GitHub se pueden cambiar, y —según entiendo, `[VERIFICAR]`— un login liberado puede ser reclamado por otra cuenta. Un log que atribuye eventos por login es un log que se puede reescribir sin tocarlo.

### 4.2 La escalera de garantía, aterrizada

| Nivel | Realización concreta en GitHub | Qué permite afirmar | Qué no |
|---|---|---|---|
| **1 · autodeclarada** | Todos los agentes publican con la cuenta de una persona | Nada sobre autoría | Ninguna separación de poderes |
| **2 · cuenta compartida** | Una cuenta de máquina común a varios agentes | Que el evento salió de esa cuenta | Distinguir dos agentes entre sí |
| **3 · cuentas distintas** | Una cuenta de máquina por agente | Que dos eventos son de cuentas distintas | Que detrás de la cuenta esté el modelo que dice el perfil |
| **4 · identidad de máquina firmada** | GitHub App con installation propia por agente | Atribución fuerte y permisos acotados | Que el proceso que la usó sea el declarado |
| **5 · credenciales gestionadas** | Identidades gestionadas por la organización, con rotación y auditoría | Todo lo anterior más rastro administrativo | Lo mismo: la identidad del *proceso* está fuera de ACP |

**BIND-012.** El nivel 3 es el **mínimo para que la independencia de revisión sea comprobable**. Por debajo de 3, el binding **DEBE** publicar toda evaluación de gate que dependa de independencia marcada como **no verificada**, y el perfil **DEBE** declarar `review.independence_guaranteed: false`.

**BIND-013.** El binding **NO DEBE** afirmar que un evento es auténtico por el hecho de llevar `actor`. La presencia de `actor` compra **auditabilidad** —una afirmación que el perfil puede contradecir— no autenticidad.

### 4.3 Cuenta compartida: el caso real

Es el estado actual del programa de referencia (`identity.trust_level: 1`, cinco handles `@TODO`). El binding **DEBE** tratarlo así:

1. Todo evento se acepta y se registra con su `observed_actor` compartido.
2. Toda comparación declarada↔observada devuelve **indeterminado**, no «coincide».
3. Todo gate con requisito de independencia se evalúa a **no satisfecho por falta de evidencia de identidad**, no a satisfecho.
4. El hecho se declara en el Program Checkpoint, no solo en el fichero de perfil.

El punto 3 es incómodo a propósito. La alternativa —dar por bueno el gate porque «sabemos quién es cada uno»— convierte la separación de poderes en decoración.

### 4.4 `on_behalf_of`

**BIND-014.** Cuando un actor publica por otro, `actor` es **quien opera** y `on_behalf_of` **quien responde**. El `observed_actor` corresponderá al que opera. Las capacidades se comprueban contra `actor`, **nunca** contra `on_behalf_of` (Core §8.6 regla 5): en caso contrario la delegación es una escalada de privilegios con otro nombre.

**BIND-015.** El binding **DEBE** rechazar como `identity_mismatch` un evento cuyo `on_behalf_of` no exista en el perfil.

### 4.5 Detección de conflictos de identidad

| Conflicto | Señal observable | Efecto |
|---|---|---|
| Actor declarado no existe en el perfil | `actor` ∉ `agents[].id` | `violation:unauthorized`, efecto `void` |
| Declarado y observado no se corresponden | mapa del perfil | `violation:identity-mismatch`, **crítica**, `void` |
| Un actor emite un tipo de evento sin su capacidad | `roles[<rol>].capabilities` | `violation:unauthorized`, `void` |
| Auto-aprobación | `submit.observed_actor == review.observed_actor` sobre el mismo `basis.sha` | `violation:self-approval` |
| Cuenta compartida presentada como independencia | `trust_level < 3` y gate de independencia satisfecho | Fallo del binding, no del autor |
| Login cambiado entre eventos | `user.id` igual, `login` distinto | No es conflicto: el `id` manda (BIND-011) |
| Misma persona con dos cuentas | **no detectable** | Fuera del protocolo (§10.3) |

---

<a name="5"></a>
## 5. Almacenamiento de eventos

### 5.1 Dónde

**BIND-016.** Un evento ACP **DEBE** ser un **comentario de primer nivel** en el issue (o Discussion) que corresponde a su sujeto. **NO DEBE** ser: el cuerpo del issue, un review comment de PR, un comentario dentro de un hilo de review, un commit message, ni la descripción de un PR.

Razones, una por exclusión: el cuerpo se edita y no tiene `created_at` propio por versión; los review comments desaparecen cuando la línea desaparece; los hilos de review tienen semántica de resolución que colisiona con la del protocolo; los commit messages se reescriben con un rebase; la descripción del PR es un campo mutable único.

### 5.2 Cómo se distingue un evento de una conversación

**BIND-017.** Un evento **DEBE** llevar **dos** marcas: un marcador HTML oculto y un bloque de código con etiqueta propia. Un comentario sin **ambas** es conversación y no tiene efecto de protocolo.

Por qué dos y no una: el marcador oculto permite localizar candidatos de forma barata y sobrevive a que alguien cite el comentario; la etiqueta del bloque delimita sin ambigüedad dónde acaba el envelope y empieza la prosa. Con solo el marcador, citar un evento en otro comentario lo convertiría en evento. Con solo la etiqueta, cualquier bloque de código YAML de una conversación técnica sería candidato.

**BIND-018.** Un comentario marcado con un envelope **inválido** es una **violación de binding**: no actualiza proyecciones, no cuenta para gates, y **DEBE** ser señalado. No se ignora en silencio: un envelope roto es más peligroso que una conversación, porque parece un evento.

### 5.3 Las cuatro propiedades que hay que preservar

| Propiedad | Cómo la da GitHub | Fuerza |
|---|---|---|
| **Autoría observada** | `comment.user.id` | Fuerte, dentro del modelo de cuentas |
| **Instante de recepción** | `comment.created_at` | Fuerte. **Es el único reloj de confianza del protocolo** |
| **Orden de creación** | `created_at` y, para desempatar, `id` creciente `[VERIFICAR]` | Fuerte para el orden, no para causalidad |
| **Identidad del evento** | `comment.id` | Fuerte: no se reutiliza `[VERIFICAR]` |

**BIND-019.** El orden de creación **NO ES** la causalidad. El orden es un hecho de la plataforma; la causalidad la declara `after`. Dos eventos consecutivos en el tiempo pueden ser una bifurcación causal, y un evento posterior puede referirse a un estado anterior. La proyección **DEBE** usar `after`, y el orden temporal **solo** para desempatar y para calcular caducidades.

### 5.4 El problema de publicar

Un evento no puede conocer su propio `id` antes de existir. Consecuencia normativa:

**BIND-020.** El envelope authored **NO DEBE** contener su propio puntero. `after` referencia al **predecesor**, que ya existe. El puntero del evento actual lo asigna GitHub y lo registra el binding.

**BIND-021.** Antes de publicar, el autor **DEBE leer** el último evento del hilo para obtener su `id`. **NO DEBE** recordarlo, deducirlo por incremento, ni reutilizar uno visto antes. Es el punto donde un agente falla con más facilidad y menos ruido: un `after` inventado con la forma correcta pasa el schema.

### 5.5 Edición: append-only lógico

**GitHub no ofrece un log append-only.** Los comentarios se editan y se borran. El Core asume inmutabilidad. El binding no puede crear la garantía; puede hacer **detectable su ruptura**.

**BIND-022.** Un evento ACP publicado **NO DEBE** editarse jamás. Las correcciones se hacen con un evento nuevo (`supersede`, `reconcile` o `violation`).

**BIND-023.** El binding **DEBE** tratar como **`VOID` por edición** cualquier evento cuyo `updated_at` difiera de su `created_at`, salvo que exista una excepción declarada en el perfil y un evento que la justifique. Es una regla dura y produce falsos positivos —arreglar una errata en la prosa invalida el evento— y es preferible a la alternativa: un log donde el contenido puede cambiar y nadie lo nota.

**BIND-024 (sellado del log).** Para hacer detectable una edición **retroactiva** —una que ocurre después de que alguien leyera el evento— el binding **DEBERÍA** usar el mecanismo que el Core ya tiene: **el `checkpoint` publica, en `covers`, el rango de eventos que absorbe; el binding lo extiende registrando el digest del contenido de cada evento cubierto.**

El efecto es que el log queda **encadenado por sellos**: editar un evento antiguo ya sellado produce una discrepancia entre su contenido actual y el digest publicado en un checkpoint posterior, y esa discrepancia la ve cualquiera que compare, sin ninguna herramienta activa. No impide la edición. La hace **evidente**, que es la propiedad que el Core pide de verdad (tamper-evident, no tamper-proof).

Coste honesto: los digests hay que calcularlos y pegarlos, y en modo manual eso es trabajo real por checkpoint. En el piloto (§15) se recomienda sellar **solo los eventos que sostienen gates** —`submit`, `review`, `validate`, `approve`, `authorize`— y no los `progress` ni `heartbeat`.

### 5.6 Borrado

**BIND-025.** Borrar un evento ACP es una **violación crítica**. El binding **DEBE** detectarlo por dos vías: un hueco en la cadena de `after` (alguien referencia un puntero que ya no resuelve) o una discrepancia con un `covers` de checkpoint que citaba el evento desaparecido.

**BIND-026.** Un puntero que no resuelve **NO DEBE** anular el evento que lo cita. Efecto `flag`, no `void` (Core §5.4.1): el contenido puede seguir siendo cierto, y la causa puede ser una caída de plataforma, no un autor. Distinguir «mal formado» de «no resoluble» importa porque el remedio es distinto.

**BIND-027.** El borrado **NO ES** reversible por el protocolo. La única mitigación real es el archivado externo, que este documento no especifica y que §14 recoge como pregunta abierta.

### 5.7 Ocultar sin borrar

GitHub permite **minimizar** comentarios (marcarlos como *outdated*, *resolved*, etc.).

**BIND-028.** Minimizar un evento **NO** cambia su efecto de protocolo. Un evento minimizado sigue contando. El binding **PUEDE** minimizar eventos rutinarios ya cubiertos por un checkpoint como ayuda visual, y **NO DEBE** minimizar eventos de gate, violaciones ni autorizaciones: hacerlo esconde de la vista humana precisamente lo que hay que poder auditar.

---

<a name="6"></a>
## 6. Modelo de evidencia

### 6.1 Cuatro clases, y solo la primera es fuerte

| Clase | Definición | Ejemplos en GitHub | Caduca | Cuenta para un gate |
|---|---|---|---|---|
| **E1 · direccionada por contenido** | El identificador **es** el contenido | SHA de commit/tree/blob; digest `sha256:` de una salida normalizada | **No** | **Sí** |
| **E2 · atestiguada por plataforma** | GitHub afirma que algo ocurrió, con identificador estable | conclusión de check run + `head_sha`; `workflow_run` + `run_id`; PR review + commit revisado; deployment | No la afirmación; sí su vigencia | **Sí, con basis y run explícitos** |
| **E3 · recuperable** | El contenido existe hoy y puede no existir mañana | artifact, logs de job, assets de release | **Sí** | Solo si se registró digest (pasa a E1) |
| **E4 · estado de interfaz** | Un campo mutable que refleja una situación actual | estado del PR, labels, assignee, milestone, campo de Project, issue abierto/cerrado | Continuamente | **No, nunca** |

**BIND-029.** Un gate **NO DEBE** satisfacerse con evidencia E4. Ni una sola.

**BIND-030.** Una evidencia E2 **DEBE** citar el identificador de la ejecución además del SHA (INV-04). «Los checks están verdes en `abc…`» sin `run_id` no es citable: no distingue entre la ejecución que se miró y un re-run posterior.

**BIND-031.** Una evidencia E3 sin digest **DEBE** registrarse con `reproducible: false` y **NO DEBE** sostener sola un gate de riesgo alto. Cuando el artifact caduque, lo único que quedará es la afirmación de que existió.

### 6.2 Composición canónica de una evidencia en GitHub

Los campos del Core (`cmd`, `env`, `result`, `id`, `location`, `retention`) se rellenan así, con lo específico de GitHub en `extensions`:

| Campo Core | Contenido en el binding |
|---|---|
| `cmd` | El comando exacto, incluida la normalización aplicada antes de digerir |
| `env` | Imagen del runner, versiones relevantes, entorno. **Obligatorio**: el caso real del programa de referencia —una imagen de Postgres distinta en CI y en producción— fue una evidencia correcta que sostuvo una conclusión falsa por no declarar el entorno |
| `result` | `pass` / `fail` / `inconclusive` |
| `id` | `sha256:` de la salida normalizada |
| `location` | Dónde estaba (referencia a la ejecución o al artifact) |
| `retention` | Ventana declarada, para saber cuándo dejará de ser recuperable |
| `extensions` | `x-github-run-id`, `x-github-check-run-id`, `x-github-artifact-id`, `x-github-pr` |

**BIND-032.** Lo específico de GitHub va en `extensions`. Los campos Core **NO DEBEN** contener sustantivos de plataforma: es la misma regla que sacó `pr` del Core (ACP-1.1 A6).

### 6.3 Caducidad y frescura

| Evidencia | Qué la invalida |
|---|---|
| Commit SHA | Nada. Puede volverse inalcanzable, no falso |
| Check run / workflow run | Que el SHA deje de ser el head; un re-run posterior sobre el mismo SHA |
| PR review | Que el head del PR se mueva (`STALE`), que se descarte, o el `review_ttl` del perfil |
| Artifact | Su ventana de retención |
| Deployment | Un despliegue posterior al mismo entorno |
| Digest | Nada, si la normalización está declarada |

**BIND-033.** La frescura se recalcula **en el momento de cruzar el gate**, no cuando se produjo la evidencia. Es la regla del Core (§6.2) y en GitHub tiene una consecuencia práctica: hay que releer el head de la rama, no confiar en lo que se leyó al empezar la revisión.

### 6.4 La review de PR como evidencia

**BIND-034.** Una PR review es **E2**, no un evento ACP. Puede citarse dentro de un evento `review` si y solo si: la identidad del revisor mapea al `actor` declarado, el commit revisado se cita como SHA completo, el ámbito es explícito, el veredicto mapea sin ambigüedad, y el evento incluye sus declaraciones de incertidumbre.

**BIND-035.** El estado «Approved» de la UI **NO DEBE** tomarse como fresco sin comprobar contra qué commit se emitió. GitHub muestra ese estado de forma prominente y el commit revisado de forma discreta; la asimetría visual es una trampa de diseño ajena que el binding tiene que contrarrestar con una regla explícita.

---

<a name="7"></a>
## 7. Proyección

Este documento **no** define el algoritmo de proyección —eso es el Projection Engine— sino **qué es proyectable en GitHub, qué no debe almacenarse, y qué pasa cuando GitHub cambia por debajo**.

### 7.1 Qué se deriva

| Vista | Se deriva de |
|---|---|
| Cuerpo del issue | Todos los eventos válidos del item, en orden causal |
| Labels `acp/*` | Fase, frescura y modificadores del estado compuesto |
| Assignee | Titular del `claim` vivo |
| Milestone | `initiative` del `spec` |
| Campos de Project | Los mismos datos que las labels, con más granularidad |
| Colas por rol | Consultas sobre labels |
| Program Checkpoint | Estado de todos los items en vuelo |

### 7.2 Qué nunca debe almacenarse

**BIND-036.** Los siguientes datos **NO DEBEN** existir *solo* en una proyección. Si no se pueden reconstruir del log, no existen:

- fase, frescura o modificadores de un item;
- quién tiene el lease y hasta cuándo;
- si un gate está satisfecho;
- si hay una autorización vigente;
- qué evidencia sostiene qué afirmación;
- qué se declaró como no verificado;
- el veredicto de una review y su basis.

**BIND-037.** Corolario operativo: **mover una tarjeta en un Project no cambia nada.** El binding **DEBE** decirlo explícitamente en la documentación del programa, porque el instinto de cualquiera ante un tablero es arrastrar tarjetas, y en el momento en que el tablero tiene autoridad el log deja de ser la verdad.

### 7.3 Recálculo

**BIND-038.** Toda proyección **DEBE** ser reconstruible sin pérdida a partir de: el log de eventos válidos, los registros del binding, y los heads actuales de las ramas implicadas. Si algo no se puede reconstruir, es un defecto del modelo de eventos, no de la proyección.

**BIND-039.** El cuerpo del issue **DEBERÍA** declarar de qué evento es proyección (`acp:projection-of: github-comment:<id>`). Con eso, detectar drift es comparar un puntero con el último evento del hilo, sin comparar contenidos.

**BIND-040.** Ante discrepancia entre proyección y log, **gana el log**, la proyección se marca obsoleta, y ningún gate sensible se evalúa contra la proyección hasta que haya un `reconcile`.

### 7.4 Qué ocurre si GitHub cambia algo

| Cambio en GitHub | Efecto sobre la proyección | Efecto sobre el log |
|---|---|---|
| Alguien edita el cuerpo del issue | Proyección obsoleta | Ninguno |
| Alguien cambia labels a mano | Índice corrupto; la siguiente reconciliación lo regenera | Ninguno |
| Se renombra una label | Todas las proyecciones que la usaban quedan mal etiquetadas a la vez | Ninguno |
| Se borra una label | Se pierde el índice, no el estado | Ninguno |
| Se cierra el issue | Proyección de fase engañosa | Ninguno |
| Se mueve una tarjeta de Project | Nada | Ninguno |
| Se edita un evento | — | **Evento `VOID`** (BIND-023) |
| Se borra un evento | Proyección irreconstruible en ese tramo | **Violación crítica** (BIND-025) |
| GitHub cambia el comportamiento de una primitiva | Puede invalidar un supuesto de §13.1 | Puede invalidar el binding: requiere versión nueva |

**BIND-041.** El binding tiene **su propia versión** (`binding: github@0.1.0` en el perfil). Un cambio en el comportamiento de GitHub que afecte a cualquier invariante de §12 **DEBE** producir una versión nueva del binding, no un parche silencioso: los eventos ya publicados se interpretaron bajo el binding vigente entonces.

---

<a name="8"></a>
## 8. Modos de fallo

Para cada uno: cómo se detecta, qué efecto tiene, cómo se recupera, quién lo hace.

| # | Fallo | Señal observable | Efecto de protocolo | Recuperación | Quién |
|---|---|---|---|---|---|
| **F1** | **GitHub caído / inaccesible** | Lecturas fallan | **Ninguno.** El log no cambia. Lo que **no** puede pasar es dar por buena una lectura que no se hizo | Reintentar. Toda afirmación que dependía de la lectura se registra en `unverified` | el agente |
| **F2** | **Rate limit** | Respuestas de límite excedido | Igual que F1, pero parcial y silencioso: el riesgo es una lectura incompleta que parece completa | Registrar la lectura como parcial y no cruzar gates con ella | el agente |
| **F3** | **Comentario editado** | `updated_at ≠ created_at`; o discrepancia con el digest de un sello | Evento **`VOID`** | Evento nuevo que reemplaza; `violation` si hubo mala fe | quien detecta |
| **F4** | **Comentario borrado** | Puntero que no resuelve; hueco frente a `covers` | **Violación crítica.** El evento que lo citaba pasa a `flag` | `reconcile` que declara la interpretación aceptada. **Irrecuperable sin archivo externo** | coordinador |
| **F5** | **PR cerrado sin merge** | Estado del PR | **Ninguno por sí solo.** No libera el lease ni cambia la fase | Un evento explícito (`release`, `close`, `supersede`) | el ejecutor |
| **F6** | **Force push** | El SHA anterior deja de ser alcanzable desde la rama | Toda afirmación anclada a él pasa a **`STALE`**. Si el SHA se vuelve inalcanzable, la evidencia además deja de ser **verificable** | Nuevo `submit`/`review` sobre el nuevo SHA. `revalidate` **no** aplica: no hay diff comparable si el viejo desapareció | el ejecutor |
| **F7** | **Rebase** | Nuevos SHAs para el mismo contenido lógico | Igual que F6: **la identidad de la evidencia es el SHA, no el contenido** | `revalidate` **solo si** el SHA viejo sigue alcanzable y el diff es comparable; si no, review nueva | revisor original |
| **F8** | **Cambio de SHA (normal)** | `head ≠ basis.sha` | `STALE` (regla R1) | `revalidate` si el diff cae fuera del ámbito revisado; si no, review completa | revisor original |
| **F9** | **Repositorio renombrado** | `owner/name` cambia; el `id` no | **Ninguno si el basis usa el `id`** (INV-02). Si usa `owner/name`, todas las referencias quedan colgando | Ninguna, si se siguió INV-02 | — |
| **F10** | **Repositorio transferido** | Cambia el owner | Igual que F9, más posible cambio del modelo de permisos | Revisar el perfil: los actores pueden haber perdido capacidades | PO |
| **F11** | **Fork** | Existe un repo distinto con la misma historia | Los eventos del fork **no** pertenecen al program. Los SHAs coinciden y **los `id` de comentario e issue no** | Ninguna: el sujeto es el program, no el árbol de código | — |
| **F12** | **Cambio de permisos** | Un actor pierde escritura o lectura | Los eventos ya publicados siguen válidos; los futuros pueden ser imposibles | Reasignar rol en el perfil, o `handoff` | PO |
| **F13** | **Migración de plataforma** | Otro forge | Los punteros `github-comment:*` no resuelven | Congelar, sellar y volver a empezar con un binding nuevo, enlazando por `continues` | coordinador |
| **F14** | **Issue transferido a otro repo** | Cambia el número y el repo | Los punteros del hilo pueden dejar de resolver `[VERIFICAR]` | Tratar como rotación con `continues` | coordinador |
| **F15** | **Dos eventos con el mismo `after`** | Bifurcación causal | Item `contested`; ningún gate se cruza | `reconcile` con `after_multi` | coordinador |
| **F16** | **Reloj del agente equivocado** | — | **Ninguno**, por construcción: nada authored lleva instantes absolutos | Ninguna. Es un fallo que el Core ya eliminó (I4) | — |
| **F17** | **Notificación no entregada** | El humano no responde | El vencimiento corre igual: **el silencio tiene semántica definida** | El default se aplica y se registra `assume` + `risk` | quien lo detecte |
| **F18** | **Re-run de workflow** | Mismo SHA, `run_id` distinto | Evidencia nueva que puede contradecir la anterior | Citar el `run_id` (BIND-030); reevaluar el gate | quien evalúa |
| **F19** | **Artifact caducado** | Descarga imposible | La evidencia deja de ser recuperable; sobrevive el digest | Re-ejecutar el comando y comparar digests | el ejecutor |
| **F20** | **Evento en el contenedor equivocado** | Sujeto que no corresponde al hilo | El item pierde el evento en la reconstrucción | Republicar en el hilo correcto y `violation` en el equivocado | quien detecta |

**BIND-042 (regla general de fallo).** Ante cualquier fallo de lectura o de disponibilidad, el binding **DEBE registrar lo que no pudo verificar** y **NO DEBE inferirlo**. Es la traducción al binding del invariante I5 del Core: la diferencia entre «los checks pasan» y «no pude leer los checks» es exactamente la diferencia entre una afirmación y una alucinación.

---

<a name="9"></a>
## 9. Recuperación

### 9.1 Datos mínimos para reconstruir un work item

**BIND-043.** Un item **DEBE** ser reconstruible desde GitHub con **solo** estos datos:

1. La identidad del repositorio de coordinación (`id`, no nombre).
2. El identificador del contenedor del item (número de issue).
3. Todos los comentarios marcados como eventos ACP, con sus `id`, `created_at`, `updated_at` y autor observado.
4. El perfil activo (`acp.yml`) en su versión vigente.
5. Los heads actuales de las ramas citadas en los basis.

Nada más. Si hace falta algo que no esté en esa lista —la memoria de alguien, un chat, un tablero— **la recuperación ha fallado y el defecto está en el modelo de eventos**.

### 9.2 Orden de reconstrucción

| Paso | Qué | Salida |
|---|---|---|
| 1 | Localizar el último `checkpoint` válido | Punto de partida acotado |
| 2 | Leer solo los eventos posteriores | Log mínimo suficiente |
| 3 | Adjuntar el registro de binding a cada evento | Autor observado, instantes |
| 4 | Validar sintaxis contra el schema de la versión del evento | Válidos / no conformes |
| 5 | Verificar `updated_at` y sellos | Eventos `VOID` por edición |
| 6 | Resolver la cadena de `after` | Huecos, bifurcaciones |
| 7 | Comparar declarado ↔ observado con el perfil | Mismatches |
| 8 | Traer heads de ramas y recalcular frescura | Qué afirmaciones siguen vivas |
| 9 | Recalcular leases contra `created_at` | Qué está reclamado de verdad |
| 10 | Aplicar los eventos en orden causal | Estado compuesto |
| 11 | Comparar con la proyección publicada | Drift |

**BIND-044.** El paso 5 **DEBE** ejecutarse antes del 10. Aplicar un evento editado como si fuera íntegro es la forma más silenciosa de corromper el estado reconstruido.

### 9.3 Validación de la recuperación

**BIND-045.** Una recuperación se declara válida solo si: todos los `after` resuelven; no hay bifurcaciones sin `reconcile`; ningún evento de gate está `VOID`; la frescura se recalculó contra heads reales; y el presupuesto de lectura del perfil no se excedió. Si algo falla, la recuperación es **parcial** y **DEBE** publicarse como tal.

### 9.4 Si falta información

| Falta | Efecto | Qué hacer |
|---|---|---|
| Un checkpoint | Hay que leer más log; puede exceder el presupuesto | Emitir checkpoint antes de trabajar |
| Un evento intermedio (borrado) | Cadena causal rota | `reconcile` declarando el tramo no reconstruible. **No inventar el contenido** |
| El perfil de la época del evento | No se sabe qué política regía | Leer el perfil por su SHA histórico; si no consta, tratar las evaluaciones de gate de ese tramo como no verificadas |
| Un artifact | Evidencia no recuperable | Re-ejecutar y comparar digests, o degradar la afirmación |
| Un SHA (inalcanzable) | Evidencia no verificable | Nueva afirmación sobre el head actual |
| La identidad observada (evento antiguo) | Atribución indeterminada | Registrar el nivel de garantía de la época, no el actual |

**BIND-046.** Ante información ausente, el resultado **DEBE** ser un estado explícitamente incompleto, **nunca** un estado completo con huecos rellenados por inferencia. Un estado que dice «no sé qué pasó entre estos dos eventos» es utilizable; uno que se lo inventa, no.

---

<a name="10"></a>
## 10. Modelo de confianza

### 10.1 Lo que el Binding puede asumir

| Asunción | Fundamento |
|---|---|
| Un SHA identifica un árbol de forma unívoca | Direccionamiento por contenido de git |
| `created_at` de un comentario es la recepción real | Lo asigna la plataforma, no el cliente |
| El `id` de un comentario no se reutiliza | `[VERIFICAR]` |
| El autor observado es la cuenta que publicó | Autenticación de GitHub |
| Una edición cambia `updated_at` | `[VERIFICAR]` |
| Un check run está asociado a un `head_sha` concreto | Modelo de datos de GitHub |
| El `id` de repositorio sobrevive a renombrados | `[VERIFICAR]` |

### 10.2 Lo que el Binding nunca puede asumir

| No puede asumir | Por qué |
|---|---|
| Que un evento no ha sido editado desde que se leyó | Solo detectable con sellos, y a posteriori |
| Que un evento existe todavía | Se puede borrar |
| Que la cuenta observada corresponde al agente declarado | Salvo mapa de perfil y nivel ≥ 3 |
| Que detrás de una cuenta está el modelo que dice el perfil | Fuera del alcance del protocolo |
| Que dos claims no se solapan | No hay transaccionalidad (§13.2) |
| Que un humano vio una pregunta | La entrega de notificaciones no es un recibo |
| Que los checks verdes de hoy lo sigan siendo | Los re-runs existen |
| Que un artifact siga descargable | Caducan |
| Que una label refleje el estado | Cualquiera la cambia |
| Que el orden temporal sea el causal | Son cosas distintas (BIND-019) |
| Que una lectura fallida equivale a un resultado negativo | Es ausencia de dato |

### 10.3 Lo que queda fuera del protocolo

Cinco cosas, y conviene enumerarlas para que nadie las dé por cubiertas:

1. **La identidad del proceso.** Que quien escribe como `claude` sea el modelo que el perfil dice. Ninguna capa de ACP lo alcanza.
2. **La honestidad del contenido.** Un `unverified: []` mentiroso, un `falsified` inventado, un digest fabricado: todos son sintácticamente perfectos.
3. **La seguridad de las credenciales.** Si un token se filtra, todo el modelo de identidad se cae y ACP no lo nota.
4. **La corrección de las decisiones.** ACP registra que se decidió; no que se decidiera bien.
5. **La integridad de GitHub como plataforma.** El binding confía en el sustrato. Si el sustrato miente, el binding miente con él.

---

<a name="11"></a>
## 11. Seguridad

Amenazas ordenadas por lo que cuesta ejecutarlas.

### 11.1 Suplantación

| Vector | Coste | Detección | Mitigación |
|---|---|---|---|
| Escribir `actor: hermes` desde otra cuenta | **Trivial** | Comparación declarado↔observado, solo con nivel ≥ 3 | Cuentas distintas por agente |
| Usar la cuenta compartida como si fuera otro agente | Trivial en nivel 1–2 | **Ninguna** | Subir a nivel 3 |
| Robar el token de un agente | Medio | Rastro administrativo, si el plan lo ofrece | Rotación, App con permisos mínimos |
| Reclamar un login liberado | Bajo si se atribuye por login | Atribuir por `user.id` (BIND-011) | INV; ya cubierto |

**BIND-047.** La suplantación en nivel 1–2 **no es detectable**. El binding **DEBE** declararlo en lugar de sugerir que `actor` protege algo.

### 11.2 Replay

| Vector | Detección | Mitigación |
|---|---|---|
| Copiar un `authorize` antiguo en un contexto nuevo | El `authorize` está atado a `basis.sha` y tiene `expires` | Regla del Core; el binding la evalúa contra `created_at` |
| Reutilizar un evento de otro item | El sujeto no coincide con el contenedor | BIND-005 |
| Citar una evidencia de otro SHA | El basis no coincide | Verificación de asociación evidencia↔SHA |
| Reutilizar un puntero causal ya usado | Dos eventos con el mismo `after` | Bifurcación → `contested` |

**BIND-048.** Toda autorización **DEBE** evaluarse contra el `created_at` del evento que la concedió y el head actual, nunca contra el reloj del lector ni contra una memoria de que «esto ya estaba autorizado».

### 11.3 Mutación

Cubierto en §5.5–5.7. Resumen de la postura: **la mutación no se impide, se hace evidente.** Ediciones vía `updated_at` y sellos; borrados vía huecos de puntero y `covers`. Ambas detecciones son a posteriori. Un atacante con permisos de escritura y paciencia puede reescribir el log en la ventana entre que alguien lee y alguien sella.

**BIND-049.** El perfil **DEBE** declarar su ventana de sellado. Sin sellos, la ventana es infinita, y eso hay que decirlo.

### 11.4 Falsificación de evidencia

| Vector | Detección | Coste de detección |
|---|---|---|
| Digest inventado | Re-ejecutar el comando y comparar | Alto: hay que ejecutar |
| Salida pegada sin digest | El evento no es conforme (falta `id`) | Barato — **pero el schema V3 hoy no exige `id`** (§13.4) |
| Citar un `run_id` de otro repo o SHA | Verificar la asociación | Barato: una lectura |
| Citar un artifact inexistente | Verificar existencia | Barato hasta que caduca |
| Declarar un `env` falso | **Ninguna** | Fuera de alcance |

**BIND-050.** El binding **DEBE** verificar existencia, repositorio y asociación al SHA de toda evidencia E2 antes de contarla para un gate. Es la comprobación con mejor relación coste/beneficio de todo el binding: una lectura evita una clase entera de falsificación.

### 11.5 Filtración de credenciales

**BIND-051.** Un evento ACP **NO DEBE** contener nunca secretos: tokens, JWTs, cookies, URLs con credenciales, claves. Los eventos son públicos dentro del repositorio, permanentes en la práctica, y **la edición para borrar un secreto invalida el evento** (BIND-023), lo que crea un dilema entre integridad del log y contención de la filtración.

**BIND-052.** Si ocurre: el secreto se **rota primero**, y solo después se decide qué hacer con el evento. El orden importa: editar el comentario no revoca nada y sí destruye la única prueba de qué se filtró y cuándo.

**BIND-053.** La evidencia **NO DEBE** incluir salidas de comandos sin filtrar cuando el entorno pueda contener secretos. El digest de una salida saneada es preferible a la salida completa.

---

<a name="12"></a>
## 12. Invariantes específicos de GitHub

Lista completa. Cada uno es citable y falsable; si GitHub cambia, se revisa el binding (BIND-041).

| # | Invariante |
|---|---|
| **INV-01** | Un nombre de rama nunca ancla evidencia. Solo el SHA de 40 hex minúsculas |
| **INV-02** | La identidad de un repositorio es su `id` numérico, no `owner/name` |
| **INV-03** | Labels, cuerpo de issue, assignees, milestones, campos de Project y estado abierto/cerrado son proyección, nunca verdad |
| **INV-04** | Un re-run produce evidencia nueva sin cambiar el SHA: toda evidencia de ejecución identifica la ejecución |
| **INV-05** | Un artifact es evidencia caduca; solo su digest sobrevive |
| **INV-06** | El `created_at` de un comentario es el **único reloj de confianza** del protocolo en GitHub |
| **INV-07** | El `id` de un comentario es el puntero causal canónico, y lo produce GitHub después de publicar |
| **INV-08** | El orden temporal no es la causalidad: el orden lo da la plataforma, la causalidad la declara `after` |
| **INV-09** | Un comentario es mutable: el log es append-only **lógico**, no físico |
| **INV-10** | Una edición se detecta por `updated_at ≠ created_at` y anula el evento |
| **INV-11** | Un borrado no es reversible por el protocolo y solo se detecta por huecos y sellos |
| **INV-12** | Minimizar no cambia el efecto de protocolo |
| **INV-13** | Un evento vive en un comentario de primer nivel del contenedor de su sujeto, en ningún otro sitio |
| **INV-14** | Ningún estado de la UI genera un evento por sí solo |
| **INV-15** | Ninguna acción de GitHub libera un lease: solo `release` o la caducidad |
| **INV-16** | GitHub no ofrece transaccionalidad: dos claims simultáneos se detectan, no se impiden |
| **INV-17** | La identidad observada es una cuenta, no un agente, salvo mapa de perfil y nivel ≥ 3 |
| **INV-18** | La atribución se hace por `user.id`, no por login |
| **INV-19** | La entrega de una notificación no es un recibo de lectura |
| **INV-20** | Una lectura fallida no es un resultado: es ausencia de dato, y se registra como no verificado |
| **INV-21** | Una PR review es evidencia E2 atada a un commit, no un evento ACP |
| **INV-22** | Los checks son evidencia sobre un SHA y una ejecución, no sobre el estado actual del código |
| **INV-23** | Las branch protection rules son evidencia de que se cumplen reglas, no una autorización |
| **INV-24** | Un fork comparte SHAs y no comparte identidad de coordinación |
| **INV-25** | Un renombrado de label reetiqueta toda la historia a la vez y no deja evento |
| **INV-26** | El binding tiene versión propia; un cambio de comportamiento de GitHub obliga a versionarlo |

---

<a name="13"></a>
## 13. Limitaciones conocidas

### 13.1 Hechos de plataforma por verificar

**Cada fila es una suposición sobre GitHub que sostiene al menos un invariante y que no he verificado contra documentación oficial.** Hasta comprobarse, el invariante que depende de ella es provisional.

| # | Suposición | Sostiene | Comprobación que la resolvería |
|---|---|---|---|
| V1 | Los `id` de comentario no se reutilizan y son crecientes | INV-07, INV-08, orden de desempate | Documentación de la API REST sobre `id` de comentarios; observación de dos comentarios consecutivos |
| V2 | Una edición cambia siempre `updated_at` | INV-10, BIND-023 | Editar un comentario y comparar timestamps antes y después |
| V3 | El historial de ediciones no es recuperable por API de forma completa | §5.5, §14 | Buscar en la API un endpoint de versiones de comentario |
| V4 | El `id` de repositorio sobrevive a renombrado y transferencia | INV-02, F9, F10 | Renombrar un repo de prueba y comparar `id` |
| V5 | Los números de issue no se reutilizan dentro de un repo | §2.2 | Documentación; borrar un issue y crear otro |
| V6 | Un issue transferido cambia de número y los punteros de comentario pueden dejar de resolver | F14 | Transferir un issue de prueba y resolver un `id` anterior |
| V7 | La retención por defecto de artifacts es del orden de 90 días y es configurable | INV-05, F19 | Ajustes de Actions del repositorio |
| V8 | La retención de logs de job es finita | §2.3 | Documentación de Actions |
| V9 | El audit log de organización no cubre ediciones de comentarios | §5.6, §11.3 | Revisar las categorías de evento del audit log |
| V10 | Un login liberado puede ser reclamado por otra cuenta | BIND-011, §11.1 | Documentación sobre cambio de nombre de usuario |
| V11 | Las Discussions tienen modelo de permisos y ordenación distintos a los de issues | §2.2, §14 | Documentación de Discussions |
| V12 | Un commit no referenciado puede volverse inalcanzable | §2.1, F6 | Comportamiento de `gc` en el remoto |

**BIND-054.** Ninguna decisión de gate **DEBE** apoyarse en una suposición marcada `[VERIFICAR]` mientras siga marcada. Esta tabla es la primera tarea de trabajo real del binding, y es más urgente que cualquier automatización.

### 13.2 Lo que GitHub no puede garantizar, y por tanto ACP tampoco sobre GitHub

| Limitación | Consecuencia para ACP |
|---|---|
| **No hay transaccionalidad** | Los claims simultáneos se detectan a posteriori. **No hay exclusión mutua real** |
| **No hay append-only físico** | La integridad del log es detectable, no garantizada |
| **No hay historial de edición completo por API** `[VERIFICAR]` | Una edición se detecta; su contenido anterior, no |
| **No hay caducidad automática de nada** | Los leases caducan por cálculo del lector, no por la plataforma |
| **No hay recibo de lectura** | El silencio no distingue «no lo vi» de «no contesto» |
| **No hay identidad de proceso** | Nivel 5 sigue sin decir qué modelo escribió |
| **No hay atomicidad entre issue y PR** | Un evento y su entrega pueden divergir |
| **Los permisos son de repositorio, no de protocolo** | El perfil declara capacidades que GitHub no impone |
| **No hay consistencia entre repos** | La coordinación multi-repo es enlace por convención |
| **Los artifacts caducan** | La evidencia recuperable tiene fecha de muerte |
| **Los re-runs sobreescriben la lectura, no el SHA** | La frescura hay que recalcularla siempre |

### 13.3 Comprobaciones que hoy no hace nada

Heredadas de las capas superiores y aterrizadas aquí:

1. **El patrón de identificadores del perfil no se aplica a los envelopes.** Nada impide usar un identificador reservado.
2. **Las catorce integridades referenciales del perfil no se comprueban.** Un gate puede referirse a un rol inexistente.
3. **La comparación declarado↔observado no la ejecuta nada**, y con nivel 1 sería indeterminada de todos modos.
4. **Los sellos de §5.5 no existen todavía**: la ventana de mutación no detectada es hoy infinita.

### 13.4 Divergencias conocidas con las capas vecinas

**El binding no las corrige** —no le corresponde— pero le afectan y hay que declararlas:

| Divergencia | Efecto en el binding |
|---|---|
| El schema V3 admite 15 códigos de `violation`; ACP-1.1 define 23 | **Ocho de las violaciones que este binding necesita emitir no son hoy expresables**: `identity-mismatch` (§4.5), `unscoped-event` (BIND-005), `duplicate-root`, `dangling-pointer` (BIND-026), `shadowed-field`. Es el defecto de las capas vecinas que más limita a este documento |
| El schema V3 no exige `id` (digest) en la evidencia | BIND-031 pide algo que el formato no impone (§11.4) |
| El schema V3 acepta `v: 1.x` con x≥1 | Un evento de un minor futuro puede validarse con reglas viejas |
| No existe pasada perfil-consciente | §13.3 filas 1 y 2 |

---

<a name="14"></a>
## 14. Preguntas abiertas

Ordenadas por lo que bloquean.

**Bloquean el piloto:**

1. **¿Cuál es el marcador exacto del evento** y cómo se garantiza que citar un evento en otro comentario no lo convierta en evento? BIND-017 exige dos marcas; falta fijar su sintaxis literal.
2. **¿Dónde viven los eventos de programa**: un issue designado o una Discussion? Afecta directamente al arranque en frío (BIND-004). Mi inclinación es un issue: mismo modelo de comentarios, mismos punteros, una sola forma de leer. Las Discussions introducirían una segunda clase de puntero causal para poca ganancia.
3. **¿Se sellan los eventos desde el primer día** (BIND-024) o se acepta una ventana de mutación infinita en el piloto? Es una decisión de coste, y hay que tomarla explícitamente.
4. **¿Qué nivel de garantía de identidad tendrá el piloto?** Con nivel 1, ningún gate de independencia se satisface (BIND-012) y el piloto no puede demostrar separación de poderes.

**Bloquean la versión 1.0:**

5. ¿Cómo se archiva el contenido de los eventos para conseguir append-only real, sin introducir automatización?
6. ¿Cómo se representan punteros causales **entre repositorios**?
7. ¿Se admite alguna vez derivar un evento de un estado de la UI —por ejemplo, un `review` a partir de una PR review— o BIND-009 es absoluto? Hoy lo dejo absoluto por prudencia; podría relajarse con condiciones estrictas.
8. ¿Qué ocurre con los eventos publicados **durante** una caída parcial, cuando el autor no pudo leer el predecesor?
9. ¿Cómo se versiona el binding frente a cambios de GitHub que nadie anuncia?
10. ¿Se puede usar el audit log de organización como evidencia E2 de una acción administrativa? Depende de V9.

**No bloquean, pero conviene decidirlas:**

11. Taxonomía exacta de labels: cuántas y con qué granularidad.
12. Si los checkpoints se anclan en el cuerpo del issue, se pinnean, o ambas cosas.
13. Si las conversaciones y los eventos deberían vivir en hilos separados.
14. Cómo se representa el `touches` cuando la superficie no es un path: un entorno, una base de datos, un servicio externo.

---

<a name="15"></a>
## 15. Piloto manual

Qué información basta para ejecutar ACP a mano, **solo con GitHub**, sin un bot, sin un Action, sin un script.

### 15.1 Los seis artefactos que hacen falta

| # | Artefacto | Dónde | Por qué es imprescindible |
|---|---|---|---|
| 1 | **Punto de entrada** | `AGENTS.md` del repo, o un enlace desde él | Sin él, un agente en frío no encuentra el protocolo. Hoy no existe ese enlace |
| 2 | **Perfil activo** | `acp.yml` | Quién es quién, qué gates hay, qué política de silencio |
| 3 | **Un issue por work item** | Issues | Contenedor del log |
| 4 | **Un issue de programa** | Issue designado | Contenedor de los eventos con `program` |
| 5 | **La plantilla del envelope** | Documentación del programa | Para que nadie invente la forma |
| 6 | **Una lista de valores prohibidos de memoria** | En el punto de entrada | `after`, SHA, digest, `run_id`, `claim`: se leen, no se recuerdan |

Nada más. Ni labels, ni Projects, ni milestones: son proyección, y el piloto puede vivir sin proyección regenerando el estado leyendo el log. **Empezar sin labels es además la mejor forma de comprobar que el log basta.**

### 15.2 Las cinco reglas del piloto

1. **Un evento es un comentario con las dos marcas.** Todo lo demás es conversación.
2. **Nunca editar un evento.** Corregir con otro evento.
3. **Copiar, no recordar:** el `after` se lee del hilo, el SHA de la interfaz de git, el digest de la salida del comando, el `run_id` de la ejecución.
4. **Ningún estado de la UI hace nada.** Aprobar un PR, cerrar un issue o mover una tarjeta no cambia el protocolo.
5. **Lo que no se pudo verificar se declara.** Nunca se infiere.

### 15.3 Qué demuestra el piloto y qué no

**Puede demostrar:** que un item se reconstruye desde GitHub; que un SHA cambiado invalida una review; que dos claims solapados se detectan; que un checkpoint acota la lectura; que el silencio no autoriza; que la proyección puede regenerarse.

**No puede demostrar,** y no hay que pedírselo: separación de poderes con nivel de identidad 1; exclusión mutua de leases; integridad del log sin sellos; ni nada que dependa de las cuatro comprobaciones inexistentes de §13.3.

### 15.4 Criterio de éxito

Uno solo, y no es de conformidad:

> **¿Ha bajado el número de mensajes que el Product Owner copia y pega entre agentes?**

Si en la segunda semana sigue haciendo de bus de mensajes, el binding ha fallado en su objetivo real por mucho que los envelopes estén perfectos. Los demás criterios —reconstrucción, detección de obsoleto, recuperación en frío— son condiciones necesarias para ese, no sustitutos de ese.

---

## Cierre

Este binding se resume en una asimetría que conviene tener presente al leerlo entero:

**GitHub da tres garantías fuertes** —direccionamiento por contenido, timestamps de plataforma, autoría observada— **y ACP construye todo sobre ellas.** Todo lo demás que GitHub ofrece es cómodo, visible, y protocolariamente vacío: labels, tableros, botones de aprobar, estados de PR.

La tentación permanente, para un humano y para un agente, es usar lo cómodo y visible como si fuera verdad. La mayoría de los requisitos de este documento existen para resistir esa tentación en un punto concreto.

Y la limitación que hay que repetir al final, no enterrar: **sobre GitHub, ACP es tamper-evident, no tamper-proof; detecta, no impide.** Un log que se puede editar y borrar, con leases sin exclusión mutua y una identidad que solo distingue cuentas, no es un sistema transaccional. Es un sistema auditable. La diferencia importa, y presentar lo segundo como lo primero sería el peor error que este binding podría cometer.

---

### Procedencia

Absorbe el análisis de `docs/agents/github-binding-draft.md` (`chore/agent-protocol-mvp`), del que se conservan la separación log/proyección, el registro de binding separado del envelope, el problema de publicar del §5.4 y la postura ante ediciones. **Discrepa en dos puntos:** exige dos marcas de evento y no una (BIND-017), y hace absoluto BIND-009 —ningún evento se deriva de la UI— donde el borrador dejaba la puerta abierta a generar un `review` desde una PR review. Añade el modelo de entidades de §2, las cuatro clases de evidencia de §6, el sellado de §5.5, los veinte modos de fallo de §8, los veintiséis invariantes de §12 y la tabla de hechos por verificar de §13.1.
