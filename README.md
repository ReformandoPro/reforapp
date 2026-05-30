# Reformando.app

Base inicial de Reformando.app construida con Next.js App Router, React, TypeScript estricto y Tailwind CSS.

## Decisión de arquitectura

Reformando Core vive en Supabase/PostgreSQL.
Odoo 18 se integrará después como ERP externo desacoplado.
Eso evita acoplar el producto al ERP desde el arranque y protege el núcleo diferencial: presupuesto, obra, tareas, incidencias, aprobaciones y rentabilidad.

## Stack inicial

- Next.js (App Router)
- React
- TypeScript estricto
- Tailwind CSS
- Supabase (`@supabase/supabase-js`)

## Estructura principal

```text
src/
  app/                # rutas y layout base
  lib/
    engine/           # lógica pura del motor presupuestario
    domain/           # entidades, estados y reglas de negocio
    services/         # casos de uso y orquestación
    supabase/         # clientes y acceso a Supabase
    odoo/             # futura integración desacoplada con Odoo
    types/            # tipos compartidos y DTOs
  components/
    ui/               # piezas básicas reutilizables
    screens/          # pantallas compuestas (territorio de Hermes)
docs/
agents/
  openclaw/
  hermes/
```

## Variables de entorno

Copia `.env.example` a `.env.local` y rellena los valores reales:

```bash
cp .env.example .env.local
```

Variables previstas:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ODOO_URL`
- `ODOO_DB`
- `ODOO_USERNAME`
- `ODOO_PASSWORD`

## Supabase

Se han dejado preparados:

- `src/lib/supabase/browser.ts`
- `src/lib/supabase/server.ts`

Criterio:
- navegador → usa `NEXT_PUBLIC_SUPABASE_*`
- servidor → puede usar cliente server-safe y cliente admin con `SUPABASE_SERVICE_ROLE_KEY`
- nunca exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente

## Desarrollo

```bash
npm install
npm run dev
```

## Siguientes pasos recomendados

1. Añadir `.env.local` con las claves reales de Supabase.
2. Definir contratos TypeScript iniciales del core.
3. Diseñar el modelo de datos base en Supabase.
4. Empezar el motor presupuestario en `src/lib/engine` con tests.
5. Mantener `src/lib/odoo` solo como preparación hasta validar la integración.
