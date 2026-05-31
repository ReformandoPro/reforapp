# Sistema de Diseño — App de Gestión de Reformas

> Análisis profesional y sistema de diseño unificado, construido a partir de 20 pantallas existentes.
> Versión 1.0 · Tema base: **dark mode**

---

## 0. Resumen ejecutivo

Las 20 pantallas analizadas pertenecen a un mismo producto (gestión de reformas y obras) pero fueron diseñadas en **dos iteraciones visuales distintas** que conviven sin unificar:

- **Familia A — "Azul vibrante / iOS-like":** fondo casi negro azulado, azul saturado dominante, botones cápsula, verde esmeralda para importes.
- **Familia B — "Azul acero / Material-like":** fondo azul-marino más cálido, azul más mate, esquinas menos redondeadas, verde-menta distinto.

Este documento **no inventaria lo existente tal cual**, sino que define el **sistema ideal unificado** derivado de lo mejor de ambas familias, con las siguientes decisiones de fondo ya tomadas:

| Decisión | Resolución |
|---|---|
| Unificación | Un único sistema (fusión de familias A + B) |
| Azul primario | **#2D7FF9** (azul vibrante de la familia A) |
| Verde | **#1D9E75** (calibrado para contraste sobre fondo oscuro) |
| Botón primario | **Azul**; verde reservado a dinero/confirmación |
| Gremios | **Neutralizados**: mismo chip, diferenciados solo por texto |
| Radio de botones | **Medio (~12px)**, más sobrio (no cápsula) |
| Tipografía | Pareja nueva coherente: **Inter** (UI) + **Space Grotesk** (cifras) |
| Set semántico | **Mínimo**: info, éxito, aviso, error (4 estados) |

---

## 1. Principios de diseño

1. **El color comunica significado, no decora.** Cada color tiene un trabajo. Si un color aparece en tres sitios con tres significados, sobra en dos de ellos.
2. **Un solo primario.** El azul `#2D7FF9` es la voz de marca y de acción. Todo lo accionable e informativo nace de él.
3. **El verde es dinero y confirmación.** Nunca un gremio, nunca decoración. Cuando el usuario ve verde, piensa "esto suma / esto está hecho / esto se cobra".
4. **Los estados son sagrados y limitados.** Cuatro y solo cuatro: info, éxito, aviso, error. No se añaden colores de estado nuevos.
5. **Jerarquía por peso y tamaño antes que por color.** El texto se ordena con escala tipográfica y opacidad, no pintándolo de colores.
6. **Superficies planas y elevación por contraste, no por sombras pesadas.** El dark mode se construye con tres niveles de fondo y bordes sutiles.
7. **Densidad cómoda.** La app maneja datos densos (partidas, importes, listas). El espaciado es generoso pero no derrochador.

---

## 2. Color

### 2.1. Fondos (superficies)

El sistema usa una escala de tres superficies más una de elevación. Todos los valores son para dark mode (tema base).

| Token | Hex | Uso |
|---|---|---|
| `bg/base` | `#0A0F1A` | Fondo de pantalla (el más oscuro) |
| `bg/surface` | `#0E1626` | Tarjetas y contenedores sobre el fondo |
| `bg/surface-raised` | `#162132` | Tarjetas elevadas, inputs, estados hover |
| `bg/overlay` | `#1C2940` | Menús, hojas modales, popovers |

### 2.2. Texto

| Token | Hex | Uso |
|---|---|---|
| `text/primary` | `#F4F7FC` | Títulos, importes, contenido principal |
| `text/secondary` | `#A8B2C4` | Subtítulos, descripciones, labels |
| `text/tertiary` | `#6B7689` | Placeholders, metadatos, pistas |
| `text/disabled` | `#4A5366` | Elementos deshabilitados |

### 2.3. Primario (azul)

Escala completa derivada de `#2D7FF9`. La usamos para acción principal, enlaces, progreso, selección activa y el estado informativo.

| Token | Hex | Uso |
|---|---|---|
| `primary/50` | `#E8F1FE` | Fondos de chip info muy sutiles (raro en dark) |
| `primary/100` | `#C7DEFD` | Texto azul sobre fondos azules oscuros |
| `primary/300` | `#6FA8F6` | Iconos y texto de acento, enlaces hover |
| `primary/500` | `#2D7FF9` | **Color base** — botón primario, barra de progreso |
| `primary/600` | `#1E66D6` | Hover de botón primario |
| `primary/700` | `#1850AB` | Pressed / borde de chip info |
| `primary/900` | `#0C2F6B` | Fondo de chip/badge info (con texto `primary/100`) |

