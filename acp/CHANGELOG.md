# Changelog — ACP

Formato: cambios agrupados por versión del protocolo Core. Las versiones de schema, perfil y binding llevan sus propios ejes (ACP-1.md §16.1).

---

## [1.1.0-draft] — candidata a enmienda normativa · sin aprobar

**Base:** ACP-1 en `feat/acp-1-protocol@0b714a9a634255039dbed3a1083718f6ecb7f132`
**Resolución razonada de cada enmienda:** [`decisions/ACP-1.1-amendments.md`](decisions/ACP-1.1-amendments.md)
**Estado de implementación:** **ninguna.** El schema V2 (`feat/acp-envelope-schema@9d073e3c`) implementa una propuesta anterior y discrepa en ocho puntos.

### Breaking

Trece enmiendas bloquean la adopción. Un evento escrito bajo ACP-1 no es válido bajo ACP-1.1 si le falta cualquiera de estos:

| Cambio | Antes (ACP-1) | Ahora (ACP-1.1) | Enmienda |
|---|---|---|---|
| Versión de protocolo | `v: 1` | `v: "1.1"` — cadena mayor.menor | A20 |
| Identidad | `actor` opcional | `actor` **obligatorio** en todo evento | A10 |
| Sujeto | podía faltar en 6 tipos | exactamente uno de `item` o `program` | A17 |
| Causalidad | `after` «según perfil» | obligatorio salvo `root: true` explícito | A11 |
| Tipos raíz | sin definir | solo `spec`, `reconcile`, `decide` de programa | A11 |
| Puntero causal | entero o cadena | solo `"<binding>-<clase>:<id>"` | A21 |
| SHA | prefijo de ≥10 hex | **40 hex minúsculas** | A1 |
| Base del basis | `main@a71c0e94` | `{ref, sha}` | A4 |
| Repositorio | `owner/name` | `{system, id}` portable | A13 |
| Entrega | `pr` obligatorio en `submit` | `delivery: {kind, id}`; el PR va en `extensions` | A6 |
| Ámbito de autorización | `deploy:staging` | `{action, environment}` | A5 |
| Capacidades | `specify`, `approve:<gate>` | `spec`; `approve` + `roles.*.approve_gates` | A7 |
| Lease | `heartbeat`/`release` sin referencia | ambos exigen `claim` | A18 |
| Extensiones | `x-*` sueltas en la raíz | contenedor único `extensions` | A14 |

### Añadido

- **§5.2.1** miembros comunes normativos, con quién produce cada uno.
- **§5.2.2** decisión normativa de forma plana, con política de colisión de nombres (A23).
- **§5.2.3** extensiones: gramática, ubicación, valor, preservación, colisiones.
- **§5.3** catálogo cerrado de **27** tipos, con digest, tabla de alias prohibidos y resolución de los cuatro solapamientos (`review`/`validate`, `approve`/`validate`, `answer`/`decide`, `risk`/`debt`/`block`).
- **§5.4.1** modelo de raíz causal completo: quién genera punteros, raíz explícita, una raíz por hilo, puntero colgante (`flag`, no `void`), binding sin identificadores estables.
- **§6.3** `revalidate` como tipo propio, con tres reglas que el schema no proponía: solo el autor original, no reinicia el TTL, y `outside_scope: false` exige enumerar lo revalidado.
- **§8.6** modelo de identidad: `declared_actor`, `observed_actor`, `identity_assurance`, `identity_mismatch`, `on_behalf_of` (A10, A22).
- **§13.6** principio de silencio con tabla explícita de qué bloquea el formato y qué no (A15).
- **§16.2** escritor estricto / lector tolerante, con conducta obligatoria por caso y modo solo lectura (A8).
- **§16.3** modelo de tiempo unificado authored/observed (A9).
- `acp/CHANGELOG.md` y `acp/decisions/ACP-1.1-amendments.md`.

### Cambiado

- **§4.2** la política de identificadores sale de Core; `R1`, `R2`, `R2.1` quedan como nombres históricos reservados del roadmap (A12).
- **§6.1** basis con SHA completo, repositorio portable, base estructurada, `environment`, y la distinción explícita rama mutable / SHA inmutable.
- **§8.1** capacidades = tipos de evento ∪ `veto`; desaparece `approve:<gate>`.
- **§21** gramática actualizada.
- Todos los ejemplos: SHAs de 40 caracteres, punteros namespaced, `actor` presente.
- `acp/AGENTS.md`: nueva primera regla —no inventar punteros, SHAs, digests ni identificadores— y sección «cuándo detenerte».
- `acp/acp.yml`: `identity.trust_level: 1` declarado, `work_item_pattern`, `never_default_actions`, `approve_gates`, `require_claim_reference`, `allow_empty_unverified`, `revalidate_resets_ttl: false`, extensiones en contenedor.

### Relajado

- **`unverified: []`** pasa a ser admisible como «ninguna declarada». Omitirlo sigue siendo no conforme (A19). ACP-1 obligaba a inventar una incertidumbre para poder entregar.

### Notas de migración

1. **No se migra la historia.** Los eventos anteriores se leen con el lector de su versión (§16.4). Un `checkpoint` de programa declara `from: "1.0"` / `to: "1.1"`.
2. **Los tres primeros pasos, por coste creciente:** (a) `v` a cadena y `actor` en todos los eventos nuevos; (b) SHAs completos y punteros namespaced; (c) renombrar capacidades en `acp.yml`.
3. **Antes de adoptar hace falta un schema V3.** Reconciliar V2 con esta versión son ocho cambios, enumerados en ACP-1.md §0.5.
4. **La comprobación de identificadores contra el perfil no existe todavía.** A12 la sacó del formato y nadie la ha construido.

### Compatibilidad de schema

| Schema | Versión | ¿Implementa ACP-1.1? |
|---|---|---|
| `envelope.schema.json` 0.2.0 | `feat/acp-envelope-schema@9d073e3c` | **No.** Ocho discrepancias |
| `profile.schema.json` 0.2.0 | idem | **No.** Capacidades y `approve:<gate>` desactualizados |
| V3 | no existe | — |

---

## [1.0.0-draft] — ACP-1 · publicada para revisión comparativa

`feat/acp-1-protocol@0b714a9a`, 2026-08-01. Primera versión completa: log append-only con proyecciones derivadas, `basis` con invalidación en cascada, reloj causal `after`, leases con caducidad, checkpoints con presupuesto de lectura, declaración obligatoria de ignorancia, preguntas con default y reloj, superficie de escritura declarada, binding GitHub, autocrítica y límite práctico manual de ~50 work items.

Publicada junto a dos propuestas paralelas (`chore/agent-protocol-mvp`, `openclaw/agent-operating-protocol`); ninguna sustituye a las otras.
