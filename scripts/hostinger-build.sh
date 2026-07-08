#!/bin/bash
set -e

echo "=== Hostinger Build Script ==="

# 1. Install API dependencies (skip workspace refs)
echo "--- Installing API dependencies ---"
cd apps/api
# Temporarily replace workspace:* with * so npm can handle it
sed -i.bak 's/"workspace:\*"/"*"/g' package.json
npm install --legacy-peer-deps 2>/dev/null || npm install
mv package.json.bak package.json
cd ../..

# 2. Install Web dependencies
echo "--- Installing Web dependencies ---"
cd apps/web
sed -i.bak 's/"workspace:\*"/"*"/g' package.json
npm install --legacy-peer-deps 2>/dev/null || npm install
mv package.json.bak package.json
cd ../..

# 3. Build shared package (just needs to be accessible)
echo "--- Setting up shared package ---"
# Link shared package for both api and web
mkdir -p apps/api/node_modules/@lab-app
mkdir -p apps/web/node_modules/@lab-app
ln -sf "$(pwd)/packages/shared" apps/api/node_modules/@lab-app/shared
ln -sf "$(pwd)/packages/shared" apps/web/node_modules/@lab-app/shared

# 4. Generate Prisma client
echo "--- Generating Prisma client ---"
cd apps/api
./node_modules/.bin/prisma generate --schema prisma/schema.prisma
cd ../..

# 5. Compile API TypeScript
echo "--- Compiling API ---"
cd apps/api
./node_modules/.bin/tsc -p tsconfig.json
cd ../..

# 6. Build Next.js web app
echo "--- Building Web ---"
cd apps/web
npx next build
cd ../..

# 7. Copy static assets for standalone output
echo "--- Copying static assets ---"
cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static
cp -r apps/web/public apps/web/.next/standalone/apps/web/public

echo "=== Build Complete ==="