### 2.4. Verde (éxito / dinero)

Escala derivada de `#1D9E75`. **Reservada** a: importes positivos, beneficio, pagos recibidos, estados "completado/finalizado/al día" y la acción de confirmar/cobrar.

| Token | Hex | Uso |
|---|---|---|
| `success/100` | `#9FE1CB` | Texto verde sobre fondos verdes oscuros |
| `success/300` | `#5DCAA5` | Importes y porcentajes positivos |
| `success/500` | `#1D9E75` | **Color base** — badge "pagado", check de completado |
| `success/700` | `#0F6E56` | Borde / pressed |
| `success/900` | `#04342C` | Fondo de badge éxito (con texto `success/100`) |

### 2.5. Ámbar (aviso / pendiente)

Escala derivada de `#EF9F27`. Para: borrador, material pendiente, en cola, certificación pendiente. **Nunca** para un gremio.

| Token | Hex | Uso |
|---|---|---|
| `warning/100` | `#FAC775` | Texto ámbar sobre fondos oscuros |
| `warning/500` | `#EF9F27` | **Color base** — badge "pendiente", punto de aviso |
| `warning/700` | `#854F0B` | Borde / pressed |
| `warning/900` | `#412402` | Fondo de badge aviso (con texto `warning/100`) |

### 2.6. Rojo (error / destructivo)

Escala derivada de `#E24B4A`. **Exclusivamente** para errores de validación y acciones destructivas (eliminar partida, borrar). Esto retira el rojo del gremio "Calefacción" (imagen 15) y de cualquier uso decorativo.

| Token | Hex | Uso |
|---|---|---|
| `danger/100` | `#F09595` | Texto de error |
| `danger/500` | `#E24B4A` | **Color base** — icono eliminar, borde de input con error |
| `danger/700` | `#A32D2D` | Borde / pressed |
| `danger/900` | `#501313` | Fondo de alerta de error |

### 2.7. Neutro de gremios

Los gremios (Albañilería, Fontanería, Electricidad, Pintura, Carpintería, Calefacción, Saneamientos, etc.) **ya no llevan color propio**. Todos usan el mismo chip neutro:

| Token | Hex | Uso |
|---|---|---|
| `guild/chip-bg` | `rgba(136,135,128,0.18)` | Fondo del chip de gremio |
| `guild/chip-text` | `#C9CDD6` | Texto del gremio |
| `guild/chip-border` | `rgba(136,135,128,0.28)` | Borde opcional |

> **Por qué.** Con 8+ gremios, asignar un color a cada uno produce un arcoíris que compite con los estados semánticos (verde y rojo ya tienen significado fijo). Diferenciar solo por texto es más escalable y elimina colisiones. Si en el futuro se necesita distinguirlos de un vistazo, el camino correcto es un **icono por gremio** (línea, monocromo), no un color de fondo.

---

## 3. Tipografía

Pareja nueva, coherente y muy legible en pantalla:

- **Inter** — toda la interfaz (títulos, cuerpo, labels, botones). Nativa, neutra, excelente en tamaños pequeños y densidad alta.
- **Space Grotesk** — exclusivamente para **cifras grandes destacadas**: importes totales, porcentajes de progreso, m². Aporta el carácter geométrico que insinuaban las pantallas de "Configuración de Superficie" sin meter una segunda fuente de texto corrido.

### 3.1. Escala tipográfica

| Token | Tamaño / Interlineado | Peso | Fuente | Uso |
|---|---|---|---|---|
| `display` | 34 / 40 | 700 | Space Grotesk | Importe/dato hero (ej. "4.275,00 €", "8.420,00 €") |
| `h1` | 28 / 34 | 700 | Inter | Título de pantalla ("¿Cómo quieres calcular…") |
| `h2` | 22 / 28 | 700 | Inter | Título de sección ("Proyectos en curso") |
| `h3` | 18 / 24 | 600 | Inter | Título de tarjeta ("Calle Mayor 42 - Reforma…") |
| `body` | 16 / 24 | 400 | Inter | Texto principal |
| `body-strong` | 16 / 24 | 600 | Inter | Texto principal enfatizado |
| `label` | 14 / 20 | 500 | Inter | Labels de campo, navegación |
| `caption` | 13 / 18 | 400 | Inter | Metadatos, descripciones secundarias |
| `overline` | 12 / 16 | 600 | Inter | Etiquetas en mayúsculas ("DESGLOSE DE PARTIDAS") — `letter-spacing: 0.06em` |
| `num-md` | 18 / 24 | 600 | Space Grotesk | Importes en línea, subtotales |

