# Hermes UI Guidelines — Reformando.app

## Objetivo

Documentar el sistema visual objetivo de Reformando.app antes de implementar pantallas reales.

Esta guía existe para que Hermes pueda construir UI sobre una base visual consistente sin tocar todavía el runtime visual, la configuración real de Tailwind ni la arquitectura de datos. Su papel en esta fase es servir como referencia operativa y persistente del producto.

## Fuentes utilizadas

Los siguientes archivos fuente quedan versionados como referencia en `docs/design/`:

- `docs/design/source-readme.md`
- `docs/design/source-sistema-de-diseno.md`
- `docs/design/source-tokens.css`
- `docs/design/source-tokens.json`
- `docs/design/source-tailwind.config.js`

Importante:

- `source-tailwind.config.js` es **solo referencia documental**.
- Ninguno de estos archivos sustituye configuración activa del proyecto.
- Los tokens documentan el objetivo visual futuro, pero **no se han aplicado todavía al runtime**.

## Principios visuales

- **Dark mode** como tema base del producto.
- El **color comunica significado, no decoración**.
- El azul **`#2D7FF9`** es el color primario de marca, acción e información.
- El verde **`#1D9E75`** se reserva solo para **dinero, éxito, confirmación o completado**.
- El ámbar **`#EF9F27`** se reserva para **aviso, pendiente o atención**.
- El rojo **`#E24B4A`** se reserva solo para **error, validación o destructivo**.
- Los **gremios** deben representarse con **chip neutro**, no con color propio.
- La **jerarquía** debe venir primero por **peso, tamaño y espaciado**, no por color.
- La interfaz debe mantener **densidad cómoda** para datos de obra, presupuestos, métricas y listados.

## Tokens principales

### Fondos y superficies

- `bg/base`: `#0A0F1A`
- `bg/surface`: `#0E1626`
- `bg/surface-raised`: `#162132`
- `bg/overlay`: `#1C2940`

### Texto

- `text/primary`: `#F4F7FC`
- `text/secondary`: `#A8B2C4`
- `text/tertiary`: `#6B7689`
- `text/disabled`: `#4A5366`

### Semánticos

#### Primario

- `primary/50`: `#E8F1FE`
- `primary/100`: `#C7DEFD`
- `primary/300`: `#6FA8F6`
- `primary/500`: `#2D7FF9`
- `primary/600`: `#1E66D6`
- `primary/700`: `#1850AB`
- `primary/900`: `#0C2F6B`

#### Éxito / dinero

- `success/100`: `#9FE1CB`
- `success/300`: `#5DCAA5`
- `success/500`: `#1D9E75`
- `success/700`: `#0F6E56`
- `success/900`: `#04342C`

#### Warning / pendiente

- `warning/100`: `#FAC775`
- `warning/500`: `#EF9F27`
- `warning/700`: `#854F0B`
- `warning/900`: `#412402`

#### Danger / destructivo

- `danger/100`: `#F09595`
- `danger/500`: `#E24B4A`
- `danger/700`: `#A32D2D`
- `danger/900`: `#501313`

### Gremios

- `guild/chip-bg`: `rgba(136,135,128,0.18)`
- `guild/chip-text`: `#C9CDD6`
- `guild/chip-border`: `rgba(136,135,128,0.28)`

### Bordes

- `border/subtle`: `1px solid rgba(255,255,255,0.06)`
- `border/default`: `1px solid rgba(255,255,255,0.10)`
- `border/strong`: `1px solid rgba(255,255,255,0.16)`
- `border/dashed`: `1px dashed rgba(255,255,255,0.18)`

### Radios

- `radius/sm`: `8px`
- `radius/md`: `12px`
- `radius/lg`: `16px`
- `radius/xl`: `20px`
- `radius/full`: `9999px`

### Espaciado

La base es **4px**.

- `space/1`: `4px`
- `space/2`: `8px`
- `space/3`: `12px`
- `space/4`: `16px`
- `space/5`: `20px`
- `space/6`: `24px`
- `space/8`: `32px`

### Sombras y foco

- `shadow/fab`: `0 8px 24px rgba(45,127,249,0.35)`
- `shadow/sheet`: `0 -8px 32px rgba(0,0,0,0.45)`
- `focus/ring`: `0 0 0 3px rgba(45,127,249,0.45)`

## Tipografía

- **Inter** debe ser la fuente objetivo para UI general.
- **Space Grotesk** debe usarse solo para cifras grandes, importes destacados y métricas hero.
- Mantener escala tipográfica clara para títulos, métricas, labels y tablas densas.

Nota de integración pendiente:

> No cambiar fuentes todavía sin tarea específica; esta guía define el objetivo visual.

El proyecto actual usa Geist en `src/app/layout.tsx`. Eso no debe tocarse en esta tarea.

## Componentes base

### Cards

- Fondo en superficie oscura, no blanco.
- Bordes sutiles, sin sombras pesadas por defecto.
- Radio principal de tarjeta: `16px`.
- Usar superficie elevada solo cuando una tarjeta esté activa, seleccionada o necesite jerarquía adicional.

