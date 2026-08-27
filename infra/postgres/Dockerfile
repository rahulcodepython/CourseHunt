# The stock postgres image doesn't ship pg_cron, but
# apps/migrator/migrations/000054_ops_retention_cron.up.sql needs it (see
# that file for why it's a server-level, not per-migration, requirement).
# The official postgres image already configures the apt.postgresql.org
# source it installed itself from, so the matching postgresql-<major>-cron
# package resolves without adding any extra repo.
FROM postgres:17-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends postgresql-17-cron \
    && rm -rf /var/lib/apt/lists/*
