# Componentes — Sistema de Diseño · Next.js (App Router)

Versión de la librería adaptada a **Next.js 13+ con App Router**, JavaScript (`.jsx`), Tailwind y `next/font`.

## Qué trae esta versión (vs. la genérica)

- **`"use client"`** ya añadido a los componentes interactivos (`Button`, `Input`, `Checkbox`, `SegmentedControl`, `TabBar`, `ListItem`, `MetricCard`). Los visuales puros (`Avatar`, `Badge`, `Card`, `Donut`, `GuildChip`, `ProgressBar`, `Timeline`) son **Server Components**.
- **`src/fonts.js`** con `next/font/google` para Inter y Space Grotesk (auto-hospedadas, sin parpadeo).
- **`tailwind.config.js`** que consume las CSS variables de `next/font` (`var(--font-inter)`, `var(--font-space-grotesk)`).
- **`app/layout.jsx`**, **`app/globals.css`** y una **pantalla de ejemplo** (`app/ejemplo-lista/`) que muestra el patrón Server + isla cliente.
- **`jsconfig.json`** con alias `@/ui`.

## Estructura

```
.
├── app/
│   ├── layout.jsx              # fuentes + tema oscuro + fondo
│   ├── globals.css             # directivas Tailwind
│   └── ejemplo-lista/
│       ├── page.jsx            # Server Component (datos)
│       └── ShoppingList.jsx    # "use client" (interactividad)
├── src/
│   ├── index.js                # barrel: import { Button } from "@/ui"
│   ├── cn.js
│   ├── fonts.js                # next/font
│   └── components/             # los 14 componentes
├── tailwind.config.js
└── jsconfig.json
```

## Puesta en marcha en tu proyecto Next

1. **Copia los archivos** a tu proyecto:
   - `src/` → tu carpeta de UI (el alias `@/ui` apunta aquí).
   - `tailwind.config.js` → raíz (o fusiona con el tuyo).
   - Toma `app/layout.jsx`, `globals.css` y `jsconfig.json` como referencia (o fusiónalos con los tuyos).

2. **Tailwind**: asegúrate de tenerlo instalado y de que `content` incluye `app/`, `components/` y `src/` (ya viene así en el config).

3. **Fuentes**: no hay que instalar nada; `next/font` viene con Next. Solo importa `fontVariables` en tu `layout.jsx` (ver ejemplo).

4. **Tema oscuro**: el sistema es dark. La clase `dark` va en el `<html>` del layout. Si quieres soportar claro/oscuro conmutable, ese es el punto donde alternar.

5. **Alias `@/ui`**: definido en `jsconfig.json`. Si usas TypeScript, replica los `paths` en `tsconfig.json`.

## El patrón Server / Client (importante)

En App Router, **mantén las páginas como Server Components** siempre que puedas (pueden hacer `fetch`, leer DB, etc.) y **aísla la interactividad** en componentes `"use client"` pequeños. La pantalla de ejemplo lo ilustra:

- `app/ejemplo-lista/page.jsx` → **servidor**: define/carga los datos y compone la UI.
- `app/ejemplo-lista/ShoppingList.jsx` → **cliente**: tiene el `useState` de qué ítems están comprados.

Así solo se envía al navegador el JS de la parte que de verdad lo necesita.

> Nota: importar un componente con `"use client"` desde un Server Component es correcto y habitual. Lo que NO conviene es poner `"use client"` en el barrel `index.js`, porque marcaría como cliente todo lo que reexporta. Por eso la directiva va en cada archivo, no en el barrel.

## Reglas del sistema que el código hace cumplir

Igual que en la versión genérica:

1. **Estado ≠ gremio** — `Badge` (estados) y `GuildChip` (gremios) separados; `GuildChip` no acepta color. Imposible volver a pintar "Calefacción" de rojo.
2. **Verde = dinero y validación** — en `Button variant="confirm"`, `Timeline status="done"` y checks de validación; nunca en progreso (`ProgressBar` azul) ni selección (`Checkbox` azul).
3. **Escalas ordenadas** — nota en `SegmentedControl`: opciones de menor a mayor (Aprendiz → Oficial 2ª → Oficial 1ª).

## Probar la pantalla de ejemplo

Coloca la carpeta `app/ejemplo-lista/` en tu `app/`, arranca el dev server y abre `/ejemplo-lista`. Verás la lista de compra funcional (marca ítems y observa cómo cambia el progreso), construida solo con componentes del sistema.
