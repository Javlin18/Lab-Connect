# Labconnect

Lab stack:
- NestJS API
- Next.js admin web
- Expo Android app
- PostgreSQL

Android only. No iOS setup here.

## Stack

- `apps/api` = NestJS API
- `apps/web` = Next.js admin panel
- `apps/mobile` = Expo Android app
- `packages/shared` = shared TS types

## Requirements

- Node.js 20
- pnpm 9
- PostgreSQL 15

## Clone And Install

```bash
git clone <your-repo-url> lab-app
cd lab-app
corepack enable
corepack prepare pnpm@9.12.3 --activate
pnpm install
```

## Environment Variables

Create root `.env`.

Base values:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lab_app?schema=public
JWT_SECRET=change_me
NEXTAUTH_SECRET=change_me
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000/api
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000/api
FIREBASE_PROJECT_ID=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
GOOGLE_MAPS_API_KEY=
S3_BUCKET=
S3_REGION=
S3_ACCESS_KEY=
S3_SECRET_KEY=
```

Notes:
- `NEXT_PUBLIC_API_URL` is for web.
- `EXPO_PUBLIC_API_URL` is for Android emulator/device.
- In production set web/mobile API URL to `https://api.yourdomain.com/api`.

## Local Database

Create DB and run Prisma:

```bash
pnpm prisma generate --schema apps/api/prisma/schema.prisma
pnpm prisma migrate dev --schema apps/api/prisma/schema.prisma
```

## Start Development Servers

From the repo root, start all development servers:

```bash
cd /path/to/lab-app
pnpm dev
```

This runs the API, admin web app, and Expo mobile server through Turbo.

Start one app at a time:

```bash
cd /path/to/lab-app
pnpm --filter @lab-app/api dev
pnpm --filter @lab-app/web dev
pnpm --filter @lab-app/mobile dev
```

Local ports:
- Web: `http://localhost:3000`
- API: `http://localhost:4000/api`
- API docs: `http://localhost:4000/api/docs`
- Expo: terminal output shows the Android emulator/device options

Typical local startup flow:

```bash
cd /path/to/lab-app
corepack enable
corepack prepare pnpm@9.12.3 --activate
pnpm install
pnpm prisma:generate
pnpm db:migrate
pnpm dev
```

For app-specific startup notes, see:
- `apps/api/README.md`
- `apps/web/README.md`
- `apps/mobile/README.md`

## Production Build

```bash
pnpm build
```

This builds API and web.

## Hostinger VPS Deploy

Target:
- Ubuntu 22.04
- Nginx
- PM2
- PostgreSQL 15

### 1. First-time server setup

On VPS:

```bash
git clone <your-repo-url> /var/www/lab-app
cd /var/www/lab-app
bash scripts/setup-vps.sh
```

### 2. Configure env on VPS

Create `/var/www/lab-app/.env`.

Production important values:

```env
DATABASE_URL=postgresql://lab_app_user:change_me_now@localhost:5432/lab_app?schema=public
JWT_SECRET=strong_secret
NEXTAUTH_SECRET=strong_secret
NEXTAUTH_URL=https://admin.yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api
```

### 3. Nginx setup

```bash
sudo cp nginx/lab-app.conf /etc/nginx/sites-available/lab-app.conf
sudo ln -sf /etc/nginx/sites-available/lab-app.conf /etc/nginx/sites-enabled/lab-app.conf
sudo nginx -t
sudo systemctl reload nginx
```

### 4. SSL

```bash
sudo certbot --nginx -d admin.yourdomain.com -d api.yourdomain.com
```

### 5. Build and start app

```bash
pnpm install
pnpm build
pnpm prisma migrate deploy --schema apps/api/prisma/schema.prisma
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 6. Deploy updates

```bash
bash scripts/deploy.sh
```

That script does:
- pull latest code
- `pnpm install`
- `pnpm build`
- `pnpm prisma migrate deploy --schema apps/api/prisma/schema.prisma`
- `pm2 reload ecosystem.config.js`

## PM2 Processes

- `api` -> `apps/api/dist/main.js` on port `4000`
- `web` -> `next start` in `apps/web` on port `3000`

## Android Builds

Login once:

```bash
cd apps/mobile
eas login
```

Build Android APK for testing:

```bash
eas build --profile preview --platform android
```

Build Android App Bundle for Play Store:

```bash
eas build --profile production --platform android
```

Submit to Play Store:

```bash
eas submit --platform android
```

One-time Play Store setup:
- Create account at `play.google.com/console`
- Google Play Console fee is `$25`

## GitHub Auto Deploy

Workflow file:
- `.github/workflows/deploy.yml`

Add these GitHub secrets:
- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_PORT`
- `VPS_APP_DIR`

Push to `main`, workflow SSHes into VPS and runs `scripts/deploy.sh`.
# Lab-Connect
