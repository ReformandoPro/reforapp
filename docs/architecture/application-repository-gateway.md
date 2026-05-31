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

## Primeros pasos ya implementados

Ya existe una estructura mínima en:

- `src/lib/application/`
- `src/lib/application/repositories/projects-repository-factory.ts`
- `src/lib/application/repositories/dashboard-repository-factory.ts`
- `src/lib/application/context/projects-application-context.ts`

### Factories mínimas de repository

Actualmente existen dos factories de application:

- `createProjectsRepository(...)`
- `createDashboardRepository(...)`

Estado actual:

- ambas devuelven hoy repositories mock;
- ambas están tipadas contra sus interfaces de repository;
- la de `projects` acepta opcionalmente `ProjectsApplicationContext`;
- ambas exponen una opción conceptual de `dataSource` (`mock` | `supabase`);
- ninguna activa repositories Supabase reales;
- no cambian el runtime actual;
- la de `projects` no usa todavía `organizationId` para seleccionar implementación;
- ambas fallan explícitamente si se pide `supabase` desde la factory;
- no deben ser consumidas directamente por UI.

Su valor actual ya incluye el primer encaje real en:

- `services/projects.ts`
- `services/dashboard.ts`

ambos consumiendo la factory correspondiente con `dataSource: "mock"` sin cambiar el comportamiento visible de la app.

### Shape mínimo de application context

Ahora también existe un shape mínimo `ProjectsApplicationContext` con su helper puro `createProjectsApplicationContext(...)`.

Ese contexto:

- contiene por ahora solo `organizationId`;
- reutiliza el tipo común `EntityId`;
- documenta que el contexto se resolverá fuera de UI;
- sigue sin conectarse a runtime;
- puede pasarse ya de forma opcional a la factory como firma futura;
- todavía no se usa realmente para seleccionar repository;
- todavía no se usa desde `services/projects.ts`.

## Notas arquitectónicas

- Este documento no implementa el gateway completo.
- La factory mínima no cambia runtime.
- La opción `dataSource` todavía no selecciona entornos reales.
- `mock` es la única ruta operativa desde la factory por ahora.
- `supabase` falla de forma explícita para no aparentar soporte activo antes de tiempo.
- Este documento no cambia firmas públicas de `services` ni `repositories`.
- `services/projects.ts` y `services/dashboard.ts` ya entran por la capa application, pero siguen forzando `mock`.
- El mock sigue siendo la implementación activa.
- Los repositories Supabase siguen sin activarse en runtime.
