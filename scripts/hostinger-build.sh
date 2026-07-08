#!/bin/bash
set -e

echo "=== Hostinger Build Script ==="

# Use npx to run pnpm without global install (avoids permission issues)
# pnpm properly handles the monorepo workspace dependencies
echo "--- Installing dependencies with pnpm ---"
npx -y pnpm@11.8.0 install --no-frozen-lockfile

# Generate Prisma client
echo "--- Generating Prisma client ---"
npx -y prisma@5.22.0 generate --schema apps/api/prisma/schema.prisma

# Compile API TypeScript
echo "--- Compiling API ---"
npx tsc -p apps/api/tsconfig.json

# Build Next.js web app
echo "--- Building Web ---"
cd apps/web
npx next build
cd ../..

# Copy static assets for standalone output
echo "--- Copying static assets ---"
cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static
cp -r apps/web/public apps/web/.next/standalone/apps/web/public

echo "=== Build Complete ==="
