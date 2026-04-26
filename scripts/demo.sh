#!/usr/bin/env bash
# Lance Postgres en local (docker compose), applique les migrations Prisma
# et populate la base avec le seed de demonstration.
#
# Usage : npm run demo
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="$ROOT_DIR/server"

cd "$ROOT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "Erreur : docker n'est pas installe." >&2
  exit 1
fi

echo "==> Demarrage du conteneur Postgres..."
docker compose up -d postgres

echo "==> Attente que Postgres soit pret..."
ATTEMPTS=0
until docker compose exec -T postgres pg_isready -U bookswap -d bookswap >/dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -gt 30 ]; then
    echo "Erreur : Postgres n'est pas pret apres 30 secondes." >&2
    exit 1
  fi
  sleep 1
done

cd "$SERVER_DIR"

if [ ! -d node_modules ]; then
  echo "==> Installation des dependances server..."
  npm install
fi

echo "==> Application des migrations Prisma..."
npx prisma migrate deploy

echo "==> Generation du client Prisma..."
npx prisma generate

echo "==> Seed de la base de donnees..."
npm run prisma:seed

echo ""
echo "Demo prete. Identifiants :"
echo "  - admin@bookswap.sn / Password123! (admin)"
echo "  - user1@bookswap.sn / Password123! (utilisateur)"
echo "  - librairie@bookswap.sn / Password123! (fournisseur)"
echo ""
echo "Lancer l'API : cd server && npm run dev"
echo "Lancer le mobile : cd mobile && npm start"
