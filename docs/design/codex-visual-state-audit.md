# Codex Visual State Audit

Fecha: 2026-06-02

Comparacion auditada:

- Base estable: `be449b5` (`origin/main`)
- Estado rescue: `origin/rescue/codex-visual-state-20260602-192436`
- Diff: `17 files changed, 1611 insertions(+), 138 deletions(-)`

## Resumen ejecutivo

El estado rescue captura una direccion visual util: profundidad, atmosfera oscura, phone frames, CTA azul, verde reservado a dinero/validacion, rojo limitado a error, chips neutros, mayor jerarquia tipografica y uso expresivo de Space Grotesk para cifras.

El problema es la forma de entrada: el cambio sustituyo producto real por una galeria estatica, modifico la home funcional, altero el shell global, toco rutas reales y anadio dependencias. Esa rama no debe mergearse directa ni parcialmente sin extraer antes los patrones a una referencia controlada.

Decision recomendada: tratar `rescue/codex-visual-state-20260602-192436` como artefacto visual de extraccion, no como rama de producto.

## Lista exacta de archivos cambiados

Archivos modificados o creados en el diff `be449b5..origin/rescue/codex-visual-state-20260602-192436`:

- `docs/design/visual-direction-audit.md`
- `package-lock.json`
- `package.json`
- `src/app/budgets/[id]/page.tsx`
- `src/app/budgets/page.tsx`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/projects/[id]/page.tsx`
- `src/app/projects/[id]/tasks/ProjectTasksClient.tsx`
- `src/app/projects/[id]/tasks/page.tsx`
- `src/app/projects/page.tsx`
- `src/components/layout/AppShell.tsx`
- `src/components/screens/BudgetSummaryScreen.tsx`
- `src/components/screens/DesignReferenceScreen.module.css`
- `src/components/screens/DesignReferenceScreen.tsx`
- `src/components/screens/ProjectOverviewScreen.tsx`

## Clasificacion por archivo

### `src/app/page.tsx`

Categoria: PELIGRO / NO ENTRA.

Que hizo: reemplazo la home real, que renderizaba `ReformistDashboardScreen` con `getDashboardSummary()`, por `DesignReferenceScreen`.

Riesgo: desconecta la pantalla principal del dashboard real, elimina datos y convierte la entrada del producto en una demo estatica.

Decision: no mergear. La home debe seguir renderizando producto real.

### `src/components/layout/AppShell.tsx`

Categoria: PELIGRO / NO ENTRA.

Que hizo: convirtio `AppShell` en client component, uso `usePathname()`, oculto el shell en `/` y migro varias clases de `var(...)` a tokens semanticos.

Riesgo: cambia comportamiento global de layout y navegacion para acomodar una pantalla de referencia. Tambien introduce logica condicional por ruta dentro del shell principal.

Decision: no mergear en esta forma. La migracion semantica del shell puede estudiarse en una rama propia, pero sin ocultar navegacion ni condicionar la home.

### `src/app/layout.tsx`

Categoria: PELIGRO / NO ENTRA.

Que hizo: elimino `next/font/google` y las variables de fuente del `<html>`.

Riesgo: cambia la estrategia global de fuentes. Puede ser correcto para builds sin red, pero requiere decision tecnica separada porque afecta a toda la aplicacion.

Decision: no mergear desde rescue. Si se quiere autoalojar fuentes, abrir una rama especifica con aprobacion y pruebas.

### `package.json` y `package-lock.json`

Categoria: PELIGRO / NO ENTRA.

Que hizo: anadio `@fontsource/inter`, `@fontsource/space-grotesk` y `lucide-react`.

Riesgo: introduce dependencias sin aprobacion y mezcla una necesidad de referencia visual con dependencias de producto.

Decision: no mergear. Las dependencias deben evaluarse por separado. `lucide-react` puede ser razonable para iconografia, pero requiere decision explicita.

### `src/app/globals.css`

Categoria: POTENCIALMENTE RESCATABLE TRAS REVISION.

Que hizo: importo fuentes autoalojadas, definio `--font-inter` y `--font-space-grotesk`, y retiro un comentario obsoleto.

Riesgo: cambio global de tipografia y dependencia indirecta de `@fontsource`. No debe entrar si `package.json` no entra.

Que conviene extraer: la idea de asegurar alias CSS claros para `--font-inter` y `--font-space-grotesk`; no necesariamente la implementacion con `@fontsource`.

Decision: revisar en una rama de foundation tipografica, no en la rama de referencia.

### `src/components/screens/DesignReferenceScreen.tsx`

Categoria: RESCATABLE COMO REFERENCIA.

Que hizo: creo una galeria React estatica con tres phone frames: nuevo presupuesto, rentabilidad y portal cliente.

Riesgo: si se conecta a `/`, sustituye producto real por mockup. Tambien contiene datos hardcoded y textos sin acentos por contexto de implementacion rapida.

Que conviene extraer: estructura de patrones visuales, no la ruta ni su uso como home. Patrones utiles:

- phone frame de 360px con altura fija y shadow fuerte;
- headers compactos de pantalla movil;
- CTA azul con sombra `rgba(45,127,249,0.35)`;
- tarjetas de presupuesto con guild chip neutro;
- bloque hero de rentabilidad con verde solo para beneficio;
- donut/progress visuales azules;
- timeline cliente con verde para completado y azul para actual.

Decision: mover o reimplementar como referencia interna aislada, por ejemplo bajo `docs/design/reference-style-library/` o como documento, sin importarlo desde rutas reales.

### `src/components/screens/DesignReferenceScreen.module.css`

Categoria: RESCATABLE COMO REFERENCIA.

Que hizo: concentro 834 lineas de CSS que replican gran parte de la referencia HTML: atmosfera, phone frames, chips, botones, cards, timeline, progress bars, hero de rentabilidad y tab bar.

Riesgo: CSS no esta integrado como sistema, sino como bloque monolitico de una demo. No debe convertirse en `globals.css` ni acoplarse a producto real sin descomponerlo.

Que conviene extraer:

- tokens de atmosfera de pagina;
- geometria de phone frame;
- estilos de guild chips neutros;
- patrones de tarjetas de partidas;
- CTA primario;
- hero de rentabilidad;
- timeline de cliente;
- barras y donuts;
- reglas de color semantico.

Decision: usarlo como fuente para documentar patrones y luego portar a componentes pequenos, no mergearlo como pantalla de producto.

### `src/app/projects/page.tsx`

Categoria: POTENCIALMENTE RESCATABLE TRAS REVISION.

Que hizo: sustituyo clases `var(...)` por tokens Tailwind semanticos y ajusto tipografia en lista de obras.

Riesgo: toca ruta real. Aunque no desconecta datos, cambia UI de pantalla funcional sin revision visual especifica.

Que conviene extraer: uso de `text-overline`, `text-h2`, `text-h3`, `text-content-*`, `bg-bg-surface` y `ring-focus`.

Decision: no mergear desde rescue. Reaplicar incrementalmente en una rama propia de pantalla `projects`, con captura visual y aprobacion.

### `src/app/budgets/page.tsx`

Categoria: POTENCIALMENTE RESCATABLE TRAS REVISION.

Que hizo: migro la lista de presupuestos a tokens semanticos y ajusto jerarquia tipografica.

Riesgo: toca ruta real. El cambio puede ser visualmente correcto, pero entra sin criterio de aceptacion ni revision pantalla por pantalla.

Que conviene extraer: jerarquia `overline -> h3 -> body`, valores con mayor presencia y focus semantico.

Decision: no mergear desde rescue. Reaplicar en rama especifica de budgets cuando se apruebe.

### `src/app/projects/[id]/page.tsx`

Categoria: POTENCIALMENTE RESCATABLE TRAS REVISION.

Que hizo: cambio links de `slate-*` a `text-content-*` y `text-primary-300`.

Riesgo: bajo, pero toca ruta real.

Decision: no mergear desde rescue. Puede recuperarse como cambio pequeno en rama de migracion semantica de proyectos.

### `src/app/budgets/[id]/page.tsx`

Categoria: POTENCIALMENTE RESCATABLE TRAS REVISION.

Que hizo: cambio link de retorno de `slate-*` a `text-content-*`.

Riesgo: bajo, pero toca ruta real.

Decision: no mergear desde rescue. Recuperable en migracion controlada.

### `src/app/projects/[id]/tasks/page.tsx`

Categoria: POTENCIALMENTE RESCATABLE TRAS REVISION.

Que hizo: cambio links, titulo y texto de cabecera de tareas a tokens semanticos.

Riesgo: bajo-medio. Toca ruta real y pantalla funcional.

Decision: no mergear desde rescue. Recuperable en rama especifica de tareas.

### `src/app/projects/[id]/tasks/ProjectTasksClient.tsx`

Categoria: POTENCIALMENTE RESCATABLE TRAS REVISION.

Que hizo: cambio etiquetas, titulos, error y metadatos de tareas de `slate/rose` a tokens semanticos.

Riesgo: toca componente cliente con interaccion optimista. No parece cambiar logica, pero debe revisarse junto con estados visuales de tarea.

Que conviene extraer: uso semantico de `text-danger-100` para errores y `text-overline` para metadatos.

Decision: no mergear desde rescue. Reaplicar con pruebas y screenshot.

### `src/components/screens/BudgetSummaryScreen.tsx`

Categoria: POTENCIALMENTE RESCATABLE TRAS REVISION.

Que hizo: migro detalle de presupuesto de estilo `slate-*` a tarjetas oscuras semanticas, overlines, `text-h2/h3` y superficies elevadas.

Riesgo: pantalla funcional modificada sin validacion de composicion final. Puede mantener datos, pero no garantiza que el diseno resultante sea el deseado.

Que conviene extraer: cards de metricas, separacion interna/cliente y uso de superficie elevada.

Decision: no mergear desde rescue. Replantear como adaptacion real del componente con referencia visual.

### `src/components/screens/ProjectOverviewScreen.tsx`

Categoria: POTENCIALMENTE RESCATABLE TRAS REVISION.

Que hizo: migro detalle de obra a tokens semanticos, tarjetas oscuras y overlines.

Riesgo: pantalla funcional modificada. No rompe datos aparentemente, pero cambia la composicion sin una especificacion de pantalla de obra.

Que conviene extraer: patron de metricas de obra y secciones con chips.

Decision: no mergear desde rescue. Reaplicar tras definir ficha de obra.

### `docs/design/visual-direction-audit.md`

Categoria: POTENCIALMENTE RESCATABLE TRAS REVISION.

Que hizo: documento de diagnostico visual general.

Riesgo: no toca producto. Puede solaparse con otros documentos de diseno y generar duplicidad.

Decision: revisar contenido y, si aporta, consolidarlo con este documento o con una decision de direccion visual.

## Cambios que NO deben mergearse

No debe mergearse directamente ninguno de estos cambios desde rescue:

- Reemplazo de `src/app/page.tsx` por `DesignReferenceScreen`.
- Condicional de `AppShell` que oculta layout/navegacion en `/`.
- Conversion de `AppShell` a client component motivada por la demo.
- Cambios en `src/app/layout.tsx` relacionados con estrategia global de fuentes.
- Cambios en `package.json` y `package-lock.json` que anaden dependencias.
- Modificaciones de rutas reales de `projects`, `budgets` y `tasks` sin rama/pantalla especifica.
- Uso de `DesignReferenceScreen` como producto o ruta publica.

## Cambios que si conviene extraer

Elementos visuales valiosos del estado rescue:

- Atmosfera oscura con profundidad, no fondo plano.
- Phone frames como referencia visual interna, no como producto.
- Chips neutros de gremio: mismo color, diferenciados por texto.
- CTA azul con mayor presencia y sombra controlada.
- Verde limitado a beneficio, validacion, completado o dinero.
- Rojo limitado a errores o acciones destructivas.
- Jerarquia de presupuesto: seccion, input, partida, metricas, subtotal, footer fijo.
- Hero de rentabilidad: cifra grande con Space Grotesk y verde semantico.
- Timeline cliente: hitos completados en verde y estado actual en azul.
- Overlines pequenos para secciones densas.
- Numeros importantes con tipografia numerica.
- Superficies con contraste por capas: base, surface, raised.

## Cambios a descartar

- Datos hardcoded como sustitutos de contratos reales.
- Textos sin acentos derivados de implementacion rapida.
- CSS monolitico de demo como implementacion final.
- Ruta `/` convertida en galeria.
- Logica de layout dependiente de si la ruta es una referencia visual.
- Dependencias agregadas por necesidad de demo antes de aprobacion.

## Estrategia de migracion segura

La siguiente rama segura debe ser:

`openclaw/ui-reference-style-library`

Objetivo de esa rama:

- Extraer el lenguaje visual del estado rescue a una referencia interna controlada.
- Documentar patrones reutilizables.
- Aislar CSS o componentes de referencia.
- No modificar rutas reales.
- No modificar `AppShell`, `layout`, `package.json`, `package-lock.json`, Supabase ni servicios de datos.

Alcance permitido para esa rama:

- Documentacion en `docs/design/`.
- Opcionalmente, una carpeta de referencia sin imports desde producto, por ejemplo `docs/design/reference-style-library/`.
- Capturas, notas de patrones y decisiones de extraccion.
- No debe afectar a `src/app/*`, `src/components/layout/*`, `src/lib/*` ni dependencias.

## Plan propuesto por ramas

### Rama 1: `openclaw/ui-reference-style-library`

Tipo: documentacion / referencia.

Cambios permitidos:

- `docs/design/codex-visual-state-audit.md`
- documentar patrones extraibles de `DesignReferenceScreen.module.css`
- definir criterios de aceptacion visual por patron

Cambios prohibidos:

- rutas reales
- layout global
- dependencias
- Supabase
- mocks como pantallas publicas

### Rama 2: `openclaw/ui-reference-components`

Tipo: componentes aislados de referencia.

Objetivo:

- crear componentes de referencia no usados por rutas reales, o documentar su API propuesta;
- extraer `PhoneFrame`, `VisualLegend`, `ReferenceCard`, `ReferenceChip`, `ReferenceCta` si se decide mantenerlos como codigo.

Condicion:

- ningun import desde `src/app/*`.

### Rama 3: `openclaw/ui-foundation-fonts-icons`

Tipo: decision tecnica.

Objetivo:

- decidir si se autoalojan fuentes;
- decidir si se adopta `lucide-react` o se usan iconos propios/actuales;
- resolver builds sin red sin mezclarlo con cambios visuales de producto.

### Rama 4: pantalla real, una por vez

Ejemplos:

- `openclaw/ui-dashboard-visual-migration`
- `openclaw/ui-budget-summary-visual-migration`
- `openclaw/ui-project-overview-visual-migration`

Regla:

- cada rama toca una pantalla o modulo concreto;
- conserva datos y contratos existentes;
- incluye antes/despues visual;
- no reemplaza pantalla funcional por mockup.

## Criterios de aceptacion para futuras migraciones visuales

Antes de mergear cualquier migracion visual:

- La ruta sigue renderizando los mismos datos que antes.
- No se elimina navegacion existente.
- No se cambia `AppShell` salvo rama dedicada.
- No se cambia `layout.tsx` salvo rama dedicada.
- No se anaden dependencias salvo aprobacion explicita.
- La pantalla no contiene datos hardcoded salvo mocks existentes del repositorio.
- `npm run lint`, `npm test` y `npm run build` pasan.
- Hay revision visual contra la referencia aprobada.

## Conclusion

El estado rescue contiene una direccion visual aprovechable, pero su implementacion no es aceptable como producto. La accion correcta es extraer patrones, documentarlos y reintroducirlos por ramas pequenas sobre pantallas reales, manteniendo contratos de datos, rutas y navegacion.

La rama `openclaw/ui-reference-style-library` debe empezar como documentacion y referencia interna. Cualquier aplicacion sobre producto real debe venir despues, pantalla por pantalla.