> **Nota sobre mayúsculas.** Las etiquetas tipo `overline` (CLIENTE, CANTIDAD, PARTIDA DE OBRA) se mantienen en mayúsculas con `letter-spacing` porque jerarquizan bien secciones densas. No abusar fuera de labels cortos.

---

## 4. Espaciado, radios y elevación

### 4.1. Escala de espaciado (base 4px)

| Token | px | Uso típico |
|---|---|---|
| `space/1` | 4 | Gaps internos mínimos |
| `space/2` | 8 | Gap entre icono y texto |
| `space/3` | 12 | Padding interno de chips, gap entre tarjetas pequeñas |
| `space/4` | 16 | Padding estándar de tarjeta, gap entre bloques |
| `space/5` | 20 | Padding cómodo de tarjeta |
| `space/6` | 24 | Separación entre secciones |
| `space/8` | 32 | Márgenes de pantalla amplios |

### 4.2. Radios de esquina

Decisión: **radio medio, sobrio** — se abandona la cápsula total de la familia A.

| Token | px | Uso |
|---|---|---|
| `radius/sm` | 8 | Chips, badges, inputs pequeños |
| `radius/md` | 12 | **Botones**, inputs, tarjetas pequeñas |
| `radius/lg` | 16 | Tarjetas y contenedores principales |
| `radius/xl` | 20 | Hojas modales, contenedores grandes |
| `radius/full` | 9999 | **Solo** avatares y el FAB circular |

### 4.3. Bordes

| Token | Valor | Uso |
|---|---|---|
| `border/subtle` | `1px solid rgba(255,255,255,0.06)` | Separadores, borde de tarjeta por defecto |
| `border/default` | `1px solid rgba(255,255,255,0.10)` | Borde de input, tarjeta destacada |
| `border/strong` | `1px solid rgba(255,255,255,0.16)` | Hover, foco no semántico |
| `border/dashed` | `1px dashed rgba(255,255,255,0.18)` | Zona "Añadir partida / habitación" |

### 4.4. Elevación

En dark mode la elevación se expresa **subiendo el nivel de superficie**, no con sombras fuertes. Sombras solo para elementos flotantes reales:

| Token | Valor | Uso |
|---|---|---|
| `shadow/fab` | `0 8px 24px rgba(45,127,249,0.35)` | FAB y botón primario flotante |
| `shadow/sheet` | `0 -8px 32px rgba(0,0,0,0.45)` | Hojas modales inferiores |
| `focus/ring` | `0 0 0 3px rgba(45,127,249,0.45)` | Anillo de foco accesible |

---

## 5. Catálogo de componentes

### 5.1. Botones

| Variante | Fondo | Texto | Radio | Uso |
|---|---|---|---|---|
| **Primario** | `primary/500` → hover `primary/600` | `#FFFFFF` | `radius/md` | Acción principal (Confirmar, Añadir, Generar) |
| **Confirmación / dinero** | `success/500` → hover `success/700` | `#FFFFFF` | `radius/md` | Solo cuando la acción es cobrar/confirmar pago/finalizar obra |
| **Secundario** | `bg/surface-raised` | `text/primary` | `radius/md` | Acción alternativa (Guardar, PDF) |
| **Terciario / texto** | transparente | `primary/300` | — | Enlaces de acción ("Ver todos", "Detalles", "Ver historial") |
| **Destructivo** | transparente, icono `danger/500` | `danger/500` | `radius/md` | Eliminar |
| **FAB** | `primary/500` | `#FFFFFF` | `radius/full` | Acción de creación flotante (+) |

> **Corrección clave.** En las imágenes 2 y 5 la misma acción "Enviar Presupuesto" aparecía en verde y en azul. **Unificación: azul (primario).** El verde queda libre para "Generar Factura Final / Confirmar cobro".

### 5.2. Tarjetas

- **Tarjeta estándar:** `bg/surface`, `border/subtle`, `radius/lg`, padding `space/5`.
- **Tarjeta elevada / seleccionada:** `bg/surface-raised`, borde `primary/700` si está activa.
- **Tarjeta de métrica (KPI):** `bg/surface`, label `overline` en `text/secondary` arriba, cifra `display`/`num-md` debajo. La tarjeta activa puede usar fondo `primary/500` con texto blanco (como "ACTIVOS 12" en imagen 3) — **máximo una** activa por grupo.

