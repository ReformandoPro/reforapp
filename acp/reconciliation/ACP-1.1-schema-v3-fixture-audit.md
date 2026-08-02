# Auditoría del corpus de fixtures — Schema V3

Complemento de [`ACP-1.1-schema-v3-findings.md`](ACP-1.1-schema-v3-findings.md). Responde a lo único que el veredicto anterior de Hermes señalaba: `FIXTURE CORPUS INSUFFICIENT`.

**Re-ejecución independiente** con ajv 8.20.0, Draft 2020-12, `strict`, `allErrors`, format assertion activada: **50/50 válidas aceptadas, 67/67 inválidas rechazadas.** El corpus hace lo que la entrega dice que hace. La pregunta de esta auditoría es otra: *¿prueba lo que hace falta probar?*

## 1. Cobertura por tipo de evento

Medida sobre el campo `type` de cada fixture, no sobre nombres de fichero.

| Tipo | Válidas | Inválidas | Rama en el schema | Fila en TRACEABILITY | Juicio |
|---|---|---|---|---|---|
| `answer` | 1 | **0** | sí | **no** | Un solo campo obligatorio compuesto; negativa defendiblemente omisible |
| `approve` | 1 | **0** | sí | sí | **Falta negativa**: tres obligatorios más `ttl` |
| `assume` | 1 | 1 | sí | sí | Correcto |
| `authorize` | 1 | 5 | sí | sí | El mejor cubierto del corpus |
| `block` | 1 | **0** | sí | **no** | **Falta negativa**: cinco campos obligatorios sin una sola prueba discriminante |
| `checkpoint` | 1 | 1 | sí | **no** | Regla cubierta, trazabilidad no |
| `claim` | 4 | 7 | sí | sí | Correcto |
| `close` | 1 | 1 | sí | **no** | Regla cubierta, trazabilidad no |
| `debt` | 2 | 1 | sí | **no** | Regla cubierta, trazabilidad no |
| `decide` | 2 | 1 | sí | sí | Correcto |
| `handoff` | 1 | 1 | sí | **no** | Regla cubierta, trazabilidad no |
| `heartbeat` | 5 | 12 | sí | sí | Sobrerrepresentado: se usa como portador genérico de casos comunes |
| `progress` | 1 | **0** | sí | **no** | Dos obligatorios; negativa deseable |
| `question` | 3 | 4 | sí | sí | Correcto |
| `reconcile` | 2 | **0** | sí | sí | **Falta negativa** |
| `release` | 1 | 1 | sí | sí | Correcto |
| `revalidate` | 2 | 4 | sí | sí | Correcto |
| `review` | 5 | 9 | sí | sí | Correcto |
| `revoke` | 1 | **0** | sí | **no** | **Falta negativa**: la referencia exacta al objetivo es su única razón de ser |
| `risk` | 2 | 1 | sí | **no** | Regla cubierta, trazabilidad no |
| `spec` | 2 | 1 | sí | sí | Correcto |
| `submit` | 2 | 2 | sí | sí | Correcto |
| `supersede` | 1 | **0** | sí | **no** | Negativa deseable |
| `triage` | 1 | **0** | sí | **no** | Negativa deseable |
| `unblock` | 1 | **0** | sí | **no** | Negativa deseable |
| `validate` | 1 | **0** | sí | sí | **Falta negativa**: tres obligatorios |
| `violation` | 2 | 1 | sí | **no** | Regla cubierta; además afectado por F-01 |

**Resumen:** los 27 tipos tienen rama y fixture válida. **Diez no tienen ninguna negativa** y **trece no tienen fila en `TRACEABILITY.md`**. Las cuatro negativas que de verdad faltan son `block`, `validate`, `approve` y `revoke` (F-11).

Nota metodológica: aparecen **28** valores distintos de `type` en el corpus. El vigésimoctavo es `escalate`, en `27-unknown-event-type`, que es exactamente lo que esa fixture debe contener.

## 2. Fixtures nuevas de V3, una a una

Comprobado para cada inválida: **(a)** falla, **(b)** falla por el keyword previsto, **(c)** no falla antes por otra causa, **(d)** el nombre describe la regla correcta.

| Fixture | Keyword esperado | Falla por él | Sin fallo colateral | Nombre correcto |
|---|---|---|---|---|
| `31-event-without-actor` | `required` | sí | sí | sí |
| `44-non-root-event-without-after` | `required` | sí | sí | sí |
| `45-root-flag-on-non-root-eligible-type` | `enum` (rootEligibleType) | sí | sí | sí |
| `46-root-declared-with-after` | `not` en `#/allOf/1/then/not` | sí | sí | sí |
| `47-extension-key-uppercase` | `unevaluatedProperties` | sí | sí | sí |
| `48-extension-key-empty-namespace` | `unevaluatedProperties` | sí | sí | sí |
| `49-extension-key-underscore` | `unevaluatedProperties` | sí | sí | sí |
| `50-repo-binding-shorthand-in-core` | `type` | sí | sí | sí |
| `51-repo-reference-without-system` | `required` | sí | sí | sí |
| `52-profile-invalid-work-item-regex` | `format` | sí, **solo con format assertion** | sí | sí |
| `53-profile-unknown-never-default-action` | `enum` | sí | sí | sí |
| `54-assume-timeout-without-source-question` | `required` | sí | sí | sí |
| `55-revalidate-without-new-basis` | `required` | sí | sí | sí |
| `56-revalidate-empty-scope-diff-paths` | `minItems` | sí | sí | sí |
| `57-risk-as-root` | `enum` (rootEligibleType) | sí | sí | sí |
| `58-debt-as-root` | `enum` | sí | sí | sí |
| `59-violation-as-root` | `enum` | sí | sí | sí |
| `60-decide-item-level-root` | `required` (`program`) | sí | sí | sí |
| `61-both-item-and-program` | `oneOf` | sí | sí | sí |
| `62-neither-item-nor-program` | `oneOf` | sí | sí | sí |
| `63-heartbeat-without-claim` | `required` | sí | sí | sí |
| `64-release-without-claim` | `required` | sí | sí | sí |
| `65-extension-outside-container` | `unevaluatedProperties` | sí | sí | sí |
| `66-profile-extension-key-bare` | `pattern` | sí | sí | sí |
| `67-profile-extension-key-uppercase` | `pattern` | sí | sí | sí |
| `68-profile-extension-key-underscore` | `pattern` | sí | sí | sí |

