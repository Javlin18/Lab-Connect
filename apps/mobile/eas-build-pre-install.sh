#!/usr/bin/env bash
# EAS Build pre-install hook
# Runs BEFORE the main install step, from the app directory (apps/mobile/)
set -euo pipefail

MONOREPO_ROOT="$(cd ../.. && pwd)"

echo ">>> EAS pre-install: installing from monorepo root ($MONOREPO_ROOT)"
cd "$MONOREPO_ROOT"
pnpm install --no-frozen-lockfile
echo ">>> pnpm install complete"
