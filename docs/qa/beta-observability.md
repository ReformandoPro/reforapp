# Observabilidad de beta

## Señales obligatorias

Registrar y revisar durante health check, smoke y obra piloto:

- 401/403 inesperados en operaciones autorizadas;
- denegaciones RLS, diferenciando denegación esperada de fallo de grants;
- errores 500/503 y ruta afectada;
- errores PostgreSQL, código y tabla/relación si están disponibles;
- health check HTTP, `status` y SHA devuelto;
- discrepancias entre SHA solicitado, desplegado y esperado.

## Frecuencia

- Antes del despliegue: revisión de configuración y SHA.
- Durante migraciones: observación continua de cada paso y salida literal.
- Durante deploy: health check hasta obtener PASS o alcanzar el deadline del workflow.
- Durante obra piloto: revisión al inicio, tras cada flujo núcleo y al cierre.
- Después: revisión final de logs y evidencias antes de GO.

## Registro mínimo

Cada evento debe incluir timestamp UTC, ruta o comando, status, duración, usuario/organización anonimizados, request/trace ID si existe, mensaje original y enlace al artefacto. Nunca incluir secretos.

## Escalado

- **P0:** escalar inmediatamente, detener despliegue/smoke, preservar evidencia y bloquear cierre.
- **P1:** detener el flujo afectado, abrir incidencia y bloquear cierre hasta corrección o decisión explícita.
- **P2:** registrar workaround, responsable y fecha de resolución.
- **P3:** registrar en backlog post-MVP salvo impacto acumulado.

## Señales de parada

Parar si aparece una fuga multi-tenant, escritura no autorizada, pérdida de datos, discrepancia de SHA, health check fallido, 500/503 recurrente o error PostgreSQL que afecte a un flujo central.
