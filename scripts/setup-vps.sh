#!/usr/bin/env bash
set -euo pipefail

APP_DB_NAME="${APP_DB_NAME:-lab_app}"
APP_DB_USER="${APP_DB_USER:-lab_app_user}"
APP_DB_PASSWORD="${APP_DB_PASSWORD:-change_me_now}"

sudo apt update
sudo apt install -y curl git build-essential ca-certificates gnupg lsb-release software-properties-common

export NVM_DIR="$HOME/.nvm"
if [ ! -d "$NVM_DIR" ]; then
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi

. "$NVM_DIR/nvm.sh"
nvm install 20
nvm alias default 20
nvm use 20

corepack enable
corepack prepare pnpm@9.12.3 --activate

curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /usr/share/keyrings/postgresql.gpg
echo "deb [signed-by=/usr/share/keyrings/postgresql.gpg] http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list

sudo apt update
sudo apt install -y postgresql-15 nginx certbot python3-certbot-nginx
npm install -g pm2

sudo systemctl enable postgresql
sudo systemctl start postgresql
sudo systemctl enable nginx
sudo systemctl start nginx

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname = '${APP_DB_USER}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER ${APP_DB_USER} WITH PASSWORD '${APP_DB_PASSWORD}';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '${APP_DB_NAME}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE ${APP_DB_NAME} OWNER ${APP_DB_USER};"

cat <<EOF

vps ready

copy nginx file:
  sudo cp nginx/lab-app.conf /etc/nginx/sites-available/lab-app.conf
  sudo ln -sf /etc/nginx/sites-available/lab-app.conf /etc/nginx/sites-enabled/lab-app.conf
  sudo nginx -t
  sudo systemctl reload nginx

ssl command:
  sudo certbot --nginx -d admin.yourdomain.com -d api.yourdomain.com

db url sample:
  postgresql://${APP_DB_USER}:${APP_DB_PASSWORD}@localhost:5432/${APP_DB_NAME}?schema=public

EOF
