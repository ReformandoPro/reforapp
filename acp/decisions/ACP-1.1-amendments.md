# ACP-1.1 — resolución de enmiendas normativas

| | |
|---|---|
| Estado | **Candidata. No aprobada.** |
| Base | ACP-1 en `feat/acp-1-protocol@0b714a9a634255039dbed3a1083718f6ecb7f132` |
| Origen A1–A16 | `acp/schema/README.md` §3 en `feat/acp-envelope-schema@9d073e3c9d63a7d1e4b9f2e237a65c8da9c508a6` |
| Origen A17–A23 | `docs/agents/envelope-schema-review-matrix.md` y `envelope-schema-architecture.md` en `chore/agent-protocol-mvp@95d6223579f3d3c9f5f3661428ff799dfa72528d` |
| Editor | Principal Protocol Editor (esta rama) |

**El schema no decide.** Las dieciséis primeras enmiendas venían propuestas por una implementación; una implementación puede revelar un problema, pero no puede legislar la solución. Cada una se resuelve aquí con `ACCEPT`, `MODIFY`, `REJECT` o `DEFER` y su razón técnica. **Cinco se modifican y una se difiere**; el resto se aceptan.

---

## Resumen

| # | Asunto | Resolución | Compatibilidad | ¿Bloquea adopción? |
|---|---|---|---|---|
| A1 | SHA completo de 40 hex | **ACCEPT** | breaking | sí |
| A2 | `risk` y `debt` son tipos de evento | **ACCEPT** | compatible con migración | sí |
| A3 | `revalidate` como tipo propio | **ACCEPT** + ampliada | compatible con migración | sí |
| A4 | `basis.base` estructurada | **ACCEPT** | breaking | sí |
| A5 | `authorize.scope` estructurada | **ACCEPT** | breaking | sí |
| A6 | `pr` sale de Core | **ACCEPT** | breaking | sí |
| A7 | `specify` frente a `spec` | **MODIFY** — no documentar la distinción: eliminarla | breaking | sí |
| A8 | Escritor estricto, lector tolerante | **ACCEPT** + ampliada | compatible | sí |
| A9 | Un solo modelo de tiempo | **ACCEPT** + ampliada | compatible | no |
| A10 | `actor` obligatorio | **MODIFY** — obligatorio, pero con cuatro conceptos separados | breaking | sí |
| A11 | Modelo de raíz causal | **MODIFY** — de seis tipos raíz a tres | breaking | sí |
| A12 | Política de IDs fuera de Core | **ACCEPT** + coste declarado | breaking | sí |
| A13 | Referencia de repositorio portable | **ACCEPT** | breaking | sí |
| A14 | Gramática de extensiones | **MODIFY** — gramática sí, pero en contenedor único | breaking | no |
| A15 | `never_default_actions` | **ACCEPT** | compatible | no |
| A16 | Paridad de catálogo por digest | **MODIFY** — el digest es paliativo; la cura es la paridad capacidad↔evento | compatible | no |
| A17 | Todo evento nombra su sujeto | **ACCEPT** (nueva) | breaking | sí |
| A18 | `heartbeat`/`release` referencian su `claim` | **ACCEPT** (nueva) | breaking | sí |
| A19 | `unverified: []` admisible | **ACCEPT** (nueva) | compatible | no |
| A20 | `v` gana versión menor | **ACCEPT** (nueva) | breaking | sí |
| A21 | `after` solo en forma namespaced | **ACCEPT** (nueva) | breaking | sí |
| A22 | `on_behalf_of` para delegación | **ACCEPT** (nueva) | compatible | no |
| A23 | Forma plana frente a payload | **REJECT** el payload; se mantiene plana | compatible | no |
| — | Reestructurar el catálogo en 4 grupos | **DEFER** | — | no |

**Trece de veintitrés bloquean la adopción.** ACP-1.1 no puede activarse hasta que se aprueben.

---

## A1 · SHA completo de 40 hexadecimales minúsculas — ACCEPT

**Texto ACP-1 (§21):** `sha := sha_prefix ; ≥10 hex`.

**Texto ACP-1.1 (§6.1):** *«SHA completo: 40 hexadecimales minúsculas. Obligatorio en `review`, `revalidate`, `validate`, `approve`, `authorize` y `submit`. Una rama nunca sustituye a un SHA.»*

