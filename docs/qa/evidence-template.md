# Plantilla de evidencia de cierre

Completar una fila por acción o escenario. No incluir secretos, cookies, JWT, contraseñas ni cabeceras Authorization.

| Campo | Valor |
|---|---|
| ID de evidencia | |
| Acción | |
| Entorno | local / staging / beta |
| Timestamp UTC | |
| SHA | |
| Usuario/rol anonimizado | |
| Organización anonimizada | |
| Comando o pasos | |
| Salida relevante | |
| Captura/enlace | |
| Responsable | |
| Resultado | PASS / FAIL / BLOCKED / N/A |
| Severidad | P0 / P1 / P2 / P3 |
| Observaciones | |

## Reglas de conservación

- La salida debe ser literal y sanitizada.
- Las capturas deben mostrar URL, estado y contexto sin datos personales innecesarios.
- Los logs deben conservar timestamp, request/trace ID si existe, status, duración y error original.
- Los artefactos de backup deben registrar nombre, hash, ubicación y expiración.
- Un FAIL P0/P1 bloquea el cierre; P2/P3 requieren decisión documentada.
