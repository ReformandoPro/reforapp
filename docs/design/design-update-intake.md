# Design update intake

## Contexto

Material recibido del equipo de diseño para evaluación **sin adopción productiva todavía**.

Objetivo de este documento:

- inventariar el contenido de los ZIP recibidos;
- evaluar compatibilidad con Reformando.app actual;
- identificar qué piezas son adoptables por fases;
- dejar claro qué **no** conviene copiar directamente.

Estado base del repo evaluado:

- Next.js 16
- React 19
- Tailwind 4 (sin `tailwind.config.*` real activo en raíz)
- tokens runtime actuales en `src/app/globals.css`
- componentes base ya alineados parcialmente a tokens runtime (`Card`, `Button`, `Badge`, `EmptyState`, `ErrorState`, `LoadingState`)

---

## 1. Inventario de cada ZIP

### 1. `componentes_tsx.zip`

Contenido detectado:

- `README.md`
- ZIP anidado `componentes-tsx-src.zip`
- tras extraerlo:
  - `src/index.ts`
  - `src/cn.ts`
  - `src/fonts.ts`
  - `src/types.ts`
  - `src/components/*.tsx`

Tipo de material:

- TSX / TypeScript: **sí**
- JSX / JavaScript: no
- HTML: no
- CSS: no directo
- tokens: no directos, pero **asume** tokens del sistema vía Tailwind
- imágenes: no
- configs: no config global completa, pero sí helper y fuentes

Resumen:

- es la librería de componentes más útil para intake técnico;
- contiene componentes de presentación tipados;
- introduce `cn.ts`, `fonts.ts` y `types.ts` como piezas de soporte.

### 2. `design_system.zip`

Contenido detectado:

- `design_system/SISTEMA-DE-DISENO.md`
- `design_system/galeria-pantallas.html`
- `design_system/tailwind.config.js`
- `design_system/tokens.css`
- `design_system/tokens.json`
- residuos `__MACOSX`

Tipo de material:

- TSX / JSX: no
- HTML: **sí**
- CSS: **sí**
- tokens: **sí**
- imágenes: no detectadas
- configs: **sí** (`tailwind.config.js`)

Resumen:

- paquete documental del sistema;
- aporta la definición más completa de tokens y reglas visuales;
- es casi equivalente al material de `design-pruebas-html.zip`.

### 3. `componentes-next.zip`

Contenido detectado:

- `componentes-next/README.md`
- `componentes-next/componentes-next.zip`
- `componentes-next/.DS_Store`
- tras extraer ZIP interno:
  - `jsconfig.json`
  - `tailwind.config.js`
  - `app/layout.jsx`
  - `app/globals.css`
  - `src/index.js`
  - `src/cn.js`
  - `src/fonts.js`
  - `src/components/*.jsx`

Tipo de material:

- JSX / JavaScript: **sí**
- TSX / TypeScript: no
- HTML: no
- CSS: **sí**
- tokens: indirectos, vía config y clases Tailwind
- imágenes: no
- configs: **sí** (`tailwind.config.js`, `jsconfig.json`)

Resumen:

- versión Next/App Router del sistema;
- útil para entender patrón server/client y estructura propuesta;
- no es plug-and-play para nuestro repo actual.

### 4. `design-pruebas-html.zip`

Contenido detectado:

- `SISTEMA-DE-DISENO.md`
- `galeria-pantallas.html`
- `tailwind.config.js`
- `tokens.css`
- `tokens.json`

Tipo de material:

- HTML: **sí**
- CSS: **sí**
- tokens: **sí**
- configs: **sí**
- TSX / JSX: no
- imágenes: no detectadas

Resumen:

- versión limpia y directa del sistema de diseño documental;
- muy útil para comparar tokens y decisiones visuales;
- esencialmente duplicada con `design_system.zip`.

### 5. `componentes.zip`

Contenido detectado:

- `README.md`
- ZIP anidado `componentes-next.zip`
- tras extraerlo aparece el mismo paquete Next de componentes JSX

Tipo de material:

- JSX / JavaScript: **sí**, vía ZIP interno
- configs: **sí**, vía ZIP interno
- resto: igual que `componentes-next.zip`

Resumen:

- paquete contenedor/duplicado de `componentes-next.zip`;
- no aporta material distinto.

---

## 2. Inventario consolidado por tipo de contenido

### TSX / TypeScript

Sí, en `componentes_tsx.zip`:

