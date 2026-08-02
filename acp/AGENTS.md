# acp/AGENTS.md — punto de arranque en frío de ACP/1.1

> **Ámbito.** Este fichero es el punto de entrada del protocolo **ACP/1.1 (candidata a enmienda normativa, no aprobada)**. **No sustituye ni anula el `AGENTS.md` de la raíz** del repositorio, que sigue siendo la instrucción vigente para trabajar el código. Mientras ACP/1 no esté adoptado, lo de aquí no se aplica a R1, R2 ni R2.1.
>
> Las labels y templates que se citan abajo son **propuestas** (`ACP-1.md` §14): todavía no existen en el repo, así que las consultas devolverán vacío hasta que el PO apruebe crearlas.

Fuente de verdad: **el log de comentarios del issue**. El cuerpo del issue, las labels y los Projects son caché regenerable. Si discrepan, gana el log. Spec completa: [`ACP-1.md`](ACP-1.md) · configuración: [`acp.yml`](acp.yml).

## 1. Read path (7 pasos, presupuesto ~5.000 tokens)

Si acabas de arrancar sin contexto, **no leas la spec entera**. Lee esto y para:

1. Este fichero (~600 tokens).
2. [`acp.yml`](acp.yml) — quién eres, qué capacidades tienes, qué gates hay (~700).
3. Tu cola de rol (§3) (~500).
4. Cuerpo del issue del item — es la proyección del estado (~800).
5. El último comentario `type: checkpoint` del item, normalmente pinneado (~500).
6. Solo los comentarios **posteriores** a ese checkpoint (~2.000).
7. El head SHA de las ramas implicadas (§5).

Presupuestos normativos en `acp.yml: limits.context_budget`. Si el paso 6 se pasa de 2.000 tokens, tu primera obligación no es trabajar: es publicar un checkpoint (§6).

## 2. Reglas que no se rompen

1. **No inventes nunca cuatro cosas: punteros de evento, SHAs, digests e identificadores.** Los produce la plataforma o una herramienta; tú los **lees y copias**. Un `after` recordado de memoria, un SHA de 40 caracteres «reconstruido» o un `sha256:` plausible son la falsificación más fácil de cometer y la más difícil de detectar: tienen la forma correcta. Si no puedes leer el valor, **detente y dilo**; no rellenes.
2. **Nada se afirma sin `basis`.** SHA de **40 hex minúsculas**, completo. Una rama no sustituye a un SHA. Sin él, tu review, validación o aprobación no cuenta para ningún gate.
3. **Declara tu ignorancia.** `submit` y `review` sin `unverified` son no conformes. `unverified: []` es admisible y significa «no queda nada por verificar»: es una afirmación fuerte y te la van a atacar. En review adversarial hacen falta además `falsified` y, si el veredicto no es `approve`, `would_change_my_mind`.
4. **No revisas ni apruebas lo que entregaste.**
5. **Toda pregunta al humano lleva `default_if_silent` y `expires`.** No te quedes esperando. Y el silencio **nunca** autoriza desplegar, migrar, escribir en remoto ni nada irreversible.
6. **Verifica antes de actuar.** Labels y tableros son hints; confirma en el log y en el head de la rama.

## 2.1 Miembros comunes de todo evento (ACP-1.1)

```yaml
v: "1.1"                    # cadena mayor.menor
type: claim                 # uno de los 27 del catálogo cerrado
actor: claude               # SIEMPRE. Es tu identidad declarada, no probada
item: RF-142                # exactamente uno de `item` o `program`
after: "github-comment:2451889301"   # salvo raíz. Lo asigna la plataforma
```

- **Raíz:** solo `spec`, `reconcile` y `decide` de programa pueden llevar `root: true` y omitir `after`. Todo lo demás **debe** enlazar. Una raíz se declara; no se deduce de que falte el campo.
- **Extensiones:** van dentro de `extensions:`, con clave `^x-[a-z0-9][a-z0-9-]*$`. Nunca sueltas en la raíz, nunca sustituyendo un campo normativo.
- **Tiempo:** todo lo que escribes es **duración relativa** (`6h`, `3d`, `2w`). Nunca una fecha absoluta: tu reloj no es fiable.
- **Catálogo cerrado (27):** `answer` `approve` `assume` `authorize` `block` `checkpoint` `claim` `close` `debt` `decide` `handoff` `heartbeat` `progress` `question` `reconcile` `release` `revalidate` `review` `revoke` `risk` `spec` `submit` `supersede` `triage` `unblock` `validate` `violation`. No hay alias: es `decide`, no `decision`; `validate`, no `validation`; `spec`, no `specify`.

## 2.2 Cuándo detenerte

Detente y escala en lugar de seguir cuando:

- no puedas **leer** un `after`, un SHA o un digest que necesitas;
- el evento que quieres emitir sea de un tipo que no está en el catálogo;
- leas un evento con **versión mayor distinta**: modo solo lectura, no emitas nada;
- leas un **tipo de evento que no conoces**: no lo interpretes, no lo cuentes para ningún gate;
- el log posterior al último checkpoint pase de 2.000 tokens: primero checkpoint, luego trabajo;
- la acción que vas a hacer esté en §7 y no exista un `authorize` vigente.

## 3. Localizar tu siguiente trabajo

