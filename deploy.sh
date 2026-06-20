#!/bin/bash
# Hostinger deployment script

# Install pnpm if not available
if ! command -v pnpm &> /dev/null; then
  npm install -g pnpm@11.8.0
fi

# Install dependencies
pnpm install --frozen-lockfile

# Generate Prisma client
cd apps/api && npx prisma generate --schema prisma/schema.prisma && cd ../..

# Build API
pnpm --filter @lab-app/api build

# Build Web
pnpm --filter @lab-app/web build

echo "Build complete!"
