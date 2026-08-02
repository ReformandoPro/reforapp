# Runbook de obra piloto

## Objetivo

Demostrar el flujo completo de valor con una única obra piloto, sin intervención manual en la base de datos.

## Preparación

- Registrar organización, usuarios owner/admin/member y obra piloto de forma anonimizada.
- Preparar el formulario de evidencia.
- Activar observabilidad según `docs/qa/beta-observability.md`.
- Confirmar que el SHA y health check están validados.

## Ejecución

1. Crear un cliente.
2. Crear una obra vinculada al cliente.
3. Crear y editar una fase.
4. Crear al menos 5 tareas con fase, prioridad y fecha.
5. Completar las 5 tareas y verificar Kanban, detalle y persistencia.
6. Registrar al menos 2 incidencias vinculadas a tareas.
7. Resolver y cerrar las 2 incidencias.
8. Repetir lecturas y cambios con owner/admin/member según la política actual.
9. Revisar logs durante toda la ejecución: 401/403, RLS, 500/503 y PostgreSQL.
10. Confirmar cero intervenciones manuales en BD.

## Métricas

- cliente creado: PASS/FAIL;
- obra creada desde cliente: PASS/FAIL;
- tareas creadas: mínimo 5;
- tareas completadas: mínimo 5;
- incidencias registradas: mínimo 2;
- incidencias cerradas: mínimo 2;
- tiempo hasta primer valor de cliente a estado operativo: <60 min;
- pantallas núcleo: <3 s;
- pérdida de datos: cero;
- P0/P1 abiertos: cero;
- intervención manual en BD: cero.

## GO / NO-GO

**GO** solo si todas las métricas pasan, el aislamiento multi-tenant es correcto, no hay P0/P1 y la evidencia está completa.

**NO-GO** ante pérdida de datos, fuga entre organizaciones, flujo central bloqueado, error 500/503 no explicado, permisos incorrectos, migración inconsistente o cualquier intervención manual en BD.
