#!/usr/bin/env bash
# EAS Build pre-install hook
# Runs BEFORE the main install step, from the app directory (apps/mobile/)
set -euo pipefail

MONOREPO_ROOT="$(cd ../.. && pwd)"

echo ">>> EAS pre-install: installing from monorepo root ($MONOREPO_ROOT)"
cd "$MONOREPO_ROOT"
pnpm install --no-frozen-lockfile
echo ">>> pnpm install complete"

# Ensure node_modules exists in apps/mobile for Gradle's require.resolve calls
cd "$MONOREPO_ROOT/apps/mobile"
if [ ! -d "node_modules" ]; then
  echo ">>> Symlinking node_modules from monorepo root"
  ln -s "$MONOREPO_ROOT/node_modules" node_modules
fi

echo ">>> Pre-install done"