**Motivo.** Un prefijo puede volverse ambiguo al crecer la historia. Un ancla que puede volverse ambigua no sostiene invalidación, y la invalidación es el mecanismo sobre el que descansa todo lo demás. El coste de escribir 30 caracteres más lo paga una vez la herramienta que los lee; el coste de una colisión lo paga el equipo entero durante una tarde.

**Compatibilidad: breaking.** Todos los SHAs de los ejemplos de ACP-1 eran de 10 caracteres y han sido reemplazados en esta rama.

**Impacto:** envelope schema (patrón ya correcto en V2) · profile (`review.require_full_sha`) · AGENTS.md (regla 2) · acp.yml (nueva clave) · fixtures (ya cubierto por `24-sha-too-short`) · bindings futuros (deben exponer el SHA completo, no el abreviado de la UI).

## A2 · `risk` y `debt` son tipos de evento — ACCEPT

**Texto ACP-1 (§5.3):** catálogo de 24, declarado «cerrado». Pero §13.2, §13.3 y el Apéndice A los usan como eventos.

**Texto ACP-1.1 (§5.3):** catálogo de 27, ambos incluidos.

**Motivo.** La especificación se contradecía consigo misma y una de las dos partes tenía que ceder. Cede §5.3 porque el uso del Apéndice A es el correcto: un riesgo detectado durante una revisión **es** un hecho ocurrido, y los hechos ocurridos son eventos. Mantenerlos solo como ficheros de registro obligaría a un evento genérico «he actualizado el registro», que es precisamente el tipo de evento vacío que §17.1(e) eliminó.

**Compatibilidad: compatible con migración.** Nada de lo escrito bajo ACP-1 deja de ser válido; se legaliza lo que ya se hacía.

**Impacto:** envelope schema (ya en V2) · AGENTS.md (catálogo) · acp.yml (capacidades `risk` y `debt`) · fixtures (existen) · bindings (ninguno).

## A3 · `revalidate` como tipo propio — ACCEPT, ampliada

**Texto ACP-1 (§6.3):** `type: review` con `revalidates` y `diff_outside_scope`.

**Texto ACP-1.1 (§6.3):** tipo propio con `revalidates`, `old_basis`, `new_basis`, `scope_diff`, y condicionalmente `revalidated_claims`.

**Motivo.** Como campo de `review`, nada obligaba a que el basis viejo, el nuevo y la afirmación de ámbito aparecieran juntos, y una revalidación sin basis viejo no afirma nada comparable.

**Ampliaciones que el schema no proponía y ACP-1.1 añade,** porque sin ellas el tipo es una puerta trasera:

1. **Solo el autor de la afirmación original puede revalidarla.** Otro actor no revalida: afirma de nuevo, y eso es un `review`. Sin esta regla, un tercero prolonga el veredicto ajeno sin haberlo formado.
2. **Revalidar no reinicia el TTL** (R4). El reloj sigue corriendo desde la review original. Sin esta regla, revalidar en cadena mantiene viva indefinidamente una revisión de hace tres semanas, que es exactamente lo que R4 impide.
3. **`outside_scope: false` exige `revalidated_claims`**: hay que enumerar qué se ha vuelto a comprobar de verdad.

**Compatibilidad: compatible con migración.**

**Impacto:** envelope schema (V2 lo tiene, pero **sin las tres reglas**) · profile (`revalidate_resets_ttl: false`, `revalidate_same_actor_only: true`) · fixtures (faltan casos para las tres reglas) · bindings (ninguno).

## A4 · `basis.base` estructurada — ACCEPT

**ACP-1 (§6.1):** `base: main@a71c0e94`. **ACP-1.1:** `base: {ref, sha}`.

**Motivo.** Las dos mitades obedecen reglas distintas —una es mutable y orientativa, la otra es el ancla— y una cadena única no se puede validar como par. **Compatibilidad: breaking, mecánica.**

**Impacto:** schema (ya en V2) · AGENTS.md (ejemplo) · fixtures (ya) · bindings (ninguno).

## A5 · `authorize.scope` estructurada — ACCEPT

**ACP-1 (§13.5):** `scope: deploy:staging`. **ACP-1.1:** `scope: {action, environment?, resource?}` con enumeración cerrada de acciones.

