#!/bin/sh
set -e

# Sync Prisma schema to database (creates tables when using local Postgres)
# Works without migration files - required when prisma/migrations is in .dockerignore
if [ -n "$DATABASE_URL" ]; then
  echo "Running prisma db push..."
  npx prisma db push --accept-data-loss 2>/dev/null || true
  echo "Running prisma db seed..."
  npx prisma db seed 2>/dev/null || true
fi

exec node dist/index.js
