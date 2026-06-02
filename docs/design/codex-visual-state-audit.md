# Codex visual state audit (rescue) — auditoría consolidada

**Fecha:** 2026-06-02

## Contexto y referencias

Codex generó un estado **visualmente alineado** con la referencia “buena”, preservado como:

- Rescue branch: `origin/rescue/codex-visual-state-20260602-192436`
- Commit visual: `3b5c4cc`
- Base estable: `origin/main` = `be449b5`

**Regla de oro (explícita):**
- **No mergeéis** `rescue/codex-visual-state-*` a `main`.
- Ese branch es **oro como referencia visual** y **veneno como merge directo**.

Este documento consolida dos auditorías previas (OpenClaw + Codex) en una única versión final.

---

## 1) Resumen ejecutivo

El estado rescue consigue el look por una mezcla de:

- **Patrones visuales valiosos** (atmósfera radial, profundidad/elevación, jerarquía tipográfica, chips/badges con más presencia, CTA azul, verde reservado a dinero/validación, rojo solo destructivo).
- **Cambios peligrosos** que sustituyen producto real por referencia estática, alteran routing/layout, y añaden dependencias sin aprobación.

Conclusión: **no es una rama integrable**, pero sí una fuente de verdad visual para extraer reglas y reaplicarlas con control en el producto real.

---

## 2) Inventario exacto de cambios (diff `be449b5..3b5c4cc`)

### 2.1 Lista exacta de archivos cambiados

```
A docs/design/visual-direction-audit.md
M package-lock.json
M package.json
M src/app/budgets/[id]/page.tsx
M src/app/budgets/page.tsx
M src/app/globals.css
M src/app/layout.tsx
M src/app/page.tsx
M src/app/projects/[id]/page.tsx
M src/app/projects/[id]/tasks/ProjectTasksClient.tsx
M src/app/projects/[id]/tasks/page.tsx
M src/app/projects/page.tsx
M src/components/layout/AppShell.tsx
M src/components/screens/BudgetSummaryScreen.tsx
A src/components/screens/DesignReferenceScreen.module.css
A src/components/screens/DesignReferenceScreen.tsx
M src/components/screens/ProjectOverviewScreen.tsx
```

### 2.2 Impacto (stat)

- 17 files changed
- ~1611 insertions / 138 deletions
- Mayor payload: `DesignReferenceScreen.module.css` (~834 líneas)

---

## 3) Clasificación y riesgos por archivo (qué NO debe entrar)

### 3.1 Cambios peligrosos (NO deben entrar en producción tal cual)

1) `src/app/page.tsx`
- **Tipo:** routing / sustitución de producto real por mock estático
- **Hecho:** cambia `/` (home) para renderizar `DesignReferenceScreen`, eliminando el dashboard real (`ReformistDashboardScreen` + `getDashboardSummary()`).
- **Riesgo:** rompe el MVP: home deja de ser producto.
- **Decisión:** **NO mergear**.

2) `src/components/layout/AppShell.tsx`
- **Tipo:** cambio estructural + lógica por ruta
- **Hecho:** añade `"use client"`, `usePathname()` y bypass del shell en `/` para que la referencia estática no tenga header/nav.
- **Riesgo:** cambia límites server/client y el comportamiento global del layout.
- **Decisión:** **NO mergear**.

3) `src/app/layout.tsx`
- **Tipo:** cambio estructural (tipografía)
- **Hecho:** elimina `next/font/google` y variables de fuente en `<html>`.
- **Riesgo:** contradice la decisión de foundation (Phase 1). Afecta a toda la app.
- **Decisión:** **NO mergear**.

4) `package.json` / `package-lock.json`
- **Tipo:** dependencia nueva sin aprobación
- **Hecho:** añade `lucide-react`, `@fontsource/inter`, `@fontsource/space-grotesk`.
- **Riesgo:** bundle + lock churn + decisión técnica no discutida (fonts self-hosted vs `next/font`).
- **Decisión:** **NO mergear**.

