# Deploy manual de app-beta con GitHub Actions

Este documento describe el deploy manual de la app privada SaaS de Reformando en staging.

## Estado validado (2026-07-05)

El flujo de deploy manual (`workflow_dispatch`) quedó validado end-to-end:

- Secrets creados en GitHub: `APP_BETA_SSH_HOST`, `APP_BETA_SSH_USER`, `APP_BETA_SSH_PORT`, `APP_BETA_SSH_PRIVATE_KEY`, `APP_BETA_SSH_KNOWN_HOSTS`.
- Conexión SSH desde GitHub Actions hacia el VPS funcionando correctamente (paso "Configure SSH").
- Corregido el uso del remote Git dentro del VPS: se fuerza HTTPS antes de `git fetch` (PR #100) para evitar depender de una clave SSH interna del VPS que no existía (`/data/.ssh/reformando_github_ed25519`).
- Ejecución manual completada con éxito sobre `reformando-app-beta` (run #2, commit `7d9b43a`): `git pull --ff-only` vía HTTPS, `docker compose build reformando-app-beta` y `docker compose up -d --no-deps reformando-app-beta` correctos, `docker compose ps` mostrando el servicio `Up`.
- `reformando-beta` no fue tocado en ningún momento del proceso (sin referencias en el log del run).
- `app-beta.reformando.pro/app` carga correctamente tras el deploy, sin error 500.

## Objetivo

Desplegar main en app-beta.reformando.pro sin que Jorge tenga que entrar al terminal del VPS.

Este flujo solo despliega la app privada:

- repo Git en VPS: /docker/openclaw-ejvk/data/apps/reformando-app
- compose: /docker/reformando-app-beta
- servicio/contenedor: reformando-app-beta
- dominio: app-beta.reformando.pro

No debe usarse para la landing pública.

## No tocar

Este workflow no debe tocar:

- reformando-beta
- beta.reformando.pro
- Supabase
- Traefik
- configuración Docker
- datos
- migrations
- seed
- RLS
- volúmenes Docker

## Secrets requeridos

Configurar en GitHub:

ReformandoPro/reforapp → Settings → Secrets and variables → Actions.

Secrets esperados:

- APP_BETA_SSH_HOST
- APP_BETA_SSH_USER
- APP_BETA_SSH_PORT
- APP_BETA_SSH_PRIVATE_KEY
- APP_BETA_SSH_KNOWN_HOSTS

Recomendaciones:

- Usar una clave SSH dedicada solo a deploy.
- No reutilizar claves personales.
- Guardar en APP_BETA_SSH_KNOWN_HOSTS la huella del VPS, por ejemplo obtenida con `ssh-keyscan -p <PORT> <HOST>`.

## Cómo ejecutar el deploy

1. Ir a GitHub Actions.
2. Seleccionar workflow Deploy app-beta.
3. Pulsar Run workflow.
4. Ejecutarlo desde la rama main.

El workflow entra por SSH al VPS y ejecuta únicamente:

```
REPO="/docker/openclaw-ejvk/data/apps/reformando-app"
COMPOSE="/docker/reformando-app-beta"
SERVICE="reformando-app-beta"

cd "$REPO"
git status --short
git config --unset-all core.sshCommand || true
git remote set-url origin https://github.com/ReformandoPro/reforapp.git
git remote -v
git fetch origin main
git checkout main
git pull --ff-only origin main
git rev-parse HEAD
git --no-pager log --oneline -5

cd "$COMPOSE"
docker compose config --services | grep -qx "$SERVICE"
docker compose build "$SERVICE"
docker compose up -d --no-deps "$SERVICE"
docker compose ps "$SERVICE"
docker compose logs --tail=120 "$SERVICE"
```

## Protecciones incluidas

El workflow valida explícitamente:

- REPO=/docker/openclaw-ejvk/data/apps/reformando-app
- COMPOSE=/docker/reformando-app-beta
- SERVICE=reformando-app-beta
- que el servicio exista en docker compose config --services

Además, el workflow no usa:

- docker compose down
- docker compose up -d --remove-orphans
- docker system prune
- docker volume rm
- docker rm
- docker stop reformando-beta

## Riesgos

Riesgos identificados del flujo actual (manual) y de una futura automatización:

- El trigger manual depende de que una persona con acceso a GitHub Actions ejecute el workflow; no hay despliegue si nadie lo lanza.
- Los Secrets de SSH quedan accesibles a cualquier colaborador del repositorio con permisos de Actions, según el aviso de GitHub en la página de Secrets.
- Un `docker compose build` fallido podría dejar el contenedor anterior corriendo (no hay caída de servicio), pero el runner de GitHub Actions marcaría el job como fallido y habría que revisar el log.
- Si en el futuro se activa el disparo automático tras merge a main, cualquier PR mergeado desplegaría inmediatamente a staging sin paso de aprobación manual, salvo que se añadan protecciones adicionales.
- No existe todavía un mecanismo de despliegue de una versión anterior (rollback) distinto al descrito más abajo.

## Rollback

Para rollback seguro, desplegar un commit anterior debería implementarse en un workflow separado con input `ref`, reutilizando las mismas protecciones de ruta/servicio que ya tiene `deploy-app-beta.yml`.

Hasta que exista ese workflow, el rollback debe hacerse con cuidado y siempre sobre el servicio correcto `reformando-app-beta`, por ejemplo haciendo `git checkout <commit_anterior>` dentro de `/docker/openclaw-ejvk/data/apps/reformando-app` y repitiendo `docker compose build` + `docker compose up -d --no-deps reformando-app-beta` sobre `/docker/reformando-app-beta`.

No usar `git reset --hard` en automatismos sin autorización explícita.

## Propuesta futura: activar deploy automático tras merge a main

Este primer paso es manual (`workflow_dispatch`). Esta sección deja documentada la propuesta para un segundo PR que active el deploy automático, sin implementarla todavía:

- Cambiar (o añadir) el trigger del workflow de `workflow_dispatch` a `on: push: branches: [main]`, manteniendo también `workflow_dispatch` como opción manual de respaldo.
- Mantener intactas todas las validaciones de ruta/servicio (`REPO`, `COMPOSE`, `SERVICE`) ya existentes.
- Evaluar añadir un `environment` de GitHub con regla de protección (por ejemplo, revisión requerida) antes de permitir el deploy automático a app-beta, para no perder el control humano por completo.
- Documentar y comunicar el cambio antes de activarlo, ya que a partir de ese momento cualquier merge a main desplegará automáticamente a staging.
- Activar el trigger automático solo después de varias ejecuciones manuales exitosas adicionales.

## Nota explícita: no tocar reformando-beta

`reformando-beta` es un despliegue completamente distinto (landing pública en beta.reformando.pro) con su propio compose y contenedor. Ni el workflow manual actual ni la futura versión automática deben interactuar con `reformando-beta`, su compose, o su contenedor bajo ningún concepto.