### Botones

- El botón principal debe ser azul.
- El verde solo debe aparecer en acciones de cobro, confirmación o éxito real.
- Evitar botones cápsula como patrón principal.
- Radio estándar de botón: `12px`.

### Badges

- Info: azul oscuro + texto azul claro.
- Éxito: verde oscuro + texto verde claro.
- Aviso: ámbar oscuro + texto ámbar claro.
- Error: rojo oscuro + texto rojo claro.
- No usar badges de gremios con color semántico.

### Inputs

- Inputs sobre superficie elevada.
- Borde sutil por defecto.
- Focus ring visible.
- Error explícito con borde rojo y mensaje asociado.
- Placeholder y ayudas con texto secundario o terciario.

### Chips de gremios

- Siempre neutros.
- Sin verde, rojo, ámbar o colores arbitrarios por oficio.
- Diferenciación por texto y, si se necesitara más adelante, por icono monocromo.

### Estados de carga, error y vacío

- Deben existir como patrones consistentes de producto.
- No depender solo del color.
- Deben vivir sobre superficies oscuras y mantener contraste suficiente.
- Error y vacío deben comunicar siguiente acción con claridad.

### Listas y tablas

- Densas, pero legibles.
- Separación clara por ritmo vertical y bordes sutiles.
- Priorizar alineación y jerarquía textual antes que exceso de color.
- En presupuestos y obra, evitar ornamentación que dificulte escaneo rápido.

### Importes y métricas

- Importes principales y KPIs destacados con **Space Grotesk**.
- Métricas secundarias pueden permanecer en Inter si no son hero.
- Verde solo para dinero positivo, confirmación o estado favorable real.
- No usar verde como color decorativo de tarjetas enteras si no hay significado semántico.

## Layout y navegación

- Diseño **mobile-first**.
- El futuro **AppShell** debe ser la estructura común de navegación y contenido.
- La navegación podrá ser **inferior** en viewport pequeño y **lateral** en viewport amplio.
- El contenido debe vivir sobre **superficies oscuras** con jerarquía por capas.
- Las tarjetas deben usar **bordes sutiles** y contraste de superficie, no sombras agresivas.
- La navegación activa debe comunicarse principalmente con azul primario.

## Dashboard

- Las métricas principales deben ser claras y priorizadas.
- Los KPIs pueden usar una tarjeta destacada, pero evitando varios acentos compitiendo entre sí.
- Los importes destacados deben usar Space Grotesk cuando sean hero.
- Las alertas deben seguir semántica estricta: info, warning, success, danger.
- Los estados de obras deben leerse rápido sin depender de color excesivo.

## Obras / ProjectCard

- La tarjeta debe priorizar:
  - nombre de obra;
  - cliente;
  - estado;
  - contadores de retrasos, bloqueos y aprobaciones;
  - acción principal clara.
- Los contadores deben representarse con patrones consistentes y semántica visual sobria.
- La UI no debe mostrar ni insinuar detalles técnicos de Supabase, query plans o tenancy.
- La UI debe seguir consumiendo contratos de lectura, no infraestructura.

## Presupuestos

- Los importes principales deben usar **Space Grotesk**.
- El verde debe reservarse a dinero positivo, cobro o confirmación.
- El rojo solo debe aparecer en error o destructivo.
- Las tablas y listas de partidas deben ser densas, claras y fáciles de escanear.
- La jerarquía debe separar con claridad vista interna, alertas y datos clave sin ruido cromático.

## Accesibilidad

- Mantener contraste suficiente en dark mode.
- El focus ring debe ser siempre visible.
- No depender solo del color para comunicar estado.
- Los elementos interactivos deben tener estados claros: reposo, hover, focus, disabled, error.
- La semántica visual debe seguir siendo comprensible para personas con baja visión o percepción limitada del color.

## Qué debe evitar Hermes

- No usar colores fuera del sistema documentado.
- No usar verde para gremios.
- No usar rojo salvo error o destructivo.
- No usar botones cápsula como patrón principal.
- No acoplar UI a mocks, repositories, factories ni Supabase.
- No cambiar Tailwind real todavía.
- No implementar pantallas sin leer esta guía antes.

## Cómo usar esta guía en futuras tareas

Antes de tocar UI, Hermes debe leer este documento junto con los archivos fuente en `docs/design/`.

Reglas de uso:

1. Toda tarea visual futura debe respetar estos tokens y principios.
2. Si una pantalla pide una excepción, debe documentarse explícitamente.
3. La aplicación al código de Tailwind, fuentes o estilos globales se hará en tareas posteriores y separadas.
4. Esta guía no sustituye la arquitectura actual: la UI seguirá consumiendo `services`, no mocks, repositories ni Supabase.
5. Si hay conflicto entre una implementación visual rápida y esta guía, prevalece la guía hasta que se apruebe una nueva decisión.