**Motivo.** «Debe declarar la acción concreta autorizada» es inaplicable contra texto libre. Además, la enumeración cerrada es la que hace posible `never_default_actions` (A15): sin vocabulario compartido, las dos listas no se pueden cruzar. **Compatibilidad: breaking, mecánica.**

## A6 · `pr` sale del Core — ACCEPT

**ACP-1 (§21):** `submit` requiere `pr`. **ACP-1.1:** `delivery: {kind, id}` opcional; el número de PR vive en `extensions.x-github-pr`.

**Motivo.** `pr` es el sustantivo de una plataforma dentro de la gramática universal. Era la violación de capas más clara de ACP-1: obligaba a cualquier binding no-GitHub a inventar un número de PR o a incumplir. **Compatibilidad: breaking** (desaparece un campo obligatorio).

**Impacto:** bindings futuros — es la enmienda que más les importa.

## A7 · `specify` frente a `spec` — MODIFY

**Propuesta del schema:** documentar la distinción entre la capacidad `specify` y el tipo `spec`.

**Resolución: MODIFY. No se documenta la distinción; se elimina.** ACP-1.1 (§8.1) establece que **los nombres de capacidad son los nombres de tipo de evento**, más `veto`.

**Motivo.** Documentar una trampa la deja puesta. Dos registros paralelos con nombres parecidos derivan siempre, y ya derivaron: la confusión desactivó en silencio `write_surfaces.require_touches_in` durante la implementación del schema, y no era detectable leyendo ninguno de los dos ficheros por separado. Si los dos registros son literalmente el mismo conjunto de cadenas, la divergencia es imposible por construcción. De paso desaparece la sintaxis `approve:<gate>`, que invitaba a inventarse la segunda mitad; la autoridad por gate pasa a `roles.<rol>.approve_gates`.

**Compatibilidad: breaking** para el perfil (renombra capacidades). Ningún envelope cambia.

**Impacto:** acp.yml (reescrito) · profile schema (la enumeración de capacidades pasa a ser la de tipos de evento) · fixtures de perfil.

## A8 · Escritor estricto, lector tolerante — ACCEPT, ampliada

**ACP-1 (§16 regla 3):** «un campo desconocido se ignora, nunca invalida el evento».

**ACP-1.1 (§16.2):** se mantiene, y se separa por roles: el **escritor** publica solo documentos válidos contra su schema; el **lector** distingue cuatro casos.

**Ampliación decisiva:** ACP-1 trataba igual un campo desconocido y un tipo desconocido. ACP-1.1 los separa: **campo desconocido ⇒ tolerar y preservar; tipo de evento desconocido ⇒ fallar cerrado.** Un campo que no entiendes puede ser decorativo; un tipo de evento que no entiendes puede ser el que te prohíbe desplegar. Añade además el modo **solo lectura** ante un mayor distinto, que ACP-1 no contemplaba y dejaba al lector sin conducta definida.

**Compatibilidad: compatible.** **Bloquea** porque sin ella un implementador cablea el schema en un lector y descarta eventos válidos.

## A9 · Un solo modelo de tiempo — ACCEPT, ampliada

**ACP-1:** duraciones relativas en envelopes, fechas absolutas en registros de decisión, sin regla que lo dijera.

**ACP-1.1 (§16.3):** eje **authored / observed**. Todo valor authored es duración relativa; todo instante absoluto es observed y lo produce la plataforma. Se añade la regla que faltaba: si el binding no puede aportar timestamps fiables, **toda caducidad queda indeterminada y ningún gate dependiente de frescura se satisface**. **Compatibilidad: compatible** (clarifica).

## A10 · `actor` obligatorio — MODIFY

**Propuesta del schema:** `actor` obligatorio, modelo A.

**Resolución: MODIFY.** Se acepta la obligatoriedad y se rechaza que baste con ella. ACP-1.1 (§8.6) separa **`declared_actor`**, **`observed_actor`**, **`identity_assurance`** e **`identity_mismatch`**, y añade **`on_behalf_of`** (A22).

