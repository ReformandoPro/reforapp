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

## Coordinación operativa

Cuando Hermes entrega trabajo a OpenClaw debe incluir, si existe:
- objetivo concreto;
- archivos tocados o previstos;
- diff, patch o código propuesto;
- validaciones ejecutadas, solo si existen de verdad;
- riesgos;
- límites o supuestos.

Reglas:
- toda evidencia debe ser salida literal de comandos reales;
- no inventar hashes, ramas, outputs ni validaciones;
- si Git no se puede verificar, Hermes debe detenerse y no reportar persistencia como hecha.

## Coordination message format
When ChatGPT coordinates between Jorge, Hermes and OpenClaw:
- Lines intended only for Jorge may start with `J:`.
- Copy/paste blocks for agents should not include extra commentary before or after the actionable instruction.
- If a message is intended for multiple agents, it should use explicit sections:
  - `[Hermes]`
  - `[OpenClaw]`
- Agents should answer with concise literal evidence when asked for verification.
- Agents should avoid narrative confirmations when command output was requested.
