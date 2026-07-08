#!/bin/bash
set -e

echo "=== Hostinger Build Script ==="

# 1. Install pnpm globally
echo "--- Installing pnpm ---"
npm install -g pnpm@11.8.0

# 2. Install all workspace dependencies with pnpm
echo "--- Installing all dependencies ---"
pnpm install --frozen-lockfile || pnpm install

# 3. Generate Prisma client
echo "--- Generating Prisma client ---"
cd apps/api
./node_modules/.bin/prisma generate --schema prisma/schema.prisma || pnpm prisma generate --schema prisma/schema.prisma
cd ../..

# 4. Compile API TypeScript
echo "--- Compiling API ---"
cd apps/api
./node_modules/.bin/tsc -p tsconfig.json || pnpm tsc -p tsconfig.json
cd ../..

# 5. Build Next.js web app
echo "--- Building Web ---"
cd apps/web
npx next build
cd ../..

# 6. Copy static assets for standalone output
echo "--- Copying static assets ---"
cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static
cp -r apps/web/public apps/web/.next/standalone/apps/web/public

echo "=== Build Complete ==="
