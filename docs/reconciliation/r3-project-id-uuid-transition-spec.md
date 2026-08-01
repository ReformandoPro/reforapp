# R3 — Transición de `projects.id` text a UUID canónico

Estado: diseño aprobado para revisión; no implementado. Esta especificación no autoriza escritura remota.

## 1. Modelo de transición

Durante la transición, `projects.id` permanece como identificador legacy `text`. Se añade `projects.canonical_id uuid` y una tabla auditable:

```text
project_id_legacy_map(
  legacy_id text primary key,
  canonical_id uuid unique not null,
  created_at timestamptz not null
)
```

El backfill debe mapear los 9 proyectos exactamente: reutilizar el UUID ya convertible solo cuando su identidad sea confirmada; generar UUID nuevos para los 8 IDs legacy; rechazar colisiones, valores ambiguos o cambios de identidad. Después del backfill se valida unicidad y se prepara `NOT NULL`; la activación de `NOT NULL` queda separada de la validación inicial.

## 2. Referencias

Añadir, sin retirar inicialmente las columnas legacy:

- `project_tasks.project_uuid uuid`;
- `budgets.project_uuid uuid`;
- `tasks.project_uuid uuid`.

Rellenar mediante `project_id_legacy_map`, añadir FKs hacia `projects.canonical_id` y demostrar cero huérfanos antes de activar `NOT NULL` donde corresponda. Los conteos previos y posteriores deben conservarse como evidencia.

## 3. Compatibilidad de aplicación

Inventariar server actions, repositories, loaders y queries que usan `project_id`. Durante la transición:

- resolver por legacy ID y UUID canónico;
- mantener `/app/projects/[id]` funcionando con ambos formatos;
- no cambiar URLs existentes en el primer paso;
- definir una canonicalización posterior mediante redirección explícita, sin romper enlaces legacy;
- mantener dual-read y dual-write solo durante la ventana aprobada.

Las URLs legacy deben conservar resolución y aislamiento por organización; un ID desconocido debe producir una respuesta segura, no una consulta cross-tenant.

## 4. `project_phases`

Crear `project_phases` con `project_uuid`/`canonical_id`, nunca con una nueva FK `text`. Añadir `project_tasks.phase_id uuid` y su FK a la tabla de fases solo después de confirmar el modelo de tipos. El nuevo módulo no puede perpetuar dependencias text.

## 5. `profiles.user_id`

Mantener `profiles.id` como PK. Añadir un `UNIQUE` normal sobre `user_id` o un `UNIQUE` parcial `WHERE user_id IS NOT NULL`, según la política de NULL aprobada. PostgreSQL permite múltiples NULL en un UNIQUE normal; los cuatro NULL existentes no pueden convertirse en PK sin una decisión de identidad separada.

## 6. Rollback por fase

- Antes del cambio de lectura: eliminar columnas nuevas, FKs y mapa solo si no existen consumidores externos.
- Después del backfill: conservar el mapa y revertir únicamente columnas/FKs nuevas si las validaciones fallan.
- Después de activar dual-write: rollback de aplicación a dual-read/legacy-read; no borrar canonical IDs usados por clientes.
- Después de activar canonical-read: no es reversible sin mantener un adaptador legacy y snapshots completos.

Cada fase debe declarar explícitamente su último punto reversible antes de ejecutarse.

## 7. Expand / contract

### Expand

Crear columnas, mapa, backfill, índices y FKs; validar los 9/9 proyectos, 5/5 tasks y cero huérfanos.

### Dual-read / dual-write

Leer ambos identificadores, escribir ambos de forma consistente y observar divergencias, errores y latencia. No activar contract mientras exista una lectura legacy.

### Validación

Comparar conteos, mappings, resolución de URLs, aislamiento multi-tenant y errores de referencias desconocidas.

### Contract

Solo después de RC1 y de confirmar que no quedan lecturas legacy: retirar gradualmente dependencias text. La eliminación de `projects.id` legacy es post-RC1 y requiere una decisión separada.

## 8. Pruebas

- 9/9 proyectos mapeados;
- 5/5 `project_tasks` enlazadas;
- cero huérfanos;
- backfill idempotente;
- colisión UUID rechazada;
- ID legacy desconocido rechazado de forma segura;
- navegación por URL legacy y UUID;
- aislamiento multi-tenant;
- rollback de cada fase;
- consistencia entre dual-read y dual-write.

## 9. PRs pequeños

- **R3-A:** mapping y `canonical_id`.
- **R3-B:** columnas FK y backfill.
- **R3-C:** dual-read/dual-write de aplicación.
- **R3-D:** `project_phases` y `phase_id` UUID.
- **R3-E:** contract post-RC1.

Cada PR debe contener solo su fase, fixtures, pruebas, observabilidad y rollback documentado.

## 10. Criterios de parada

Detenerse ante cualquier proyecto sin mapping, huérfano, colisión, URL legacy que deje de resolver, diferencia de conteos antes/después, divergencia dual-read/dual-write o imposibilidad de rollback antes del cambio de lectura.