5) Cualquier cambio en rutas reales (`projects`, `budgets`, `tasks`) sin revisión individual
- **Tipo:** potencial cambio de producto/datos
- **Archivos:** `src/app/projects/*`, `src/app/budgets/*`, `ProjectTasksClient`, `BudgetSummaryScreen`, `ProjectOverviewScreen`.
- **Riesgo:** pueden esconder placeholders, desconexiones de servicios/mocks, o cambios funcionales.
- **Decisión:** **NO mergear** desde rescue; solo considerar porting selectivo tras auditoría por archivo.

---

## 4) Qué SÍ es rescatable (reutilizable)

### 4.1 Rescatable como referencia interna (nunca como home)

- `src/components/screens/DesignReferenceScreen.tsx`
  - **Solo** como referencia interna.
  - Nunca debe sustituir `/` ni entrar en el routing principal.

### 4.2 Rescatable como fuente visual de extracción

- `src/components/screens/DesignReferenceScreen.module.css`
  - Contiene patrones visuales clave que sí explican por qué “la referencia se ve bien”:
    - fondo con **radial glows** (atmósfera)
    - **profundidad** (shadows/contraste) y phone frame
    - jerarquía tipográfica más expresiva
    - chips neutros de gremio
    - CTA azul con sombra (identidad)
    - verde reservado a dinero/validación
    - rojo solo destructivo

### 4.3 Patrones concretos a portar (sin tocar rutas)

- Atmósfera: radiales sutiles + base dark con intención.
- Elevación: superficies (base/surface/raised) + sombras solo cuando toca.
- Tipografía:
  - Space Grotesk en cifras “hero”
  - overlines/kickers con tracking y color de acento (`primary-300`).
- Badges:
  - más contraste (fondos 900 + textos 100)
  - dot opcional
  - labels localizados (no enums crudos).
- CTA:
  - azul con hover + shadow fab.

---

## 5) Determinaciones (preguntas obligatorias)

- **¿Se sustituyó `/` por una galería estática?** Sí (vía `src/app/page.tsx`).
- **¿Rutas reales siguen respondiendo?** En checks HTTP pueden dar 200, pero eso NO prueba que mantengan flujo de datos. Requiere auditoría por archivo.
- **¿Se desconectó data real/mocks?** En `/` sí (se elimina el dashboard real).
- **¿Se añadieron deps solo para la referencia?** Sí (`lucide-react`, `@fontsource/*`).

---

## 6) Plan de integración correcta (sin mergear rescue)

### 6.1 Recomendación de siguiente rama (docs-only / referencia aislada)

Crear desde `main` una rama nueva, por ejemplo:

- `openclaw/ui-reference-style-library`

**Objetivo:** portar SOLO la referencia visual como documentación y/o componentes aislados.

**Prohibido en esa rama:**
- no tocar `/` (home)
- no tocar `AppShell`
- no tocar `layout.tsx`
- no tocar `package.json` / `package-lock.json`
- no tocar rutas productivas

### 6.2 Fases posteriores (aplicación a producto real)

Una vez exista la librería de estilo/ref:

1) Extraer reglas a un “style guide” o tokens de composición (sombras, radios, espaciados, jerarquías).
2) Aplicar esas reglas a componentes reales (`Card`, `Badge`, `Button`, etc.) con PRs pequeños.
3) Migrar pantallas reales una por una (dashboard, projects, budgets, tasks), verificando que:
   - no se rompe routing
   - no se rompe data
   - no se sustituyen servicios por HTML estático.

---

## 7) Confirmación de alcance (docs-only)

Este documento es una auditoría. No implica:
- aprobar dependencias nuevas
- aprobar cambios en rutas
- aprobar sustitución de home
- aprobar cambios de layout

**Advertencia final:**
- **No mergear** `rescue/codex-visual-state-*` a `main`.