**Motivo.** «`actor` presente» y «evento atribuible» son cosas distintas, y el schema V2, al hacerlo obligatorio sin más, invitaba a confundirlas. Con cuenta compartida —que es la situación real de este programa hoy— `actor` es una etiqueta que cualquiera puede escribir. La enmienda obliga al perfil a **declarar su nivel de garantía** y establece que por debajo del nivel 3 la separación de poderes **no está garantizada** y debe decirse. Se prefiere un gate que no se cruza a un gate que se cruza sin fundamento.

**Compatibilidad: breaking** (campo obligatorio nuevo).

**Impacto:** envelope schema (falta `on_behalf_of`) · profile (`identity.trust_level`, `review.independence_guaranteed`) · bindings (deben publicar `observed_actor` y comparar).

## A11 · Modelo de raíz causal — MODIFY

**Propuesta del schema:** `after` obligatorio salvo `root: true`; raíz permitida en `spec`, `decide`, `reconcile`, `risk`, `debt`, `violation`.

**Resolución: MODIFY. Seis tipos raíz pasan a tres:** `spec`, `reconcile` y `decide` **solo cuando es de programa**.

**Motivo, tipo por tipo.** `risk`: un riesgo se descubre haciendo algo; sin `after` se pierde dónde se descubrió, que es la mitad de su valor. `debt`: la deuda se contrae ejecutando trabajo concreto; una deuda sin origen no se puede cobrar a nadie. `violation`: denuncia un `target` que ya existe, luego hay historia previa a la que enlazar. Los tres eran una comodidad para el autor pagada con trazabilidad.

**Se añade lo que el schema no cubría:** una sola raíz por hilo (`violation:duplicate-root`); puntero inexistente ⇒ `violation:dangling-pointer` con efecto **`flag`, no `void`** —el contenido puede seguir siendo cierto, y distinguir «mal formado» de «no resoluble» importa porque lo segundo puede ser un fallo de plataforma—; y un binding sin identificadores estables **no es conforme** con ACP-1.1 y solo puede operar en un modo degradado y declarado en el que ningún gate de frescura se satisface.

**Compatibilidad: breaking.**

## A12 · Política de identificadores fuera de Core — ACCEPT, con coste declarado

**ACP-1 (§4.2):** patrón Core `^[A-Z][A-Z0-9]{0,7}-I?[1-9][0-9]{0,8}$`.

**ACP-1.1:** Core exige solo un token estable, portable y opaco (1–64 imprimibles, sin espacios, nunca reutilizado). Prefijo, patrón y reservados pertenecen al perfil.

**Motivo.** El patrón era la nomenclatura de una organización dentro de un protocolo universal.

**Coste que se declara en lugar de disimularse:** el formato por sí solo **ya no puede rechazar `R2.1` como `item`**. Esa comprobación pasa a una segunda pasada perfil-consciente que **hoy no existe**. Se acepta el coste; no se acepta fingir que no lo hay.

**Compatibilidad: breaking.** Se documenta además que `R1`, `R2` y `R2.1` son **nombres históricos del roadmap**, no work items ACP, y se declaran en `ids.reserved`.

## A13 · Referencia de repositorio portable — ACCEPT

`repo: {system, id}`. `owner/name` es vocabulario de una plataforma y en Core hace ciudadanos de segunda a los demás bindings. **El perfil sí puede usar la forma nativa**, porque un perfil nombra su binding: la asimetría es deliberada y está documentada. **Compatibilidad: breaking, mecánica.**

## A14 · Gramática de extensiones — MODIFY

**Propuesta del schema:** claves `^x-[a-z0-9][a-z0-9-]*$` en la raíz del envelope.

**Resolución: MODIFY.** Se acepta la gramática y se rechaza la ubicación: las extensiones van en **un contenedor único `extensions`**.

**Motivo.** Con extensiones sueltas en la raíz comparten espacio de nombres con los campos normativos, y entonces «una extensión no puede sustituir un campo normativo» es una regla que hay que vigilar. En un contenedor propio es **estructuralmente cierta**. Además, un error tipográfico en la raíz (`x-githubpr`) es indistinguible de una extensión legítima; dentro del contenedor, al menos está acotado el daño. Coincide con la recomendación de `envelope-schema-architecture.md` §18, y sobre este punto tenían razón.

