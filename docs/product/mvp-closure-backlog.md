# Backlog ordenado de cierre del MVP

## Bloqueantes de beta

1. Validar y aplicar los grants operativos pendientes; esperar aprobación de Claude.
2. Confirmar migraciones remotas y smoke Supabase PASS.
3. Desplegar el SHA aprobado en `app-beta` y validar `/api/health`.
4. Reproducir login, organización, clientes, proyectos, fases, tareas, Kanban e incidencias.
5. Verificar owner/admin/member, anónimo y aislamiento multi-tenant.
6. Resolver cualquier 500/503 en los flujos principales.

## Bloqueantes del MVP

1. Completar una obra piloto de principio a fin.
2. Confirmar persistencia tras recarga y nueva sesión.
3. Confirmar feedback de errores y estados vacíos.
4. Cerrar cualquier P0/P1 descubierto en la auditoría funcional.
5. Documentar rollback de aplicación y base de datos.

PR #118 y OBRAMAT no son bloqueantes de beta ni de este cierre, salvo que aparezca un hallazgo nuevo que afecte a seguridad, datos o flujos centrales.

## Post-MVP

1. Catálogo multi-proveedor y aprovisionamiento asistido — OBRAMAT.
2. Integración autorizada con proveedores.
3. Automatizaciones de compras, únicamente con autorización legal y comercial.
4. Mejoras de comparación, equivalencias y optimización logística.
5. Funcionalidades no esenciales identificadas en la auditoría UX.
