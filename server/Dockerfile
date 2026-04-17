# syntax=docker/dockerfile:1.6

# ── Build ──
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma/ ./prisma/
RUN npx prisma generate

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ── Production ──
FROM node:18-alpine

# wget pour HEALTHCHECK, dumb-init pour handle proprement SIGTERM (PID 1)
RUN apk add --no-cache wget dumb-init

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY prisma/ ./prisma/
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

# Utilisateur non-root fourni par l'image officielle
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# dumb-init comme PID 1 -> signaux propages correctement au process Node
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Appliquer les migrations avant de demarrer l'API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
