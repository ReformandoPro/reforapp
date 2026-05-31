# Application / Repository Gateway

## Objetivo

Definir el futuro punto de composición entre `services`, `repositories`, contexto de aplicación y fuentes de datos.

## Problema

La UI consume `services`, pero los repositories reales necesitarán contexto como:

- `organizationId`
- usuario autenticado futuro
- rol / membership futuro
- selección de fuente de datos: mock vs Supabase

Ese contexto no debe filtrarse hacia UI ni contaminar `ProjectCard`.

## Decisión propuesta

Se diseña una capa futura `application/repository gateway` responsable de:

- resolver el contexto de aplicación;
- seleccionar implementación mock o Supabase;
- construir repositories con contexto;
- mantener `services` como punto estable para UI;
- evitar que la UI importe mocks, Supabase o nombres de tablas.

## Responsabilidades

### UI

- consume `services`;
- no conoce Supabase;
- no conoce `organizationId`;
- no conoce repositories concretos.

### Services

- mantienen contratos de lectura para UI;
- delegan en repositories;
- no deben contener SQL;
- no deben construir contexto de Auth complejo en esta fase.

### Application / repository gateway

- resuelve contexto;
- selecciona data source;
- construye repositories;
- puede usar un `organizationId` fijo en modo mock/desarrollo;
- en futuro usará Auth + memberships.

### Repositories

- implementan contratos;
- reciben contexto ya resuelto;
- no resuelven UI;
- no conocen componentes.

## Modo actual

Estado actual del proyecto:

- mocks activos;
- `SupabaseProjectsRepository` no activo;
- sin Auth;
- sin RLS;
- sin DB real.

## Modo futuro Supabase

Flujo conceptual previsto:

`UI -> service -> application/repository gateway -> SupabaseProjectsRepository(context) -> Supabase -> mapper -> ProjectCard[]`

## Configuración futura de fuente de datos

Opciones posibles a evaluar más adelante:

- variable de entorno;
- factory server-side;
- build-time switch;
- configuración por entorno.

No se implementa todavía ninguna de estas opciones.

## Organization context

`organizationId` se resolverá en `gateway/application layer`, no en UI.

Eso implica:

- no añadir `organizationId` a `ProjectCard`;
- no pasarlo desde componentes;
- no mezclar tenancy con contratos de lectura de UI.

## Ubicación futura sugerida

Ubicación sugerida inicial para esta capa:

- `src/lib/application/`

Motivo:

- separa mejor composición de aplicación frente a contratos (`services`) y frente a implementaciones (`repositories`);
- evita mezclar demasiado pronto lógica de contexto con módulos de repository concretos;
- deja margen para módulos server-only en una zona más controlada.

## Riesgos

- sobrediseñar antes de Auth;
- filtrar tenancy hacia UI;
- mezclar mocks y Supabase dentro de `services`;
- romper tests si se cambia demasiado pronto la composición;
- crear dependencia de código `server-only` en módulos compartidos.

## Preguntas abiertas

- ¿Dónde vivirá físicamente el gateway: `src/lib/application`, `src/lib/repositories`, `src/lib/services` u otro?
- ¿Qué módulos serán `server-only`?
- ¿Cómo seleccionaremos mock vs Supabase?
- ¿Cuándo cambiaremos los `services` para consumir el gateway?
- ¿Cómo se testeará la composición?
- ¿Qué organización fija usaremos en modo demo/local?
- ¿Cuándo entra Auth real?

## Primer paso ya implementado

Ya existe una estructura mínima no conectada en:

- `src/lib/application/`
- `src/lib/application/repositories/projects-repository-factory.ts`

Esa factory:

- devuelve hoy `MockProjectsRepository`;
- está tipada contra `ProjectsRepository`;
- no activa `SupabaseProjectsRepository`;
- no cambia el runtime actual;
- no resuelve todavía `organizationId`;
- no debe ser consumida directamente por UI.

Su valor actual es preparar el punto de composición futuro sin tocar todavía `services/projects.ts`.

## Notas arquitectónicas

- Este documento no implementa el gateway completo.
- La factory mínima no cambia runtime.
- Este documento no cambia firmas públicas de `services` ni `repositories`.
- El mock sigue siendo la implementación activa.
- `SupabaseProjectsRepository` sigue sin activarse en runtime.