**Se resuelven además las preguntas abiertas:** el valor puede ser **cualquier JSON** (obligar a objeto encarece el caso común `x-github-pr: 141` sin ganar nada); un lector tolerante **debe preservarlas**; un escritor estricto **debe validarlas**; y el segmento posterior a `x-` es el espacio del propietario, sin registro central.

**Compatibilidad: breaking** respecto al schema V2. **No bloquea** la adopción del protocolo porque nada en producción usa extensiones todavía.

## A15 · `never_default_actions` — ACCEPT

Se acepta tal cual, y se acompaña de una tabla (§13.6) que dice **exactamente qué caso bloquea el formato y cuáles no**. Los dos que no bloquea —una pregunta que pide un deploy declarándose `kind: decision`, y una opción de aspecto inocuo que dispara algo irreversible— son el caso peligroso, y son semánticos. **Ningún documento de adopción puede afirmar que el formato impide todos los defaults sensibles.** **Compatibilidad: compatible.**

## A16 · Paridad de catálogo por digest — MODIFY

**Propuesta del schema:** duplicar la enumeración de tipos en ambos schemas y exigir un digest idéntico.

**Resolución: MODIFY.** El digest se conserva como **dispositivo de implementación**, pero no es la cura normativa. La cura es A7: si las capacidades **son** los tipos de evento, la lista de capacidades del perfil no puede divergir del catálogo, porque es el mismo conjunto. El digest queda como cinturón sobre los tirantes, no como el tirante.

**Motivo.** Un digest detecta la deriva; la paridad por construcción la impide. Preferimos impedir. **Compatibilidad: compatible.**

## A17 · Todo evento nombra su sujeto — ACCEPT (nueva)

**Origen:** `envelope-schema-review-matrix.md` §3, «Every event identifies one work item».

**Texto ACP-1.1 (§5.2.1):** exactamente uno de `item` o `program`. Ninguno o ambos ⇒ `violation:unscoped-event`.

**Motivo.** ACP-1 dejaba flotar sin sujeto a `authorize`, `decide`, `reconcile`, `answer`, `revoke` y `violation`. Un evento sin sujeto no se puede encolar, proyectar ni auditar. Se rechaza la formulación literal de la matriz —«un work item»— porque hay eventos legítimamente de programa; la forma correcta es exigir **un** sujeto, no exigir que sea un item. **Compatibilidad: breaking.**

## A18 · `heartbeat` y `release` referencian su `claim` — ACCEPT (nueva)

**Origen:** matriz §10; arquitectura §14.

**Motivo.** Sin referencia, «renovar el lease» y «soltar el lease» son afirmaciones sobre un lease que no se nombra. Con dos claims en la historia de un item —lo normal tras una preempción— nadie puede decir cuál se renovó. **Compatibilidad: breaking.** El schema V2 no lo cumple.

## A19 · `unverified: []` admisible — ACCEPT (nueva)

**Origen:** matriz §18 (falso negativo: «a review with explicit zero unverified items» no debe rechazarse) y arquitectura §11.

**Texto ACP-1.1:** `unverified` **debe estar presente**; puede estar vacío. `[]` significa «no queda nada por verificar»; **omitirlo sigue siendo no conforme.**

**Motivo.** Ausencia y vacío no son lo mismo y ACP-1 los confundía al exigir al menos un elemento: obligaba a inventar una incertidumbre para poder entregar, que es justo la clase de ritual que destruye el valor del campo. Se rechazó exigir además una casilla `unverified_complete: true`: escribir `[]` **ya es** la afirmación explícita, y una segunda casilla solo duplica la misma declaración. Queda dicho que `[]` es una afirmación fuerte y que el revisor adversarial debe atacarla. **Compatibilidad: compatible** (relaja).

## A20 · `v` gana versión menor — ACCEPT (nueva)

**Origen:** arquitectura §3, que usa `"v": "1.0"`.

**Texto ACP-1.1 (§16.1):** `v` es la cadena `"mayor.menor"`. `v: 1` de ACP-1 se lee como `"1.0"`.

**Motivo.** Con un entero solo se distingue el mayor, y entonces la regla del lector tolerante (A8) es inaplicable: no hay forma de saber si un campo desconocido viene de un menor posterior legítimo o de un error del autor. La enmienda no es cosmética: **A8 no funciona sin ella.** **Compatibilidad: breaking.**

