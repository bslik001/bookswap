# Image de production de l'API BookSwap.
#
# Pour le dev local, utiliser plutot :
#   - docker compose up -d  (lance Postgres seulement)
#   - npm run dev           (lance l'API avec hot reload)
#
# Ce Dockerfile est destine a un deploiement (Render, Fly.io, Railway, etc.)
# sur un reseau stable. Sur un reseau lent/flaky, le `npm ci` peut timeout.

# ── Build ──
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# npm patient pour les reseaux moins fiables
ENV NPM_CONFIG_FETCH_TIMEOUT=600000
ENV NPM_CONFIG_FETCH_RETRIES=5

COPY package*.json ./
RUN npm ci

COPY prisma/ ./prisma/
RUN npx prisma generate

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Ne garder que les deps de production pour l'image finale
RUN npm prune --omit=dev

# ── Production ──
FROM node:22-bookworm-slim

# openssl + libssl3 sont requis par les engines Prisma (debian-openssl-3.0.x).
# bookworm-slim a libssl3 mais pas le binaire openssl, sans lequel la detection
# de version Prisma echoue silencieusement et tombe sur le mauvais binaire.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# Utilisateur non-root fourni par l'image officielle
USER node

EXPOSE 3000

# Healthcheck via node natif (pas besoin d'installer wget/curl)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Migrations Prisma puis API. exec node -> Node devient PID 1 et reçoit
# directement SIGTERM/SIGINT (handlers definis dans src/index.ts).
CMD ["sh", "-c", "npx prisma migrate deploy && exec node dist/index.js"]
