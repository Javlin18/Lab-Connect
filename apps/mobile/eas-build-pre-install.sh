#!/usr/bin/env bash
# EAS Build pre-install hook
# Runs BEFORE the main install step, from the app directory (apps/mobile/)
set -euo pipefail

echo ">>> EAS pre-install: switching to monorepo root to run pnpm install"
cd ../..
echo ">>> Running: pnpm install --no-frozen-lockfile from $(pwd)"
pnpm install --no-frozen-lockfile
echo ">>> pnpm install complete"
