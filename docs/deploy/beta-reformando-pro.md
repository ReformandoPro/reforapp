# Beta deployment — beta.reformando.pro

## Objetivo

Preparar el despliegue de la beta privada de Reformando.app en:

- `https://beta.reformando.pro`

## Supuestos confirmados

- El dominio `beta.reformando.pro` ya resuelve al VPS.
- Traefik ya existe en el host real y se ejecuta en Docker.
- EntryPoint HTTPS real: `websecure`
- Cert resolver real: `letsencrypt`
- Docker provider con `exposedByDefault=false`
- El despliegue de Docker Compose se ejecutará desde el host real, no desde OpenClaw.

## Imagen / app

La app Next.js se construye con `Dockerfile` del repo y expone el puerto `3000`.

Comando de arranque dentro del contenedor:

```bash
npm run start -- --hostname 0.0.0.0 --port 3000
```

## Labels de Traefik necesarias

```yaml
labels:
  - traefik.enable=true
  - traefik.http.routers.reformando-beta.rule=Host(`beta.reformando.pro`)
  - traefik.http.routers.reformando-beta.entrypoints=websecure
  - traefik.http.routers.reformando-beta.tls=true
  - traefik.http.routers.reformando-beta.tls.certresolver=letsencrypt
  - traefik.http.services.reformando-beta.loadbalancer.server.port=3000
```

## Red Docker

Traefik está en host network, así que por ahora **no** se fija `traefik.docker.network` en esta fase documental.

## Siguiente paso previsto

En el host real se creará un `compose` específico para la beta que:

1. construya la imagen desde `/data/apps/reformando-app`;
2. levante el servicio Next.js en puerto interno `3000`;
3. añada las labels de Traefik anteriores;
4. deje el acceso público en `https://beta.reformando.pro`.
