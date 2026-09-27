#!/usr/bin/env bun

console.log(`
\x1b[1m\x1b[36mGentik / CourseHunt Workspace CLI\x1b[0m

\x1b[1mAvailable Scripts:\x1b[0m
  \x1b[32mbun run help\x1b[0m          Display this help message
  \x1b[32mbun run deps:up\x1b[0m       Start background infra dependencies (Postgres, Redis, MinIO, Mailpit, Loki)
  \x1b[32mbun run deps:down\x1b[0m     Stop and tear down docker compose dependencies
  \x1b[32mbun run migrate-up\x1b[0m    Apply all pending database migrations
  \x1b[32mbun run migrate-down\x1b[0m  Roll back the last database migration
  \x1b[32mbun run seed\x1b[0m          Reset database and seed demo data
  \x1b[32mbun run flush\x1b[0m         Truncate database tables without seeding
  \x1b[32mbun run dev:web\x1b[0m       Run Next.js web application in development mode
  \x1b[32mbun run dev:server\x1b[0m    Run Go backend server in development mode
  \x1b[32mbun run dev\x1b[0m           Spin up infra dependencies and launch both backend and web in parallel

\x1b[1mWorkspaces:\x1b[0m
  - \x1b[33m@coursehunt/web\x1b[0m    (apps/web - Next.js frontend)
  - \x1b[33m@coursehunt/server\x1b[0m (apps/server - Go Fiber backend)
`);