### 5.3. Inputs y campos

- Fondo `bg/surface-raised`, borde `border/default`, radio `radius/md`, texto `text/primary`, placeholder `text/tertiary`.
- Foco: `focus/ring` + borde `primary/500`.
- Error: borde `danger/500` + mensaje en `danger/100`.
- Campos numéricos con unidad (m², €, ml): unidad alineada a la derecha en `text/tertiary`.

### 5.4. Chips y badges

| Tipo | Fondo | Texto | Ejemplos |
|---|---|---|---|
| **Estado info** | `primary/900` | `primary/100` | "EN PROGRESO", "ACTUAL", "FASE 3 DE 5" |
| **Estado éxito** | `success/900` | `success/100` | "ENTREGADO", "FINALIZADO", "AL DÍA", "PAGADO" |
| **Estado aviso** | `warning/900` | `warning/100` | "BORRADOR", "PENDIENTE", "MATERIAL PENDIENTE" |
| **Estado error** | `danger/900` | `danger/100` | Solo errores |
| **Gremio (neutro)** | `guild/chip-bg` | `guild/chip-text` | "Albañilería", "Fontanería", "Pintura"… |
| **Contador** | `bg/surface-raised` | `text/secondary` | "3 Partidas", "2 estancias", "+5" |

### 5.5. Barras de progreso

- Pista: `bg/surface-raised` (o `rgba(255,255,255,0.08)`).
- Relleno: `primary/500` por defecto.
- **Excepción semántica:** si el contexto es de aviso (proyecto con material pendiente, imagen 3 "Apartamento 4B" al 20% en naranja), el relleno puede usar `warning/500`. Pero el caso por defecto, y el de "al día", es **azul** — no naranja. Revisar que el naranja solo aparezca cuando hay un aviso real asociado.

### 5.6. Navegación inferior (tab bar)

- Fondo `bg/base` con `border/subtle` superior.
- Ítem activo: icono + label en `primary/500`.
- Ítem inactivo: `text/tertiary`.
- **Iconografía unificada:** un solo set, estilo **lineal** (outline), grosor constante. Se abandona la mezcla de iconos rellenos/lineales y el ítem activo se distingue por color, no por relleno.

### 5.7. Timeline / hitos

- Hito completado: punto relleno `success/500` con check.
- Hito en curso: punto `primary/500` (anillo o relleno) + título en `primary/300`.
- Hito pendiente: punto hueco `border/strong`, texto `text/tertiary`.
- Línea conectora: `border/subtle`.

### 5.8. Comparador antes/después (galería)

- Dos imágenes lado a lado, `radius/lg`.
- Etiqueta "ANTES": chip neutro oscuro (`rgba(0,0,0,0.6)` + texto blanco).
- Etiqueta "DESPUÉS / ACTUAL": chip `primary/900` + texto `primary/100` (azul), **no** verde — es información de estado temporal, no de éxito.

---

## 6. Mapa: qué componentes aparecen en qué pantallas

