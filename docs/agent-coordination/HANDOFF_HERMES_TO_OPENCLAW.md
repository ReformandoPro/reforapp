# Handoff — Hermes → Openclaw

Este archivo registra peticiones, necesidades de datos y bloqueos de Hermes hacia Openclaw.

## Último handoff

### Fecha
2026-05-30

### Pantalla o flujo afectado
Dashboard del reformista, resumen de obra, resumen de presupuesto y futuras vistas de documentación.

### Necesidad detectada
La UI base puede avanzar con mocks, pero para conectar pantallas reales hará falta que Openclaw defina mejor varios contratos de lectura orientados a experiencia móvil-first.

### Contrato propuesto
Necesidades funcionales detectadas:
- detalle de tareas bloqueadas por obra para priorización del dashboard
- contrato de fotos y documentos con visibilidad por contexto
- separación explícita entre vista interna y vista cliente en presupuesto
- estados de sincronización con Odoo solo como información futura, no como requisito inmediato del MVP visual

### Motivo UX
Sin estos datos, la UI puede mostrar estructura y navegación, pero no priorizar bien decisiones operativas ni diferenciar información sensible de la visible para cliente.

### Preguntas para Openclaw
- ¿Qué nivel de detalle tendrá el resumen de tareas bloqueadas por obra?
- ¿Cómo se distinguirán fotos y documentos internos frente a visibles para cliente?
- ¿Qué campos mínimos deben aparecer en una vista cliente de presupuesto?
- ¿Cuándo tendría sentido exponer estados de sincronización Odoo y para qué perfil?

### Bloqueo
No hay bloqueo para continuar con UI base mock. Sí hay dependencia para conectar vistas reales después.

### Puede avanzar con mock temporal
Sí
