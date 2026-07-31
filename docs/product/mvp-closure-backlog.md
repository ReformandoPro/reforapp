# Backlog ordenado de cierre del MVP

## Bloqueantes de beta

1. Validar y aplicar los grants operativos pendientes; esperar aprobación de Claude.
2. Confirmar migraciones remotas y smoke Supabase PASS.
3. Desplegar el SHA aprobado en `app-beta` y validar `/api/health`.
4. Reproducir login, organización, clientes, proyectos, fases, tareas, Kanban e incidencias.
5. Verificar owner/admin/member, anónimo y aislamiento multi-tenant.
6. Resolver cualquier 500/503 en los flujos principales.

## Bloqueantes del MVP

1. Completar una obra piloto de principio a fin: cliente → obra → fase → tarea → incidencia → estado.
2. Confirmar persistencia tras recarga y nueva sesión.
3. Confirmar feedback de errores y estados vacíos.
4. Cerrar cualquier P0/P1 descubierto en la auditoría funcional.
5. Documentar rollback de aplicación y base de datos.

PR #118 y OBRAMAT no son bloqueantes de beta ni de este cierre, salvo que aparezca un hallazgo nuevo que afecte a seguridad, datos o flujos centrales.

## Decisiones de validación y ramas

- `review/pr3-mvp-smoke-diff` queda clasificada como `EXTRAER SELECTIVAMENTE DESPUÉS DE BETA`.
- No se mergeará como unidad, ni se modificará o eliminará por ahora.
- En el futuro solo se extraerá su cobertura funcional útil del smoke, adaptada al `main` vigente.
- Se descartarán su workflow antiguo y todos sus cambios de aplicación, permisos y esquema.
- La validación queda estructurada en tres capas:
  - **Capa A:** grants en CI.
  - **Capa B:** smoke crítico MVP actual en CI.
  - **Capa C:** smoke remoto y auditoría Chrome post-despliegue.
- La rama de grants debe permanecer en `32ddb6bfb504a7ba2f923dce7a403a70b33e2081` mientras Claude revalida; no se abrirá PR hasta `APROBADO PARA PR`.

## Post-MVP

1. Presupuestos como flujo completo de producto.
2. Catálogo multi-proveedor y aprovisionamiento asistido — OBRAMAT.
3. Integración autorizada con proveedores.
4. Automatizaciones de compras, únicamente con autorización legal y comercial.
5. Mejoras de comparación, equivalencias y optimización logística.
6. Funcionalidades no esenciales identificadas en la auditoría UX.

El despliegue automático de beta se activa al mergear cambios en `main`. El orden obligatorio es: backup → migración aplicada → merge → deploy automático → health check con `commit` → smoke.

`reformando-beta` no debe tocarse bajo ninguna circunstancia; el destino válido es únicamente `reformando-app-beta`.
6. Adjuntos Storage end-to-end.
7. Invitaciones y acceso cliente.
8. Registro de horas.
9. Gastos con factura.
10. Runner reutilizable local/remoto.