## A21 · `after` solo en forma namespaced — ACCEPT (nueva)

**Origen:** arquitectura §9 (`github-comment:123456789`).

**Texto ACP-1.1 (§5.4.1):** forma canónica `"<binding>-<clase>:<id>"`. **Se elimina el entero pelado** que aceptaba el schema V2.

**Motivo.** Un entero no significa nada fuera de su plataforma, y uno de los objetivos de ACP es que el log se pueda leer desde fuera —el mismo argumento que sostiene el modelo A de identidad. Un puntero autodescriptivo cuesta doce caracteres más. **Compatibilidad: breaking.**

## A22 · `on_behalf_of` — ACCEPT (nueva)

**Texto ACP-1.1 (§8.6 regla 5):** `actor` es quien **opera**; `on_behalf_of` es quien **responde**. Ambos deben existir en el perfil. Un evento con `on_behalf_of` **no** hereda las capacidades del principal.

**Motivo.** Sin este campo, un humano que publica por un agente caído tiene dos opciones y las dos son malas: firmar como el agente (suplantación indistinguible) o firmar como sí mismo (se pierde de quién era el trabajo). La regla de no herencia de capacidades es lo que impide que la delegación se convierta en escalada de privilegios. **Compatibilidad: compatible** (campo opcional).

## A23 · Forma plana frente a `metadata + payload` — REJECT del payload

**Origen:** `envelope-schema-architecture.md` §3 recomienda `payload`.

**Resolución: se mantiene la forma plana.**

| Criterio | Plana | Payload | Veredicto |
|---|---|---|---|
| Tamaño | 6 comunes + los del tipo, un nivel | un nivel y un miembro más | Plana, marginal |
| Legibilidad para un LLM | idéntica a los bloques YAML de la spec | hay que decidir por campo a qué nivel va | Plana |
| Aislamiento de campos | lo da `unevaluatedProperties`: `verdict` en un `heartbeat` se rechaza | estructural | **Empate.** Era el argumento fuerte del payload y resulta que la plana ya lo tiene |
| Evolución | un campo común nuevo ensancha la raíz | se ve fuera del payload | Payload, leve |
| Complejidad del schema | un cierre en la raíz | un cierre por rama, 27 veces, más el de la raíz | Plana |
| Compatibilidad con ACP-1 | idéntica a todos los ejemplos | enmienda adicional que toca cada ejemplo y las tres propuestas | **Plana, decisivo** |

**Lo que no se afirma:** que la forma plana produzca menos errores de LLM. **No se ha medido.** El experimento que lo zanjaría: generar N envelopes de cada forma desde los mismos prompts y contar violaciones de schema por categoría. Hasta que alguien lo haga, la fila de legibilidad es razonamiento, no evidencia.

**Lo que la forma plana obliga a asumir**, y ACP-1.1 formaliza en §5.2.2: los nombres de campo son un espacio de nombres único y global, con política de colisión explícita.

## DEFER · Reestructurar el catálogo en cuatro grupos

`envelope-schema-architecture.md` §6 agrupa los eventos en ciclo de vida, aseguramiento, autoridad y coordinación. **DEFER.** La agrupación se adopta como **material informativo** en la tabla de §5.3 —ayuda a leerla— pero **no** como estructura normativa: convertirla en normativa invitaría a reglas por grupo («todo evento de autoridad requiere X»), y ahora mismo no hay ninguna regla que se aplique a un grupo entero y no a tipos concretos. Se reconsiderará si aparece la primera.

---

## Lo que sigue sin resolverse

1. **Ningún schema implementa ACP-1.1.** El V2 discrepa en ocho puntos (ACP-1.md §0.5). Hace falta un V3, y hasta entonces **ningún fixture de V2 prueba conformidad**.
2. **La segunda pasada perfil-consciente no existe.** A12 movió una comprobación real fuera del formato y nadie la recoge todavía.
3. **`identity.trust_level` sigue en 1.** Mientras los handles sean `@TODO`, A10 compra auditabilidad y no autenticidad, y la revisión independiente no está garantizada.
4. **A19 y A16 se apoyan en juicio, no en formato.** Un `unverified: []` deshonesto y un catálogo que deriva entre releases los detecta una persona, no una regla.
5. **La decisión A23 descansa en argumento estructural, no en medición.**
