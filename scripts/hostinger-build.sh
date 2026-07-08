#!/bin/bash
set -e

echo "=== Hostinger Build Script ==="

# 1. Setup shared package symlinks first
echo "--- Setting up shared package ---"
mkdir -p node_modules/@lab-app
ln -sf "$(pwd)/packages/shared" node_modules/@lab-app/shared

# 2. Install API dependencies
echo "--- Installing API dependencies ---"
cd apps/api
# Remove workspace dependency before npm install, then restore
cp package.json package.json.bak
node -e "
const pkg = require('./package.json');
delete pkg.dependencies['@lab-app/shared'];
require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"
npm install --legacy-peer-deps
mv package.json.bak package.json
# Symlink shared into api
mkdir -p node_modules/@lab-app
ln -sf "$(pwd)/../../../packages/shared" node_modules/@lab-app/shared
cd ../..

# 3. Install Web dependencies
echo "--- Installing Web dependencies ---"
cd apps/web
cp package.json package.json.bak
node -e "
const pkg = require('./package.json');
delete pkg.dependencies['@lab-app/shared'];
require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"
npm install --legacy-peer-deps
mv package.json.bak package.json
# Symlink shared into web
mkdir -p node_modules/@lab-app
ln -sf "$(pwd)/../../../packages/shared" node_modules/@lab-app/shared
cd ../..

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
