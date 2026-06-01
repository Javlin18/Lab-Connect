# Labconnect Web

Next.js admin web app for Labconnect.

## Start Development Server

Run from the repo root:

```bash
cd /path/to/lab-app
pnpm --filter @lab-app/web dev
```

Open:

```text
http://localhost:3000
```

## Prerequisites

Start the API server before signing in or loading app data:

```bash
cd /path/to/lab-app
pnpm --filter @lab-app/api dev
```

Create the root `.env` file before starting the web app. Local web values include:

```env
NEXTAUTH_SECRET=change_me
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Useful Commands

```bash
pnpm --filter @lab-app/web build
pnpm --filter @lab-app/web start
pnpm --filter @lab-app/web lint
```
