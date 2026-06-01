# Labconnect API

NestJS API server for Labconnect.

## Start Development Server

Run from the repo root:

```bash
cd /path/to/lab-app
pnpm --filter @lab-app/api dev
```

The API starts on:
- API: `http://localhost:4000/api`
- Swagger docs: `http://localhost:4000/api/docs`

## Prerequisites

Create the root `.env` file before starting the server. At minimum, local development needs:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lab_app?schema=public
JWT_SECRET=change_me
```

Generate Prisma Client and apply local migrations:

```bash
cd /path/to/lab-app
pnpm prisma:generate
pnpm db:migrate
```

## Useful Commands

```bash
pnpm --filter @lab-app/api build
pnpm --filter @lab-app/api lint
pnpm --filter @lab-app/api db:seed
```
