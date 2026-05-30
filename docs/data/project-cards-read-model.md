# ProjectCards Read Model — primer candidato Supabase

## Objetivo

Definir con precisión el primer modelo de lectura que saldrá de mock y podrá leerse desde Supabase en una fase posterior: `getProjectCards()`.

El objetivo no es conectar Supabase todavía. El objetivo es dejar claro qué necesita la UI, qué datos mínimos deberían existir más adelante y qué queda fuera para evitar que la primera integración arrastre complejidad innecesaria.

## Por qué `getProjectCards()` es buen primer candidato

`getProjectCards()` es una lectura pequeña, visible y de bajo riesgo:

- Alimenta el dashboard del reformista y puede validarse visualmente rápido.
- No toca el motor presupuestario.
- No expone costes, márgenes, contingencias ni rentabilidad.
- No requiere Odoo.
- Permite probar el camino `pantalla → servicio → repository → Supabase` con una entidad operativa sencilla.
- Si falla, el impacto funcional es limitado: se puede mantener mock fallback o mostrar estado vacío/error sin afectar cálculos críticos.

## Contrato actual que consume la UI

La UI consume `ProjectCard` desde `src/lib/types/project.ts` mediante el servicio:

```ts
getProjectCards(): ProjectCard[]
```

La UI no debe importar mocks ni repositories directamente. El camino correcto es:

```text
Pantalla → src/lib/services/projects.ts → ProjectsRepository → implementación mock hoy / Supabase mañana
```

## Campos actuales de `ProjectCard`

```ts
export type ProjectCard = {
  id: string;
  name: string;
  clientName: string;
  status: ProjectStatus;
  delayedTasksCount: number;
  blockedTasksCount: number;
  pendingApprovalsCount: number;
};
```

### Significado de cada campo

- `id`: identificador estable de la obra/proyecto dentro de Reformando Core.
- `name`: nombre operativo visible para el equipo interno.
- `clientName`: nombre del cliente operativo mostrado en la tarjeta.
- `status`: estado de la obra usando `ProjectStatus` desde dominio.
- `delayedTasksCount`: número de tareas retrasadas asociadas a la obra.
- `blockedTasksCount`: número de tareas bloqueadas asociadas a la obra.
- `pendingApprovalsCount`: aprobaciones pendientes asociadas a la obra.

## Datos estrictamente necesarios en Supabase más adelante

Para implementar `SupabaseProjectsRepository.getProjectCards()` de forma mínima, harían falta datos equivalentes a:

### Tabla/entidad de obras/proyectos

Campos mínimos conceptuales:

- `id`
- `organization_id`
- `name`
- `status`
- referencia a cliente operativo, por ejemplo `client_id` o equivalente

### Cliente operativo

Campos mínimos conceptuales:

- `id`
- `organization_id`
- `display_name` o nombre operativo equivalente

### Datos para contadores

Para los contadores no hace falta que vivan como columnas en `projects`. Pueden derivarse de entidades operativas:

- tareas asociadas a proyecto para `delayedTasksCount`
- tareas bloqueadas asociadas a proyecto para `blockedTasksCount`
- aprobaciones asociadas a proyecto para `pendingApprovalsCount`

## Datos que pueden seguir siendo calculados o derivados

Estos campos deberían calcularse en query, vista SQL, función de lectura o capa repository, no necesariamente guardarse como verdad principal:

- `delayedTasksCount`
- `blockedTasksCount`
- `pendingApprovalsCount`

Motivo: son agregados operativos. Si se duplican como columnas persistidas, existe riesgo de que queden desactualizados respecto a tareas/aprobaciones reales.

## Datos que no deben entrar aún

Este primer read model no debe incorporar todavía:

- costes estimados
- precio de venta
- margen objetivo
- margen real
- rentabilidad prevista o viva
- contingencias
- materiales previstos
- compras reales
- inventario
- facturación
- datos fiscales del cliente
- datos de Odoo
- permisos finales/RLS
- campos internos no requeridos por la tarjeta
- estados o métricas no expuestos por `ProjectCard`

La tarjeta debe seguir siendo una lectura operativa ligera, no un resumen económico ni administrativo.

## Riesgos

- **Doble verdad en contadores:** si los contadores se guardan y no se calculan, pueden quedar desincronizados.
- **Acoplamiento prematuro a tablas:** `ProjectCard` no debe copiar la forma exacta de futuras tablas Supabase.
- **Exceso de campos:** añadir métricas económicas o administrativas a la tarjeta aumentaría el riesgo y mezclaría responsabilidades.
- **Permisos futuros:** aunque esta fase no implementa auth/RLS, la lectura real deberá filtrar por organización y permisos del usuario.
- **Estado de proyecto inmaduro:** `ProjectStatus` es válido como primera versión, pero puede evolucionar cuando se cierren flujos de obra/tareas/aprobaciones.

## Fuera de esta fase

Queda explícitamente fuera:

- crear migraciones
- crear tablas
- conectar Supabase
- implementar `SupabaseProjectsRepository`
- configurar RLS
- autenticación
- endpoints/API
- Odoo
- cambios visuales
- nuevas dependencias

## Preparación para fase posterior

En una fase posterior podrá crearse una implementación similar a:

```ts
class SupabaseProjectsRepository implements ProjectsRepository {
  getProjectCards(): ProjectCard[] {
    // Leer desde Supabase y mapear a ProjectCard.
  }
}
```

Esa implementación deberá mapear datos reales a `ProjectCard`, no exponer tablas crudas a la UI.
