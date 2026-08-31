# CourseHunt

An online course platform: Go/Fiber API, Next.js frontend (public site, student area, tutor and admin dashboards), Postgres, Redis, and MinIO.

## Layout

```
apps/
  web/        Next.js app — public site, student/tutor/admin dashboards, better-auth
  server/     Go/Fiber API
  migrator/   Schema migrations (golang-migrate) — commit / up / down
  seeder/     Local dev seed data
infra/
  docker-compose.yml            production-base services (Traefik, web, server, postgres, redis, minio, migrator)
  docker-compose.dev.yml   local-dev-only additions (published DB/cache ports, whodb, mailpit, Traefik dashboard)
  postgres/                     Postgres image build (adds pg_cron)
```

See `ARCHITECTURE_TEMPLATE.md` for the architectural patterns used throughout both stacks.

## Running locally

```bash
cp .env.example .env   # fill in secrets
cd infra
docker compose up -d --build
```

Running from `infra/` auto-merges `docker-compose.dev.yml`. The app is served through Traefik at `http://localhost`.

## Deploying

See `.env.production.example` for the values that must be overridden for a real deploy, then run only the production base (no dev override):

```bash
docker compose -f infra/docker-compose.yml up -d --build
```