| # | Pantalla | Tipo / Rol | Componentes clave presentes |
|---|---|---|---|
| 1 | Configuración de Superficie | Onboarding / selector | Tarjetas-opción grandes, tab bar, h1 |
| 2 | Nuevo Presupuesto | Formulario + lista partidas | Inputs, tarjetas de partida, chips de gremio, contador, botón primario + secundario, total hero |
| 3 | Dashboard Administrador | Home / panel | KPI cards (1 activa azul), tarjetas de proyecto, barra de progreso, avatares apilados, FAB, tab bar |
| 4 | Detalle del Proyecto (admin) | Detalle | Barra de progreso, metric mini-cards, comparador antes/después, tarjetas de tarea, chips de estado, FAB |
| 5 | Presupuesto #2024-08 | Detalle financiero | Tabla de partidas, badge "BORRADOR" (aviso), total hero, botón secundario + primario |
| 6 | Bienvenida (portal cliente) | Home cliente | Tarjeta de estado, chip "FASE 3 DE 5" (info), timeline de hitos, galería, tab bar |
| 7 | Gestión de Compras | Lista / búsqueda | Buscador, filtros pill, tarjetas de pedido, chips de estado (entregado/enviado/pendiente), FAB |
| 8 | Detalle del Proyecto | Detalle con tabs | Tabs, lista reordenable, checkboxes de material, comparador antes/después, botón primario + compartir |
| 9 | Medidas por Habitaciones | Formulario | Barra de progreso, tarjetas de estancia con icono, contador, zona "nueva estancia" (dashed), botón primario |
| 10 | Medida Lineal | Formulario simple | Input grande con unidad, alerta info, botón primario inferior |
| 11 | Esquema de Reforma | Visualización | Lienzo con cajas-estancia, tarjeta resumen, botón primario |
| 12 | Cierre de Obra | Detalle financiero | Importe hero, metric cards, timeline de pagos, lista de extras, toggle, botón **verde** (factura) |
| 13 | Rentabilidad | Dashboard analítico | Importe hero (verde), donut charts, barras por categoría, alerta info, botón primario + overflow |
| 14 | Galería de Avance | Galería timeline | Filtros pill, timeline, tarjetas de foto con estado, FAB cámara, tab bar |
| 15 | Lista de Compra | Lista agrupada | Grupos por gremio (**neutralizar color**), checkboxes, estimación total, barra de progreso, botón primario |
| 16 | Nuevo Presupuesto (partida) | Formulario detallado | Buscador, tarjeta de descripción técnica, chips de material incluido, metric cards, complementos +/−, total hero, tab bar |
| 17 | Perfil Profesional | Perfil | Avatar verificado, tarjeta de reputación, segmented control, chips de habilidad (check verde = validado), botón primario |
| 18 | Portal Cliente (estancias) | Detalle cliente | Tarjeta de progreso, chips de gremio (**neutralizar**), comparadores antes/después, checklists, tab bar |
| 19 | Documentos | Lista de archivos | Tarjeta resumen, grupos de documentos, iconos por tipo, botones de descarga, tab bar |
| 20 | Tarifa: Tabiquería | Formulario config | Inputs, chips de material editables, metric cards, complementos, alerta info, FAB, tab bar |

---

## 7. Registro de incongruencias detectadas y su corrección

| # | Incongruencia observada | Pantallas | Corrección aplicada |
|---|---|---|---|
| I-1 | Dos azules primarios distintos | A vs B | Unificar en `#2D7FF9` |
| I-2 | Dos verdes (esmeralda vs menta) | 2, 12, 13 | Unificar en `#1D9E75` |
| I-3 | Botón "Enviar Presupuesto" verde **y** azul | 2 vs 5 | Primario = **azul**; verde solo dinero/confirmar |
| I-4 | Gremios con 5+ colores | 2, 13, 15, 18 | Chip neutro único, diferenciado por texto |
| I-5 | **Rojo usado para gremio "Calefacción"** | 15 | Rojo reservado a error/destructivo; gremio pasa a neutro |
| I-6 | Verde con 3 significados (dinero, estado, gremio) | 4, 8, 13, 18 | Verde solo éxito/dinero; gremio neutro; estado completado mantiene verde |
| I-7 | Ámbar con 3 significados (pendiente, gremio, borrador) | 2, 3, 5, 18 | Ámbar solo aviso/pendiente; gremio neutro |
| I-8 | Radio de esquina inconsistente (cápsula vs medio) | A vs B | Escala única; botones `radius/md` (~12px) |
| I-9 | Dos fuentes de texto mezcladas | 1,9,11 vs resto | Inter para UI; Space Grotesk solo cifras |
| I-10 | Tab bar con iconos rellenos vs lineales | varias | Set lineal único; activo por color |
| I-11 | "DESPUÉS/ACTUAL" a veces verde, a veces azul | 4, 8, 18 | Siempre azul (info temporal), no verde |
| I-12 | Barra de progreso naranja sin aviso asociado | 3 | Naranja solo si hay aviso real; azul por defecto |

---

## 8. Checklist de aplicación

Antes de dar una pantalla por "conforme al sistema", verificar:

- [ ] ¿Algún color semántico (verde/ámbar/rojo) se usa para decorar o para un gremio? → corregir.
- [ ] ¿La acción principal es azul y única en la pantalla?
- [ ] ¿El verde aparece solo en dinero, pagos o estados de completado?
- [ ] ¿Los gremios usan el chip neutro?
- [ ] ¿El rojo aparece solo en errores o eliminar?
- [ ] ¿Los radios siguen la escala (botones ~12px, tarjetas ~16px)?
- [ ] ¿Las cifras hero usan Space Grotesk y el resto Inter?
- [ ] ¿La tab bar usa iconos lineales con activo en azul?
- [ ] ¿El contraste de texto cumple AA sobre su fondo?

---

*Fin del documento. Los design tokens (CSS variables + JSON) y la configuración de Tailwind se entregan en archivos aparte.*
