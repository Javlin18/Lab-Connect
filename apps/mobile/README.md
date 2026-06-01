# Labconnect Mobile

Expo Android app for Labconnect.

## Start Development Server

Run from the repo root:

```bash
cd /path/to/lab-app
pnpm --filter @lab-app/mobile dev
```

To launch Android directly:

```bash
cd /path/to/lab-app
pnpm --filter @lab-app/mobile dev:android
```

Expo will print options for opening the app in an Android emulator or on a physical Android device.

## Prerequisites

Start the API server first:

```bash
cd /path/to/lab-app
pnpm --filter @lab-app/api dev
```

Create the root `.env` file before starting Expo. For the Android emulator, use:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000/api
```

For a physical Android device, replace `10.0.2.2` with your computer's LAN IP address.

## Useful Commands

```bash
pnpm --filter @lab-app/mobile build
pnpm --filter @lab-app/mobile lint
```

## Expo Package Installs

This repo uses pnpm workspaces. Run Expo install commands through pnpm from the repo root:

```bash
cd /path/to/lab-app
pnpm --filter @lab-app/mobile exec expo install --pnpm
```

To fix Expo package versions, run:

```bash
cd /path/to/lab-app
pnpm --filter @lab-app/mobile exec expo install --fix --pnpm
```

Do not use `npm install` or `npx expo install` here. npm does not understand the `workspace:*` dependency used by this monorepo, so it can fail with `Unsupported URL Type "workspace:"`.
