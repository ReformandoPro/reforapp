# Reformando.app

Reformando.app es una plataforma SaaS y móvil-first para la gestión integral de reformas.

## Arquitectura

- Next.js / React / TypeScript.
- Tailwind CSS.
- Supabase/PostgreSQL como core operativo.
- Supabase Storage como candidato para fotos, documentos y evidencias.
- Odoo 18 como ERP externo integrado.
- Motor presupuestario propio.
- Separación clara entre core/backend y frontend/UI.

## Principio rector

Reformando Core vive en Supabase/PostgreSQL. Odoo 18 es el ERP externo integrado. Reformando no es una interfaz sobre Odoo: es un core vertical especializado para gestionar reformas, con un motor presupuestario inteligente como diferencial principal.

## Agentes

- Openclaw: arquitectura, backend, Supabase, motor presupuestario, contratos, integración Odoo.
- Hermes: frontend, UI, UX, pantallas, componentes, experiencia móvil-first.

## Desarrollo local

```bash
npm install
npm run dev
```

Servidor local habitual:

```text
http://localhost:3000
```

