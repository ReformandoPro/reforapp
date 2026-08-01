# acp/AGENTS.md — punto de arranque en frío de ACP/1

> **Ámbito.** Este fichero es el punto de entrada del protocolo **ACP/1**, en revisión comparativa. **No sustituye ni anula el `AGENTS.md` de la raíz** del repositorio, que sigue siendo la instrucción vigente para trabajar el código. Mientras ACP/1 no esté adoptado, lo de aquí no se aplica a R1, R2 ni R2.1.
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

1. **Nada se afirma sin `basis`.** Sin `sha`, tu review, validación o aprobación no cuenta para ningún gate.
2. **Declara tu ignorancia.** `submit` y `review` sin `unverified` son no conformes. En review adversarial hacen falta además `falsified` y, si el veredicto no es `approve`, `would_change_my_mind`.
3. **No revisas ni apruebas lo que entregaste.**
4. **Toda pregunta al humano lleva `default_if_silent` y `expires`.** No te quedes esperando.
5. **Verifica antes de actuar.** Labels y tableros son hints; confirma en el log y en el head de la rama.

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
v: 1
type: claim
item: RF-142
after: 2451889301
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
v: 1
type: checkpoint
item: RF-142
covers: [2451889301, 2451890420]
state: {phase: IN_REVIEW, freshness: FRESH, modifiers: ["at-risk:RSK-014"]}
basis: {ref: acp/RF-142/rls-grants-idempotentes, sha: c04ff210}
resume:
  goal: "..."
  done: ["..."]
  remaining: ["..."]
  traps: ["lo que ya se descubrió que no funciona"]
  next_action: "..."
open: ["review de hermes pendiente sobre c04ff210"]
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

Campos obligatorios por tipo de evento: `ACP-1.md` §21.
