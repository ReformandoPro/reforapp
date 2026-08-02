# `acp/conformance/` — ACP Conformance Suite 0.1

**Qué significa cumplir ACP, y cómo se demuestra.** Especificación, no implementación.

| | |
|---|---|
| Versión | `0.1.0-draft` |
| Estado | `conformance-suite candidate — not adopted` |
| Revisión | Descongelada y actualizada contra las fuentes reconciliadas. Revisión congelada anterior: `b34f70ff` |
| Contenido ejecutable | **ninguno** |

## Los ficheros

| Fichero | Qué es | Normativo |
|---|---|---|
| [`ACP-CONFORMANCE-0.1.md`](ACP-CONFORMANCE-0.1.md) | La especificación: 8 capas, 7 clases, claims, agregación, packs, seguridad, gates de adopción | **sí** |
| [`requirements.yml`](requirements.yml) | Catálogo de **121** requisitos con ID estable, fuente, comprobabilidad y componente external responsable | **sí** |
| [`case-format.schema.json`](case-format.schema.json) | Formato declarativo de un caso de conformidad (Draft 2020-12) | **sí** |
| [`report-format.schema.json`](report-format.schema.json) | Formato del informe de ejecución y del claim (Draft 2020-12) | **sí** |
| [`catalogue.yml`](catalogue.yml) | 7 packs, 19 familias, 39 casos obligatorios, clases de automatización | **sí** |
| [`decisions.md`](decisions.md) | Qué se decidió en esta versión y qué queda abierto | informativo |

## Lo que estos ficheros hacen y no hacen

**Hacen:** definir requisitos citables, decir qué componente puede comprobar cada uno, fijar el formato de casos e informes, y prohibir los claims vagos.

**No hacen:** ejecutar nada. No hay harness, ni casos, ni fixtures, ni CI. Los dos JSON Schema describen **el formato** de casos e informes; no ejecutan casos. `case-format.schema.json` está construido para que un comando no pueda vivir dentro de un caso: el objeto está cerrado y ninguna propiedad acepta código.

## Cómo leerlo, según a qué vengas

| Vienes a… | Lee |
|---|---|
| Entender qué es conformidad | spec §1 y §2 |
| Saber qué puedes afirmar | spec §3, y el formato de claim de §3.2 |
| Escribir un caso | `case-format.schema.json` y spec §6 |
| Interpretar un informe | `report-format.schema.json` y spec §7.3 |
| Saber qué falta por probar | spec §15.2 y §18 |
| Decidir si adoptar algo | spec §16 |

## Las tres cosas que conviene saber antes de usar esto

1. **35 de los 121 requisitos son comprobables por JSON Schema.** Los otros **86** nombran uno de nueve componentes responsables —profile linter, validador semántico del log, verificador de binding, verificador de identidad, verificador de evidencia, motor de leases, motor de proyección, evaluador de gates y capa de compatibilidad de lectura—. **Ninguno de los nueve existe hoy.**

2. **Queda un conflicto abierto entre las fuentes** (spec §5.5): C2, el digest de evidencia. C1 y C3 se cerraron en la reconciliación, y con ellos los cinco requisitos que describían violaciones no emitibles. La suite marca `CONFLICT` y **no arbitra**.

3. **Las cifras han cambiado dos veces.** Se publicaron 78/26, se midieron 95/39 al congelar esta suite, y las canónicas tras la reconciliación son **113 filas, 60 con regla de schema y 53 external**, con 78 y 63 filas cubiertas por fixture válida e inválida. Corpus del Schema V3: **63 + 90 = 153**. La suite mapea contra las canónicas y conserva la historia (spec §5.2). De ahí `CONF-033` y `CONF-034`: ninguna cifra publicada debe copiarse a mano.

## Lo que está prohibido

- Declarar «ACP compliant», «fully ACP compatible» o «ACP certified» (spec §3.3).
- Emitir un claim sin capas, versiones, entorno, fecha y digest del informe.
- Reportar `PASS` en un caso clasificado como no automatizable de forma fiable.
- Ejecutar merge, deploy, migración, escritura, borrado, cambio de permisos o rotación de secretos: **prohibido sin excepción en la versión 0.1** (spec §12).

## Fuentes

ACP-1.1 candidate **`983c3a4a`** · Schema V3 **`42091572`** · GitHub Binding `ca978ac6` · reconciliación `3c884d75` (informativa) · borradores de `docs/agents/**` (**informativos, no normativos**).

ACP-1.1 y Schema V3 están **reconciliados entre sí**. Reconciliación **no es adopción**: las tres piezas siguen siendo candidatas.

Absorbe `docs/agents/conformance-suite-draft.md`, cuya arquitectura de ocho capas se conserva y se convierte en normativa.
