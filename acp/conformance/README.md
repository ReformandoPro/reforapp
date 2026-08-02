# `acp/conformance/` — ACP Conformance Suite 0.1

**Qué significa cumplir ACP, y cómo se demuestra.** Especificación, no implementación.

| | |
|---|---|
| Versión | `0.1.0-draft` |
| Estado | `conformance-suite candidate — not adopted` |
| Contenido ejecutable | **ninguno** |

## Los ficheros

| Fichero | Qué es | Normativo |
|---|---|---|
| [`ACP-CONFORMANCE-0.1.md`](ACP-CONFORMANCE-0.1.md) | La especificación: 8 capas, 7 clases, claims, agregación, packs, seguridad, gates de adopción | **sí** |
| [`requirements.yml`](requirements.yml) | Catálogo de **115** requisitos con ID estable, fuente y comprobabilidad | **sí** |
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

1. **32 de los 115 requisitos son comprobables por JSON Schema.** Los otros 83 necesitan un linter de perfil, un validador semántico, un verificador de binding, un motor de proyección, un evaluador de gates, pruebas de resiliencia o juicio humano. **Ninguno de esos siete componentes existe hoy.**

2. **Hay tres conflictos abiertos entre las fuentes** (spec §5.4). Mientras el primero siga abierto, cinco requisitos describen violaciones que ninguna implementación conforme puede emitir. La suite los marca `CONFLICT` y **no arbitra**.

3. **Las cifras heredadas de cobertura eran incorrectas.** Se hablaba de 78 filas de trazabilidad y 26 requisitos external; medidas de nuevo son **95 y 39**. La suite mapea contra los valores reales y registra la discrepancia (spec §5.2). De ahí sale el requisito `CONF-033`: ninguna cifra publicada debe copiarse a mano.

## Lo que está prohibido

- Declarar «ACP compliant», «fully ACP compatible» o «ACP certified» (spec §3.3).
- Emitir un claim sin capas, versiones, entorno, fecha y digest del informe.
- Reportar `PASS` en un caso clasificado como no automatizable de forma fiable.
- Ejecutar merge, deploy, migración, escritura, borrado, cambio de permisos o rotación de secretos: **prohibido sin excepción en la versión 0.1** (spec §12).

## Fuentes

ACP-1.1 candidate `1bda3e99` · Schema V3 `ae3e4f5e` · GitHub Binding `ca978ac6` · reconciliación `3c884d75` (informativa) · borradores de `docs/agents/**` (**informativos, no normativos**).

Absorbe `docs/agents/conformance-suite-draft.md`, cuya arquitectura de ocho capas se conserva y se convierte en normativa.
