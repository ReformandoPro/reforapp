# Deploy automático de app-beta con GitHub Actions

Este documento describe el deploy automático y manual de la app privada SaaS de Reformando en staging.

## Estado validado (2026-07-05)

El flujo de deploy manual (`workflow_dispatch`) quedó validado end-to-end antes de activar el disparo automático a `main`:

- Secrets creados en GitHub: `APP_BETA_SSH_HOST`, `APP_BETA_SSH_USER`, `APP_BETA_SSH_PORT`, `APP_BETA_SSH_PRIVATE_KEY`, `APP_BETA_SSH_KNOWN_HOSTS`.
- Conexión SSH desde GitHub Actions hacia el VPS funcionando correctamente (paso "Configure SSH").
- Corregido el uso del remote Git dentro del VPS: se fuerza HTTPS antes de `git fetch` (PR #100) para evitar depender de una clave SSH interna del VPS que no existía (`/data/.ssh/reformando_github_ed25519`).
- Ejecución manual completada con éxito sobre `reformando-app-beta` (run #2, commit `7d9b43a`): `git pull --ff-only` vía HTTPS, `docker compose build reformando-app-beta` y `docker compose up -d --no-deps reformando-app-beta` correctos, `docker compose ps` mostrando el servicio `Up`.
- `reformando-beta` no fue tocado en ningún momento del proceso (sin referencias en el log del run).
- `app-beta.reformando.pro/app` carga correctamente tras el deploy, sin error 500.

## Objetivo

Desplegar `main` en `app-beta.reformando.pro` sin que Jorge tenga que entrar al terminal del VPS.

El workflow se dispara automáticamente tras cada push/merge a `main`. El disparador manual `workflow_dispatch` queda disponible para redeploys puntuales de `main`.

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

## Cuándo se ejecuta

El workflow se ejecuta automáticamente tras cada push/merge a `main`:

```yaml
on:
  push:
    branches:
      - main
  workflow_dispatch:
```

También puede ejecutarse manualmente para redeployar `main`:

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

Riesgos identificados del flujo automático:

- Cualquier PR mergeado a `main` desplegará automáticamente a staging `app-beta`.
- Un merge roto a `main` intentará desplegarse; si falla el build, el contenedor anterior debería seguir corriendo porque `docker compose up` no se ejecuta hasta que termina `docker compose build`.
- Los Secrets de SSH quedan accesibles a cualquier colaborador del repositorio con permisos de Actions, según el aviso de GitHub en la página de Secrets.
- Si los Secrets SSH cambian o caducan, el deploy fallará en GitHub Actions, no en la app en ejecución.
- El workflow despliega siempre `main`; no debe usarse para probar ramas.
- No existe todavía un mecanismo automático de despliegue de una versión anterior distinto al rollback manual descrito abajo.

## Rollback

Rollback seguro recomendado:

1. Revertir el PR problemático en GitHub o mergear un fix a `main`.
2. Dejar que el workflow despliegue automáticamente el nuevo `main`.

Si hace falta desplegar un commit anterior concreto, debe hacerse con cuidado y siempre sobre el servicio correcto `reformando-app-beta`, por ejemplo haciendo `git checkout <commit_anterior>` dentro de `/docker/openclaw-ejvk/data/apps/reformando-app` y repitiendo `docker compose build` + `docker compose up -d --no-deps reformando-app-beta` sobre `/docker/reformando-app-beta`.

No usar `git reset --hard` en automatismos sin autorización explícita.

Un workflow futuro podría añadir un input manual `ref` para redeploy/rollback controlado, pero este flujo automático mantiene el alcance mínimo: desplegar `main`.

## Nota explícita: no tocar reformando-beta

`reformando-beta` es un despliegue completamente distinto (landing pública en beta.reformando.pro) con su propio compose y contenedor. Ni el workflow manual actual ni la futura versión automática deben interactuar con `reformando-beta`, su compose, o su contenedor bajo ningún concepto.