**Dos observaciones sobre la fragilidad de las expectativas**, que la próxima revisión debe conocer:

- `46-root-declared-with-after` no puede fijarse por mensaje: el error de `not` en ajv llega con `params` vacío. Su expectativa está anclada al `schemaPath` `#/allOf/1/then/not`. **Cualquier reordenación del `allOf` de la raíz invalidaría la expectativa sin invalidar la fixture**, y el corpus seguiría en verde. Es la única expectativa del corpus atada a una posición.
- `57`, `58` y `59` se anclan a la cadena `rootEligibleType` en el `schemaPath`. Es estable mientras el `$def` no se renombre.

### Válidas nuevas: ¿demuestran un borde real?

| Fixture | Borde que demuestra | ¿Contradice la spec? |
|---|---|---|
| `39-spec-root-event` | raíz con item | no |
| `43-reconcile-root` | raíz sin predecesor legible | no |
| `40-decide-root-programme-level` | la única raíz con sujeto de programa | no |
| `44/45/46-*-with-after` | los tres tipos que perdieron la raíz | no |
| `06-heartbeat`, `08-release-lease` | referencia al claim | no |
| `42-review-unverified-empty` | `[]` como declaración explícita | no |
| `47-item-lowercase-prefix`, `48-item-uuid-like` | el Core no impone forma | no |
| `38-item-core-accepts-any-stable-token` | **el Core acepta `R2.1`** | **no, pero contradice el perfil**: es el coste declarado de A12, y por eso es válida |
| `49-after-...-semantically-stale` | puntero bien formado y obsoleto | no |
| `50-question-duplicate-option-ids` | **ids duplicados aceptados** | no la contradice; documenta lo que el formato no alcanza |
| `41-extension-keys-strict-grammar` | `x-a`, `x-0-…` legales | no |
| `36-profile-reformando` | el `acp.yml` real valida sin editar | no |

Las dos fixtures válidas-a-propósito (`38`, `50`) son el mejor material del corpus: **codifican un hueco en lugar de esconderlo.** `49` hace lo mismo con la obsolescencia semántica.

## 3. Muestra de fixtures heredadas

Revisadas diez de V1/V2 tras la migración a ACP-1.1, buscando que la migración no las haya vaciado de sentido:

| Fixture | Antes | Después de migrar | ¿Sigue probando lo suyo? |
|---|---|---|---|
| `01-spec-minimal` | `v: 1`, `after` entero | `v: "1.1"`, puntero namespaced | sí |
| `09-submit-with-unverified` | `x-github-pr` en la raíz, `repo` string, `delivery: pull-request` | contenedor, `{system,id}`, `change-request` | sí, y ahora ejercita cuatro reglas nuevas |
| `13-review-adversarial-falsified` | igual | + `adversarial` obligatorio | sí |
| `22-authorize` | sin `item` | + `item: RF-142` | sí |
| `28-decide` | sin sujeto | + `program: reforapp` | sí |
| `30-after-arbitrary-text` | fallaba por `oneOf` | ahora por `pattern`, y **hubo que añadirle `claim`** para que no fallara antes por A18 | sí, tras el arreglo |
| `34-protocol-version-unsupported` | fallaba por `const` | ahora por `type`, misma corrección de `claim` | sí, tras el arreglo |
| `24-sha-too-short` | igual | igual | sí |
| `35-envelope-with-extension` | `x-` en raíz | contenedor + `claim` | sí |
| `36-profile-reformando` | perfil ACP-1 | perfil ACP-1.1 real | sí, y ahora es la fixture más valiosa del corpus |

El patrón que aparece dos veces —`30` y `34` fallaban **antes de tiempo** por el nuevo `claim` obligatorio hasta que se les añadió— es el modo de fallo característico de un corpus migrado: **una regla nueva puede enmascarar la regla que la fixture existía para probar, y el corpus sigue en verde.** Se corrigió en las dos detectadas; el resto se revisó y no presenta el problema, pero la comprobación de «no falla antes por otra causa» debería formar parte de la propia definición del corpus y hoy vive en el harness, que no se publica.

## 4. Lo que el corpus todavía no prueba

1. Las cuatro negativas ausentes de **F-11**: `block`, `validate`, `approve`, `revoke`.
2. Una negativa para **`basis.base` con la forma vieja `main@sha`** (ACP11-REQ-041): la regla existe, nadie la ejercita.
3. Una negativa para **dos opciones idénticas** en `question` (F-03), que hoy pasarían.
4. Una negativa por **código de violación desconocido**, que además haría visible F-01 en el acto.
5. Ninguna fixture ejercita **`on_behalf_of`**, ni positiva ni negativa. El campo existe, se validaría, y nadie lo ha probado.

Los cinco huecos son de fixture, no de schema. Ninguno exige tocar la spec.