```bash
gh issue list --repo ReformandoPro/reforapp --search 'label:acp/phase:ready -label:acp/mod:blocked -label:acp/claimed sort:created-asc'
gh issue list --repo ReformandoPro/reforapp --search 'label:acp/claimed assignee:@me'
gh issue list --repo ReformandoPro/reforapp --search 'label:acp/phase:submitted,acp/phase:in-review -label:acp/mod:stale'
gh issue list --repo ReformandoPro/reforapp --search 'label:acp/mod:contested,acp/mod:stale,acp/mod:violating'
gh issue list --repo ReformandoPro/reforapp --search 'label:acp/needs:authorize,acp/needs:answer,acp/needs:approve-release'
```

Por rol, en orden: engineer (disponible) · engineer (lo mío) · reviewer · coordinator · product owner.

## 4. Reclamar trabajo y comprobar leases

**Comprueba antes de reclamar.** Un lease vive `created_at + lease`; el reloj es el de GitHub, nunca el tuyo (`ACP-1.md` §1, invariante I4). Lista los `claim` del item y mira su antigüedad:

```bash
gh api repos/ReformandoPro/reforapp/issues/142/comments --jq '.[] | select(.body | contains("type: claim")) | {id, actor: .user.login, created_at}'
```

- Hay un `claim` **más reciente que su `lease`** y sin `release` posterior → **está vivo, no lo toques.** Reclamarlo es `violation:lease-conflict`.
- El `lease` venció y no hay `heartbeat` posterior → está libre. Puedes reclamarlo añadiendo `preempts: <id-del-claim-caducado>` y habiendo leído el trabajo previo.

**Reclamar** es publicar un comentario con envelope. Un comentario sin bloque ` ```acp ` es conversación y no tiene efecto de protocolo:

````
```acp
v: "1.1"
type: claim
item: RF-142
actor: claude
after: "github-comment:2451889301"
lease: 6h
touches: [db/migrations/**, src/security/rls/**]
intent: "Migración idempotente de grants"
```
````

`after` es el ID del último comentario que leíste. Dos eventos con el mismo `after` = bifurcación causal: alguien trabajó sin verte, y el item necesita `reconcile` antes de avanzar.

## 5. Detectar obsolescencia

```bash
git ls-remote origin refs/heads/acp/RF-142/rls-grants-idempotentes   # head real de la rama
git rev-list --count origin/main ^<sha-del-basis>                    # divergencia con la base
```

Compara con el `basis.sha` de la afirmación:

| Observación | Consecuencia |
|---|---|
| `basis.sha` ≠ head de `basis.ref` | La afirmación es `STALE`. **No cuenta para ningún gate** |
| El diff entre ambos SHA no toca `basis.scope` | El autor original puede emitir `revalidate` en vez de revisar otra vez |
| Divergencia con la base > `drift_max_commits` / `drift_max_days` | El item entra en `stale`: rebase y re-validar |
| Review más vieja que `review_ttl`, aprobación que `approval_ttl` | Caducada, aunque nada haya cambiado |

Umbrales en `acp.yml: invalidation`. Recalcula esto **siempre** antes de cruzar un gate: una review aprobada no vale por haber existido, vale si sigue fresca.

## 6. Publicar un checkpoint

Obligatorio si: el log tras el último checkpoint pasa de 2.000 tokens, hay más de 30 eventos, la fase cambia a `ACCEPTED`/`INTEGRATED`, o llevas 7 días de actividad. Es lo que permite que el siguiente agente arranque leyendo cinco comentarios en vez de doscientos.

````
```acp
v: "1.1"
type: checkpoint
item: RF-142
actor: chatgpt
after: "github-comment:2451890420"
covers: ["github-comment:2451889301", "github-comment:2451890420"]
state: {phase: IN_REVIEW, freshness: FRESH, modifiers: ["at-risk:RSK-014"]}
basis: {ref: acp/RF-142/rls-grants-idempotentes, sha: c04ff2101a2b3c4d5e6f7a8b9c0d1e2f30415263}
resume:
  goal: "..."
  done: ["..."]
  remaining: ["..."]
  traps: ["lo que ya se descubrió que no funciona"]
  next_action: "..."
open: ["review de hermes pendiente sobre c04ff2101a2b3c4d5e6f7a8b9c0d1e2f30415263"]
gates: {merge: "2/4: falta review fresca y validation:tests"}
unverified_open: ["..."]
```
````

No borra nada: solo acota lo que hay que leer. Pínchalo en el issue.

## 7. Prohibido sin autorización explícita

Solo el PO emite `authorize`, y **una autorización no se puede inferir**: ni de una conversación, ni de un "adelante" en otro item, ni de una autorización previa parecida. Sin un evento `authorize` vigente —con `scope`, `target`, `basis`, `limits` y `expires`— estas acciones son `violation:unauthorized-action`, la falta más grave del protocolo:

- deploys y releases a cualquier entorno;
- migraciones y cualquier escritura en base de datos remota;
- `git push --force`, reescritura de historia, borrado de ramas ajenas;
- merge a `main`;
- cambios en workflows, secretos, permisos o configuración de plataforma;
- crear, modificar o borrar labels, Projects, templates o releases;
- cualquier acción destructiva o no reversible;
- tocar R1, R2 o R2.1 mientras ACP esté en revisión.

Una autorización está atada a un `basis.sha`: si el SHA cambia, muere. Y un diagnóstico de solo lectura sigue siendo de solo lectura aunque encuentres el arreglo obvio.

## 8. Antes de terminar tu sesión

Emite `handoff` (o `progress`) con un `resume` que incluya `done`, `remaining`, `traps` y `next_action`. **Un handoff sin `resume` no libera tu lease**: el trabajo sigue siendo tuyo hasta que lo entregues bien.

Campos obligatorios por tipo de evento: `ACP-1.md` §5.3 y §21. Enmiendas y su estado: `decisions/ACP-1.1-amendments.md`.
