# B17 — CI, staging y rollback

## Estado

B17 prepara la entrega continua, pero no activa un despliegue nuevo ni ejecuta
migraciones. El workflow existente de `app-beta` sigue siendo el único flujo de
despliegue preparado para staging.

## CI de pull request

`.github/workflows/ci.yml` ejecuta en cada PR:

1. `npm ci`;
2. `npm run test -- --no-cache`;
3. TypeScript sin emitir;
4. `npm run lint`;
5. `npm run build`;
6. `git diff --check`.

El workflow usa Node 22, permisos `contents: read`, timeout de 20 minutos y
cancelación de ejecuciones obsoletas de la misma rama. No expone secretos a
jobs de pull request ni usa `pull_request_target`.

## Staging

El staging existente es `app-beta.reformando.pro`, servido por el servicio
Docker `reformando-app-beta`. El workflow de despliegue actual obtiene `main`,
construye la imagen y reinicia únicamente ese servicio. B17 no ejecuta el
workflow ni modifica el host.

El endpoint de health check es:

```text
/api/health
```

Devuelve `status: ok` y el SHA de `GIT_COMMIT_SHA` cuando el entorno de
ejecución lo proporciona. La prueba unitaria cubre la ausencia de la variable,
pero el workflow de deploy no la acepta: exige que el valor coincida con
`github.sha`.

## Producción

No existe en B17 un despliegue automático a producción. Producción requiere una
decisión y un flujo separado con secretos, dominio y servicio explícitamente
confirmados.

## Rollback

El rollback debe seleccionar un SHA conocido y reconstruir el mismo Dockerfile
con ese código. No debe usar `latest`, `git reset --hard` automatizado ni
reconstruir desde una rama mutable sin verificar el SHA.

El workflow actual reconstruye la imagen en la VPS a partir del SHA verificado;
no publica una imagen inmutable previamente validada ni fija un digest de
registro. Por tanto, la identidad del código queda verificada, pero la
identidad binaria del artefacto entre CI y staging sigue siendo una deuda de
B17. La publicación y promoción de imágenes por digest queda fuera de este
bloque.

Procedimiento operativo pendiente de autorización:

1. identificar el SHA actualmente desplegado y el SHA anterior sano;
2. verificar que el destino es `reformando-app-beta` y no `reformando-beta`;
3. obtener el SHA anterior con `git checkout --detach <sha>` en un worktree o
   copia aislada del despliegue;
4. construir la imagen con el mismo Dockerfile;
5. levantar únicamente `reformando-app-beta`;
6. comprobar `/api/health` y el SHA devuelto; el workflow reintenta durante un
   deadline global de 60 segundos, con peticiones individuales de como máximo
   5 segundos y pausas de hasta 2 segundos, y falla si no obtiene HTTP exitoso,
   JSON válido, `status: ok` y el SHA esperado dentro de ese plazo;
7. documentar resultado y conservar logs.

La ejecución real de este procedimiento no forma parte de B17.

## Secretos y persistencia

Los secretos deben permanecer en GitHub Actions Secrets o en la configuración
del host. No se añaden `.env`, claves SSH, tokens ni URLs con credenciales al
repositorio. B17 no modifica bases de datos, volúmenes ni migraciones.
