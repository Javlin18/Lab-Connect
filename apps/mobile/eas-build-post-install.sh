#!/usr/bin/env bash
# EAS Build post-install hook
# Runs AFTER install, from the app directory (apps/mobile/)
set -euo pipefail

MONOREPO_ROOT="$(cd ../.. && pwd)"
APP_DIR="$(pwd)"

echo ">>> EAS post-install: ensuring node_modules visible from android/"

# With pnpm node-linker=hoisted, node_modules is at the monorepo root.
# Gradle runs node from apps/mobile/android/ — node needs to walk up and find node_modules.
# Create a symlink at apps/mobile/node_modules -> monorepo root node_modules if it doesn't exist.
if [ ! -d "$APP_DIR/node_modules" ] && [ -d "$MONOREPO_ROOT/node_modules" ]; then
  echo ">>> Symlinking $APP_DIR/node_modules -> $MONOREPO_ROOT/node_modules"
  ln -s "$MONOREPO_ROOT/node_modules" "$APP_DIR/node_modules"
fi

# Also ensure android/ can resolve — create symlink there too
if [ -d "$APP_DIR/android" ] && [ ! -d "$APP_DIR/android/node_modules" ] && [ -d "$MONOREPO_ROOT/node_modules" ]; then
  echo ">>> Symlinking $APP_DIR/android/node_modules -> $MONOREPO_ROOT/node_modules"
  ln -s "$MONOREPO_ROOT/node_modules" "$APP_DIR/android/node_modules"
fi

echo ">>> Post-install done"
echo ">>> Checking react-native is resolvable from android/:"
cd "$APP_DIR/android" && node --print "require.resolve('react-native/package.json')" || echo "WARNING: react-native not resolvable!"
