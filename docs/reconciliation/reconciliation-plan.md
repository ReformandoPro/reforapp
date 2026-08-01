# Plan general de reconciliación

Estado: diseño; no implementado.

## Bloqueantes de seguridad RC1

- **R1:** hardening ACL y tablas huérfanas.
- **R2:** hardening de helpers y bootstrap de memberships.

Ambos requieren baseline, pruebas adversarias, rollback exacto y criterios de parada antes de cualquier cambio operativo.

## Bloqueantes funcionales antes del piloto

- **R3-A:** mapping `legacy text → canonical UUID` y `canonical_id`.
- **R3-B:** columnas FK UUID y backfill.
- **R3-C:** dual-read/dual-write en aplicación.
- **R3-D:** `project_phases` con referencias UUID.

## Post-RC1

- **R3-E:** contract, retirada gradual de lecturas legacy y eventual eliminación del ID legacy.

No se elimina `projects.id` text ni se cambian URLs existentes antes de cerrar la ventana de compatibilidad y demostrar rollback o adaptador legacy.

## Fuera del MVP salvo dependencia explícita del piloto

Los módulos económicos ausentes (`budgets`, `budget_items`, `materials`, `notifications`, `tasks` y otros módulos legacy-safe) permanecen post-MVP, salvo que el piloto demuestre una dependencia funcional explícita. Cualquier inclusión debe crear un alcance y una decisión separados.

## Orden de gobierno

1. Revisar y aprobar R1/R2.
2. Ejecutar únicamente cambios con PR pequeño y rollback probado.
3. Completar R3-A/R3-B antes de dual-read/dual-write.
4. Completar R3-C/R3-D antes del piloto.
5. Posponer R3-E hasta post-RC1 con evidencia de cero lecturas legacy.
