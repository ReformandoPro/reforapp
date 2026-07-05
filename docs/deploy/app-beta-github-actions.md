# Deploy manual de app-beta con GitHub Actions

Este documento describe el deploy manual de la app privada SaaS de Reformando en staging.

## Objetivo

Desplegar `main` en `app-beta.reformando.pro` sin que Jorge tenga que entrar al terminal del VPS.

Este flujo **solo** despliega la app privada:

- repo Git en VPS: `/docker/openclaw-ejvk/data/apps/reformando-app`
- compose: `/docker/reformando-app-beta`
- servicio/contenedor: `reformando-app-beta`
- dominio: `app-beta.reformando.pro`

No debe usarse para la landing pública.

## No tocar

Este workflow no debe tocar:

- `reformando-beta`
- `beta.reformando.pro`
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

`ReformandoPro/reforapp` → Settings → Secrets and variables → Actions.

Secrets esperados:

```text
APP_BETA_SSH_HOST
APP_BETA_SSH_USER
APP_BETA_SSH_PORT
APP_BETA_SSH_PRIVATE_KEY
APP_BETA_SSH_KNOWN_HOSTS
```

Recomendaciones:

- Usar una clave SSH dedicada solo a deploy.
- No reutilizar claves personales.
- Guardar en `APP_BETA_SSH_KNOWN_HOSTS` la huella del VPS, por ejemplo obtenida con:

```bash
ssh-keyscan -p <PORT> <HOST>
```

## Cómo ejecutar el deploy

1. Ir a GitHub Actions.
2. Seleccionar workflow `Deploy app-beta`.
3. Pulsar `Run workflow`.
4. Ejecutarlo desde la rama `main`.

El workflow entra por SSH al VPS y ejecuta únicamente:

```bash
REPO="/docker/openclaw-ejvk/data/apps/reformando-app"
COMPOSE="/docker/reformando-app-beta"
SERVICE="reformando-app-beta"

cd "$REPO"
git status --short
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

- `REPO=/docker/openclaw-ejvk/data/apps/reformando-app`
- `COMPOSE=/docker/reformando-app-beta`
- `SERVICE=reformando-app-beta`
- que el servicio exista en `docker compose config --services`

Además, el workflow **no usa**:

```bash
docker compose down
docker compose up -d --remove-orphans
docker system prune
docker volume rm
docker rm
docker stop reformando-beta
```

## Rollback básico

Para rollback seguro, desplegar un commit anterior debería implementarse en un workflow separado con input `ref`.

Hasta que exista ese workflow, el rollback debe hacerse con cuidado y siempre sobre el servicio correcto `reformando-app-beta`.

No usar `git reset --hard` en automatismos sin autorización explícita.

## Evolución futura

Este primer paso es manual (`workflow_dispatch`).

Cuando se valide varias veces, se podrá plantear un segundo PR para desplegar automáticamente tras merge a `main`.
