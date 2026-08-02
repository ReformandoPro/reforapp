# ACP Conformance Suite 0.1 — decisiones

Qué se decidió al formalizar la suite, con su razón, y qué se dejó sin decidir a propósito.

## Parte 1 — Decisiones tomadas

### D1 · Ocho capas, no una escala de madurez

**Decisión.** L0–L7 son **dimensiones independientes con dependencias declaradas**, no niveles de madurez.

**Razón.** Una escala invita a decir «estamos en el nivel 4», que sugiere que 1–3 están completos. Con capas y dependencias explícitas, una implementación puede ser conforme en L0–L1 y no haber tocado L2, y eso se lee sin ambigüedad. La regla de agregación A5 impide el atajo: ninguna capa superior conforma si una dependencia inferior es no conforme.

### D2 · «Pasa el schema» no es «cumple ACP», y se hace estructural

**Decisión.** La clase `ACP Core Syntax Conformant` cubre **solo** L0–L1, y el formato de claim obliga a enumerar las capas no probadas.

**Razón.** Es la degradación más probable de ACP. 32 de 115 requisitos son de schema; presentar eso como conformidad exageraría por un factor de tres y medio. Enumerar `untested` convierte el silencio en una afirmación explícita que un revisor puede contradecir.

### D3 · Las reglas de agregación las impone el schema, no la prosa

**Decisión.** Cuatro de las seis reglas están codificadas en `report-format.schema.json`: fallo bloqueante ⇒ `NON_CONFORMING`; `not_implemented > 0` impide `CONFORMING`; un `INCONCLUSIVE` impide `CONFORMING`; sin asersión de format, L1 no puede conformar.

**Razón.** Una regla de agregación documentada se incumple con una hoja de cálculo. Una regla en el schema hace que el informe incumplidor **no valide**. Es la misma lógica por la que ACP puso los invariantes del Core dentro del schema de perfil.

### D4 · Un caso no puede contener nada ejecutable, por construcción

**Decisión.** `case-format.schema.json` cierra el objeto y no ofrece ninguna propiedad donde un comando pudiera vivir. `steps` son descripciones en prosa con longitud limitada; las entradas van **por referencia con digest**, nunca embebidas.

**Razón.** Una convención de «no pongáis scripts aquí» se rompe el día que alguien tiene prisa. La imposibilidad estructural no.

### D5 · `INCONCLUSIVE` es un verdict de primera clase

**Decisión.** `INCONCLUSIVE` nunca cuenta como `PASS`, y basta uno para impedir que su capa conforme.

**Razón.** Hay requisitos que **no se pueden** decidir: la honestidad de `unverified`, la veracidad de un `env` declarado, la identidad del proceso tras una cuenta, la independencia de revisión con cuenta compartida. Sin un verdict honesto para eso, la presión es reportarlos `PASS`. Con él, el coste de la incertidumbre se ve.

### D6 · El core pack no toca la plataforma

**Decisión.** L0–L3 se ejecutan sin plataforma, sin red y sin reloj distinto de los instantes declarados en los casos.

**Razón.** Es la prueba operativa de que ACP no es «cómo trabajamos en GitHub». Si el core pack necesitara GitHub, la separación en capas sería decorativa. Y es lo que permite que un binding GitLab reutilice L0–L3 sustituyendo solo L4.

### D7 · La suite no arbitra los conflictos entre fuentes

**Decisión.** Los tres conflictos se marcan `CONFLICT`, se nombra quién debe decidir, y **la suite no elige**.

**Razón.** Una suite de conformidad que decide qué dice la especificación se convierte en la especificación. Es el error que la reconciliación anterior corrigió en el schema; repetirlo aquí sería peor, porque una suite tiene aún más apariencia de autoridad objetiva.

### D8 · Cero mutación, sin excepción en 0.1

**Decisión.** Ni en sandbox. Ningún caso puede exigir escritura en plataforma, y el formato lo impide estructuralmente.