- `Avatar`
- `Badge`
- `Button`
- `Card`
- `Checkbox`
- `Donut`
- `EmptyState`
- `GuildChip`
- `Input`
- `ListItem`
- `MetricCard`
- `ProgressBar`
- `SegmentedControl`
- `TabBar`
- `Timeline`

### JSX / JavaScript

Sí, en `componentes-next.zip` y `componentes.zip`:

- misma familia funcional de componentes;
- más `app/layout.jsx`, `app/globals.css`, `jsconfig.json`.

### HTML

Sí:

- `galeria-pantallas.html` en `design_system.zip` y `design-pruebas-html.zip`.

### CSS

Sí:

- `tokens.css`
- `app/globals.css` del paquete Next

### Tokens

Sí:

- `tokens.css`
- `tokens.json`
- `tailwind.config.js`

### Imágenes

No se detectan imágenes reales como PNG/JPG/SVG empaquetadas como assets separados.

### Configs

Sí:

- `tailwind.config.js`
- `jsconfig.json`
- `app/layout.jsx`
- `fonts.ts/js`

---

## 3. Componentes detectados y equivalencia con los actuales

## Equivalencia directa con componentes actuales de Reformando.app

### `Card`

- **Existe** en el material nuevo.
- Equivalencia: **alta**.
- Diferencias importantes:
  - admite `variant`, `padding`, `as`;
  - usa clases del sistema (`bg-bg-surface`, `border-subtle`) en lugar de `var(--...)`;
  - `rounded-lg` del sistema no coincide exactamente con nuestro `rounded-2xl` actual.

### `Button`

- **Existe** en el material nuevo.
- Equivalencia: **media**.
- Diferencias importantes:
  - variantes del sistema: `primary`, `confirm`, `secondary`, `text`, `destructive`;
  - nuestro botón actual expone: `primary`, `secondary`, `ghost`;
  - la API no es compatible 1:1.

### `Badge`

- **Existe** en el material nuevo.
- Equivalencia: **media/alta**.
- Diferencias importantes:
  - usa prop `status`, no `tone`;
  - añade `dot` y `pill`;
  - separa explícitamente `Badge` (estado) de `GuildChip` (categoría/gremio).

### `EmptyState`

- **Existe** en el material nuevo.
- Equivalencia: **media**.
- Diferencias importantes:
  - añade `icon`, `action`, `compact`, `className`;
  - el comportamiento y composición son más ricos que nuestro estado vacío actual.

### `ErrorState`

- **No existe** como componente dedicado en el material recibido.
- Equivalencia: **nula**.
- El sistema parece preferir resolver error/alerta con combinaciones de `Card`, `Badge`, texto semántico y tokens de color.

### `LoadingState`

- **No existe** como componente dedicado en el material recibido.
- Equivalencia: **nula**.
- Habría que mantener el nuestro o diseñar una variante propia basada en tokens ya adoptados.

## Nuevos componentes detectados

### Claramente nuevos y potencialmente adoptables

- `MetricCard`
- `MetricCardGroup`
- `ListItem`
- `ListGroup`
- `ProgressBar`
- `Avatar`
- `Input`
- `Checkbox`
- `SegmentedControl`
- `TabBar`
- `Timeline`
- `Donut`
- `GuildChip`

### Valor potencial para Reformando.app

Los más interesantes a corto plazo:

- `MetricCard`: muy alineado con dashboard/KPIs
- `ListItem`: útil para tareas, compras o listados operativos
- `ProgressBar`: útil para presupuestos / avance / progreso
- `Avatar`: útil si luego aparece equipo/cliente
- `Timeline`: útil para hitos o seguimiento de obra
- `SegmentedControl` / `TabBar`: útiles, pero con más impacto estructural en navegación

---

## 4. Tokens nuevos o modificados respecto a `src/app/globals.css`

## Coincidencias conceptuales

Nuestro `globals.css` ya incorpora parte importante del sistema:

- `--bg-base`
- `--bg-surface`
- `--bg-surface-raised`
- `--bg-overlay`
- `--text-primary`
- `--text-secondary`
- `--text-tertiary`
- `--text-disabled`
- `--primary-100/300/500/900`
- `--success-100/500/900`
- `--warning-100/500/900`
- `--danger-100/500/900`
- `--border-subtle/default/strong`
- `--focus-ring`

## Diferencias relevantes

### Valores distintos

El paquete de diseño trae valores distintos frente a los runtime tokens actuales, por ejemplo:

- `--primary-100`
- `--primary-300`
- `--primary-900`
- `--success-100`
- `--success-900`
- `--warning-100`
- `--warning-500`
- `--warning-900`
- `--danger-100`
- `--danger-500`
- `--danger-900`

En otras palabras: la **estructura** de tokens ya existe en nuestro repo, pero la **paleta exacta** no coincide completamente.

### Tokens presentes en diseño y no presentes aún en runtime actual

- `--primary-50`, `--primary-600`, `--primary-700`
- `--success-300`, `--success-700`
- `--warning-700`
- `--danger-700`
- `--guild-chip-*`
- `--border-dashed`
- radios: `--radius-*`
- spacing: `--space-*`
- sombras: `--shadow-fab`, `--shadow-sheet`
- tipografía semántica: `--font-ui`, `--font-num`, `--fs-*`, `--lh-*`, `--fw-*`

### Diferencia estructural importante

El material de diseño sigue modelando algunos bordes y focus como **shorthand CSS**:

- `--border-subtle: 1px solid ...`
- `--focus-ring: 0 0 0 3px ...`

Nuestro runtime reciente los normalizó a valores más operables para clases con `var(--...)`:

- bordes como color
- focus ring como color utilizable en outline/ring

Eso significa que **no conviene copiar `tokens.css` literalmente** encima del runtime actual.

---

## 5. Dependencias externas necesarias, si aparecen

## Dependencias explícitas

No aparecen librerías nuevas obligatorias tipo Radix, clsx, cva, shadcn o icon packs.

## Dependencias implícitas / supuestos del paquete

Sí aparecen estos supuestos:

- `react`
- `next`
- `next/font/google`
- Tailwind con config del sistema
- alias `@/ui` o equivalente

## Utilidades internas aportadas por el paquete

- `cn.ts/js`
- `fonts.ts/js`
- `types.ts`

No son dependencias externas, pero sí **infraestructura adicional** que habría que decidir si adoptar o reimplementar.

---

## 6. Compatibilidad con Next 16 / React 19 / Tailwind 4

## Next 16

### Compatible en concepto

Sí, en principio:

- App Router
- `next/font/google`
- separación server/client
- metadata/layout estructuralmente compatibles

### Pero no plug-and-play

No directamente, porque el paquete Next recibido está pensado para una estructura propia:

- `app/layout.jsx`
- `app/globals.css` con `@tailwind base/components/utilities`
- `tailwind.config.js` tradicional
- alias `@/ui`

Nuestro repo actual no usa ese patrón; usa Tailwind 4 con:

- `@import "tailwindcss";`
- sin `tailwind.config.js` activo en raíz
- tokens runtime en `globals.css`

## React 19

No se observa incompatibilidad obvia. Los componentes son bastante simples y deberían adaptarse sin problema a React 19.

## Tailwind 4

### Compatibilidad parcial

Aquí está el principal punto delicado.

El material recibido asume clases semánticas que dependen de una configuración tipo:

- `bg-bg-surface`
- `text-content-primary`
- `border-subtle`
- `ring-focus`
- `font-num`

Eso **sí funcionaría** si activáramos esa configuración de Tailwind.

Pero hoy Reformando.app no la tiene activa; hoy usamos principalmente:

- clases estándar Tailwind
- `var(--...)` en clases arbitrarias

Por tanto, **copiar tal cual los componentes nuevos rompería compilación o render** si no se adapta primero su capa de tokens/config.

---

## 7. Riesgos de copiar directamente

## Riesgo alto de copia literal

### 1. API distinta en componentes clave

- `Button` cambia variantes
- `Badge` cambia de `tone` a `status`
- `Card` añade `variant/padding/as`
- `EmptyState` cambia estructura

Copiar directo rompería consumidores actuales.

### 2. Dependencia de una capa Tailwind distinta

Los componentes nuevos dependen de clases semánticas que nuestro Tailwind actual no expone como utilities reales.

### 3. Cambio de fuentes

El material trae `Inter` + `Space Grotesk`, mientras el producto actual está sobre `Geist` + `Geist_Mono` en runtime.

### 4. Cambio de layout global

El paquete Next recibido propone:

- `dark` en `<html>`
- otro `globals.css`
- otro `layout.jsx`

No es aceptable copiar eso directamente al producto ya publicado.

### 5. Tipado / soporte adicional

El paquete TSX introduce:

- `types.ts`
- `cn.ts`
- nuevas props y tipos semánticos

Eso requiere decisión de arquitectura, no un simple copy/paste.

### 6. Duplicados y ruido de entrega

Hay duplicación entre ZIPs:

- `componentes.zip` duplica `componentes-next.zip`
- `design_system.zip` duplica en gran medida `design-pruebas-html.zip`
- residuos `__MACOSX` / `.DS_Store`

No conviene incorporar nada directamente sin limpiar y seleccionar.

---

## 8. Recomendación de adopción por fases

## Fase 1 — docs/tokens

**Sí adoptar primero.**

Objetivo:

- consolidar en docs qué tokens del sistema quedan como referencia oficial;
- decidir diferencias entre diseño y runtime actual;
- ampliar `globals.css` solo cuando aporte valor claro y sin romper lo ya integrado.

Candidatos:

- `guild-chip-*`
- `primary-50/600/700`
- `success-300/700`
- `warning-700`
- `danger-700`
- radios/spacing/shadow tipificados si se van a usar realmente

## Fase 2 — componentes base

**Sí, pero de forma incremental.**

Objetivo:

- revisar diferencias de API entre los componentes productivos y los del sistema;
- absorber mejoras visuales o de semántica sin romper consumidores.

Orden recomendado:

1. `Badge` vs `GuildChip`
2. `Card` variantes
3. `Button` nuevas variantes, pero solo tras decidir naming y compatibilidad
4. `EmptyState` enriquecido

## Fase 3 — componentes nuevos

**Sí, selectivamente.**

Prioridad recomendada:

1. `MetricCard`
2. `ProgressBar`
3. `ListItem`
4. `Avatar`
5. `Timeline`

Baja prioridad / más impacto estructural:

- `SegmentedControl`
- `TabBar`
- `Donut`
- `Checkbox`
- `Input`

## Fase 4 — pantallas

**No todavía.**

Solo cuando:

- tokens estén cerrados;
- componentes base estén estabilizados;
- componentes nuevos clave estén adaptados al repo real.

---

## 9. Qué NO adoptar todavía

No adoptar todavía:

- `app/layout.jsx` del paquete Next
- `app/globals.css` del paquete Next
- `tailwind.config.js` del paquete externo como sustitución directa
- `fonts.ts/js` para reemplazar fuentes productivas ahora mismo
- cambio global a clases semánticas tipo `bg-bg-surface` sin plan de migración
- `Button` con variantes nuevas incompatibles (`confirm`, `text`, `destructive`) sin decisión previa
- sustitución directa de `Badge` por un componente basado en `status`
- cualquier rework completo de pantallas productivas
- cualquier adopción del package tal cual desde ZIP sin limpieza y adaptación manual

También **no** conviene adoptar literalmente los bordes/focus de `tokens.css` porque hoy nuestro runtime ya corrigió esos tokens para usarlos mejor con `var(--...)`.

---

## 10. Próxima mini-fase recomendada

## Recomendación principal

La siguiente mini-fase recomendada es:

### **intake técnico de componentes nuevos reutilizables**

Empezar por documentar y preparar adopción de:

- `MetricCard`
- `ProgressBar`
- `ListItem`

Motivos:

- tienen alto valor para Reformando.app;
- no obligan a reescribir navegación global;
- encajan bien con dashboard, listados y progreso de obra;
- permiten validar el patrón de adaptación sin tocar aún pantallas completas.

## Alternativa previa aún más prudente

Si queremos una fase todavía más segura antes de nuevos componentes:

### **documentar delta de tokens y decidir subconjunto oficial v2**

Es decir:

- comparar `tokens.css/tokens.json` recibidos con `src/app/globals.css`;
- decidir qué tokens faltantes sí merecen incorporarse;
- dejar fuera los que no se usan todavía.

---

## Veredicto final

El material recibido es **útil y aprovechable**, pero **no es copiables directo** sobre Reformando.app actual.

Lo más valioso del paquete es:

1. la **documentación de sistema**;
2. la **librería TSX** como referencia de API visual;
3. varios **componentes nuevos reutilizables** (`MetricCard`, `ProgressBar`, `ListItem`, `Avatar`, `Timeline`).

Lo menos recomendable ahora mismo es:

- copiar layouts/configs globales del paquete Next;
- sustituir de golpe componentes productivos actuales;
- forzar la config Tailwind externa dentro del repo actual sin un plan explícito.
