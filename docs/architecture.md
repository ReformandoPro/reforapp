# Arquitectura inicial de Reformando.app

## Principio rector

Reformando Core vive en Supabase/PostgreSQL.
Odoo 18 se integrará más adelante como ERP externo desacoplado.

## Capas iniciales

- `src/app/*`: rutas App Router y composición básica de la aplicación.
- `src/lib/engine/*`: motor presupuestario y cálculo puro, sin IO.
- `src/lib/domain/*`: reglas de negocio, estados, transiciones y contratos de dominio.
- `src/lib/services/*`: orquestación de casos de uso y coordinación entre dominio e infraestructura.
- `src/lib/supabase/*`: clientes y utilidades de acceso a Supabase.
- `src/lib/odoo/*`: futura capa de integración con Odoo 18.
- `src/lib/types/*`: tipos compartidos y DTOs.
- `src/components/ui/*`: componentes básicos reutilizables de UI.
- `src/components/screens/*`: pantallas compuestas, territorio principal de Hermes.

## Reglas de diseño

- El motor presupuestario debe ser puro y testeable.
- El frontend no debe depender de tablas crudas de Supabase ni de modelos internos de Odoo.
- La integración con Odoo debe vivir desacoplada del core.
- La clave `SUPABASE_SERVICE_ROLE_KEY` solo puede usarse en servidor.
