# ProjectCard Application Context Decision

## Objetivo

Decidir dónde vivirá el contexto de organización antes de llegar al futuro `SupabaseProjectsRepository`.

## Decisión

Se adopta esta decisión de diseño:

- `organizationId` no será parte de `ProjectCard`.
- `organizationId` no será pasado por componentes UI.
- La UI seguirá llamando a `services`.
- Una capa superior de aplicación o repository gateway resolverá el contexto de organización.
- El repository Supabase recibirá ese contexto ya resuelto.
- En fase mock/local podrá existir un `organizationId` fijo de desarrollo, pero no expuesto a UI.
- En fase real, el contexto vendrá de `Supabase Auth + memberships + organización activa`.
- RLS reforzará esta separación más adelante, pero no se implementa todavía.

## Forma futura posible

### Opción A — Factory de repositories

`createProjectsRepository({ organizationId })`

Ventajas:

- simple;
- explícita;
- fácil de testear.

Riesgos:

- puede requerir propagar contexto a varias factories.

### Opción B — Application context

`getApplicationContext()` resuelve `organizationId`, usuario y rol.

Ventajas:

- prepara Auth/RLS/memberships;
- centraliza contexto.

Riesgos:

- puede sobrediseñarse pronto.

### Opción C — Service recibe contexto

`getProjectCards(context)`

Ventajas:

- explícito.

Riesgos:

- puede acabar filtrándose hacia UI si no se controla.

## Recomendación MVP

Para la primera implementación real:

- usar una capa `application/repository gateway` que construya el repository con un contexto explícito;
- no cambiar aún las firmas públicas de `services`;
- no exponer `organizationId` a UI;
- mantener mock activo hasta tener mínimos de Supabase/Auth/RLS.

## Impacto futuro

### SupabaseProjectsRepository

- recibirá contexto de organización ya resuelto;
- no deberá resolverlo directamente desde UI;
- no debería asumir Auth completo en su primera integración real.

### ProjectsRepository

- no cambia todavía;
- podría requerir adaptación futura si la integración real exige contexto explícito en la interfaz o en su construcción.

### services/projects.ts

- no cambia todavía;
- debe seguir actuando como frontera consumida por UI;
- más adelante podrá apoyarse en una capa superior que construya el repository adecuado.

### Hermes / UI

- Hermes no debe añadir `organizationId` a componentes;
- Hermes no debe cambiar `ProjectCard`;
- Hermes debe seguir consumiendo `services`.

### Auth / RLS

- Auth seguirá pendiente;
- RLS seguirá pendiente;
- la capa de contexto prepara el encaje futuro con `memberships`, organización activa y roles.

### Tests

- los tests actuales pueden seguir centrados en mapper y contratos de lectura;
- cuando entre el repository real, será más fácil testear factories o gateways que mezclen contexto + repository.

## Preguntas abiertas

- ¿La primera versión será mono-organización por usuario?
- ¿Habrá selector de organización activa?
- ¿Quién construirá los repositories reales: server action, route handler, service factory o application gateway?
- ¿Cuándo se cambiarán las firmas de `services`?
- ¿Cómo convivirán mock repositories y repositories reales?
- ¿Se necesitará modo demo con organización fija?
- ¿Qué parte debe vivir en código `server-only`?

## Notas arquitectónicas

- Esta decisión no implementa Auth.
- Esta decisión no implementa RLS.
- Esta decisión no activa `SupabaseProjectsRepository` en runtime.
- Esta decisión no cambia interfaces públicas.
- Esta decisión no expone `organizationId` a UI.