**Razón.** El sandbox seguro es un diseño en sí mismo y necesita su propia revisión. Permitirlo «solo en sandbox» en la primera versión es exactamente cómo aparecen las escrituras accidentales en repositorios reales.

### D9 · Mapear contra las cifras medidas, no contra las publicadas

**Decisión.** La suite mapea contra las cifras del SHA canónico que declara, no contra las que circulan, y conserva la historia de las que sustituye. Al congelarse eran 95 y 39; tras la reconciliación son **113 filas, 60 con regla de schema y 53 external**.

**Razón.** Propagar una cifra incorrecta habría hecho que la cobertura de la suite fuera inauditable desde el primer día. `CONF-033` generaliza la lección: ninguna cifra publicada debe copiarse a mano.

### D11 · Descongelar actualizando, no reescribiendo

**Decisión.** La suite avanza con un commit encima de `b34f70ff`, que se conserva intacto como antecedente.

**Razón.** La primera revisión se redactó sobre fuentes con divergencias confirmadas. Reescribir la historia habría ocultado ese hecho, y el hecho importa: es la prueba de que una suite de conformidad puede estar perfectamente formada y apuntar a fuentes defectuosas. La tabla de §5.2 conserva las tres generaciones de cifras por el mismo motivo.

### D10 · La fiabilidad de un LLM como autor es un problema distinto

**Decisión.** Fuera de alcance, y explícitamente separada.

**Razón.** «¿Con qué frecuencia escribe este agente envelopes correctos?» y «¿cumple esta implementación ACP?» son preguntas distintas con métodos distintos. Mezclarlas produciría una suite que no responde bien a ninguna. Queda como decisión abierta 11.

## Parte 2 — Decisiones no tomadas

Las trece de la especificación §17. Las cuatro que más bloquean:

| # | Decisión | Qué desbloquea |
|---|---|---|
| 4 | Autoridad para emitir claims | Sin ella, cualquiera emite un claim y solo la revisión lo contradice |
| 5 | Firma de informes | Sin firma, un informe verde se fabrica en un editor de texto |
| 6 | Confianza en los runners | Un runner comprometido produce evidencia falsa con formato perfecto |
| 12 | Cómo medir honestidad epistemológica | Es probablemente el mejor predictor de fiabilidad de un agente, y no sé medirlo sin crear un incentivo a rellenar el campo |

**Ninguna se decide aquí por la misma razón: no hay evidencia para decidirlas.** Cuatro y cinco dependen de si la suite vive en este repositorio o fuera; seis depende de si habrá runners automáticos; doce necesita datos de pilotos que aún no existen.

## Parte 3 — Lo que se conservó del borrador previo

De `docs/agents/conformance-suite-draft.md` se conserva íntegra la arquitectura de ocho capas, la separación entre verdicts de caso y de capa, la neutralidad del core respecto al binding, la lista de negativos obligatorios y la postura de seguridad ante fixtures.

**No hay discrepancia sustantiva con ese borrador.** Se añade lo que faltaba para que sea usable: IDs estables, catálogo de requisitos con fuente y comprobabilidad, los dos formatos declarativos, las reglas de agregación impuestas por schema, los siete packs, la clasificación honesta de automatización y la cadena de trazabilidad bidireccional.

## Nota histórica — retirada de `ACP-CONF-SCHEMA-014`

Las cifras de este documento son las del momento en que se tomó cada decisión y **no se actualizan retroactivamente**; las vigentes están en la especificación §4.1.

Una verificación independiente posterior encontró que `ACP-CONF-SCHEMA-014` agregaba **27 filas de origen heterogéneas** bajo una obligación genérica, de modo que su PASS no demostraba ninguna de ellas. Se retiró —`status: deprecated`, sin filas, con `deprecated_by`— y sus filas se repartieron entre requirements con mecanismo propio. El ID **no se reutiliza y no se renumeró nada**, para que un informe emitido antes siga siendo interpretable. La regla que impide repetir el error es `CONF-037` y `CONF-038` (especificación §4.3).
