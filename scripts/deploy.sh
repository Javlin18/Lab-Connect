#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/lab-app}"
BRANCH="${BRANCH:-main}"

cd "$APP_DIR"

echo "pull code"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo "install deps"
pnpm install

echo "build app"
pnpm build

echo "run prisma migrate deploy"
pnpm prisma migrate deploy --schema apps/api/prisma/schema.prisma

echo "reload pm2"
pm2 reload ecosystem.config.js --update-env
pm2 save
