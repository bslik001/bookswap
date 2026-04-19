# BookSwap — API

API REST Express + Prisma + PostgreSQL pour l'application d'echange de
livres scolaires BookSwap. Cf. [README racine](../README.md) pour la vue
d'ensemble du projet et les liens vers les cahiers (analyse, conception).

## Stack

| Couche | Technologies |
|--------|-------------|
| **Runtime** | Node.js >= 20.12, TypeScript 5.7 |
| **Framework** | Express 4 |
| **ORM / BDD** | Prisma 6 + PostgreSQL 16 |
| **Auth** | JWT (access 15 min + refresh 7 j en base, rotation), bcrypt 12 rounds, OTP SMS |
| **Validation** | Zod (body, query, params), validation UUID sur tous les `:id` |
| **Upload** | Multer (memoire) + Cloudinary |
| **SMS** | Africa's Talking (no-op en dev) |
| **Push** | Firebase Cloud Messaging (no-op en dev) |
| **Logging** | Pino (JSON en prod, pretty en dev) + correlation `x-request-id` |
| **Doc API** | Swagger / OpenAPI 3.0 (`/api/docs`, spec sur `/api/docs.json`) |
| **Tests** | Vitest 4 + Supertest (34 tests d'integration) |
| **Qualite** | ESLint 8 + Prettier, hooks Husky + commitlint |
| **Observabilite** | Sentry (optionnel, active si `SENTRY_DSN` defini) |

## Structure

```
server/
├── Dockerfile               # Multi-stage prod (dumb-init + non-root)
├── Dockerfile.dev           # Image dev (bind-mount source + node_modules)
├── prisma/
│   ├── schema.prisma        # 8 modeles, 6 enums
│   ├── seed.ts              # 1 admin + 2 fournisseurs + 5 users + 10 livres + 3 demandes + 4 fournitures
│   └── migrations/          # tsvector + GIN, index composite, refresh tokens, etc.
├── vitest.config.ts
└── src/
    ├── index.ts             # Point d'entree (graceful shutdown)
    ├── app.ts               # Express : helmet, compression, CORS, rate limit, Swagger
    ├── config/              # env (Zod), logger, swagger, cloudinary, africastalking, firebase
    ├── lib/prisma.ts        # Singleton PrismaClient
    ├── middleware/          # errorHandler, auth, validate, validateId, rateLimiter, upload
    ├── utils/               # jwt, password, otp, pagination, cloudinary, asyncHandler
    ├── docs/                # Annotations Swagger par module
    ├── test/                # setup.ts (charge .env.test) + helpers.ts
    └── modules/
        ├── auth/            # register, OTP, login, refresh, logout, passwords
        ├── user/            # profil, suppression compte, admin
        ├── book/            # CRUD, full-text search, upload
        ├── request/         # demandes, transitions de statut
        ├── supply/          # fournitures, contact fournisseur
        └── notification/    # in-app + push FCM
```

## Base de donnees

**8 modeles :** User, Book, Request, Supply, ContactRequest, Notification,
OtpVerification, RefreshToken.

**Points notables :**
- Recherche full-text en francais (`tsvector` + index GIN sur titre/auteur)
- Index composite `(status, grade, condition)` sur les livres
- `@@unique([bookId, requesterId])` sur Request (RG-04)
- Refresh tokens stockes en base (hash SHA-256), rotation automatique,
  detection de replay (revocation globale du user)
- `tokenVersion` sur User pour revoquer tous les tokens (blocage, change pwd)
- OTP lie au User (`userId` sur OtpVerification) pour tracabilite

## API — 34 endpoints

> Doc interactive Swagger UI sur `/api/docs` une fois le serveur lance.
> Spec JSON sur `/api/docs.json`.

### Authentification

| Methode | Endpoint | Description | Rate limit |
|---------|----------|-------------|------------|
| POST | `/api/auth/register` | Inscription + envoi OTP SMS | 3 / 10 min |
| POST | `/api/auth/verify-otp` | Verification OTP, active le compte | 5 / 15 min |
| POST | `/api/auth/resend-otp` | Renvoyer l'OTP (cooldown 60 s, max 3/h) | 2 / min |
| POST | `/api/auth/login` | Connexion, retourne tokens JWT | 5 / min |
| POST | `/api/auth/refresh-token` | Renouveler les tokens (rotation) | - |
| POST | `/api/auth/logout` | Revoquer le refresh token (ou tous) | Auth |
| PUT | `/api/auth/change-password` | Changer le mot de passe (invalide tokens) | Auth |
| POST | `/api/auth/forgot-password` | Envoi OTP de reinitialisation (reponse opaque) | - |
| POST | `/api/auth/reset-password` | Reinitialiser via OTP | - |

### Utilisateurs

| Methode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/api/users/me` | Mon profil complet | User |
| PUT | `/api/users/me` | Modifier mon profil / FCM token | User |
| DELETE | `/api/users/me` | Supprimer mon compte (verif mot de passe) | User |
| GET | `/api/users/:id` | Profil public (nom tronque) | User |

### Livres

| Methode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/api/books` | Liste filtree (grade, condition, status, search), paginee | User |
| GET | `/api/books/me` | Mes livres (max 100) | User |
| GET | `/api/books/:id` | Detail + `hasRequested` + owner tronque | User |
| POST | `/api/books` | Creer (multipart/form-data + image) | User |
| PUT | `/api/books/:id` | Modifier (proprietaire) | User |
| DELETE | `/api/books/:id` | Supprimer (proprietaire ou admin) | User |
| GET | `/api/books/:id/requests` | Demandes recues sur mon livre | User |

### Demandes

| Methode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/api/requests` | Demander un livre (RG-04, RG-05) | User |
| GET | `/api/requests/me` | Mes demandes avec infos livre | User |
| GET | `/api/requests/:id` | Detail (demandeur ou proprietaire) | User |
| DELETE | `/api/requests/:id` | Annuler ma demande (PENDING uniquement) | User |

### Fournitures

| Methode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/api/supplies` | Liste filtree par type, paginee | User |
| GET | `/api/supplies/:id` | Detail | User |
| POST | `/api/supplies` | Ajouter une fourniture | Supplier/Admin |
| POST | `/api/supplies/:id/contact` | Contacter le fournisseur | User |

### Notifications

| Methode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/api/notifications` | Liste paginee (DESC) | User |
| GET | `/api/notifications/unread-count` | Nombre de non-lues | User |
| PUT | `/api/notifications/:id/read` | Marquer comme lue | User |
| PUT | `/api/notifications/read-all` | Tout marquer comme lu | User |

### Administration

| Methode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/api/admin/users/stats` | Statistiques globales | Admin |
| GET | `/api/admin/users` | Liste users (filtre role, search) | Admin |
| PUT | `/api/admin/users/:id/block` | Bloquer/debloquer (invalide tokens) | Admin |
| GET | `/api/admin/requests` | Toutes les demandes (coordonnees completes) | Admin |
| PUT | `/api/admin/requests/:id` | Changer le statut | Admin |

### Health checks

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/health` | Statut de l'API |
| GET | `/api/health/ready` | Readiness (teste PostgreSQL) |

### Transitions de statut des demandes

```
PENDING → IN_PROGRESS → ACCEPTED → COMPLETED
                   ↘       ↘
                  REFUSED   REFUSED
```

Effets de bord automatiques :
- `ACCEPTED` → livre passe a `RESERVED`
- `COMPLETED` → livre passe a `EXCHANGED`
- Chaque changement → notification au demandeur

## Format de reponse

**Succes :**
```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 45, "totalPages": 3 }
}
```

**Erreur :**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Donnees invalides",
    "details": [{ "field": "email", "message": "Format d'email invalide" }]
  }
}
```

## Installation

### Prerequis

- Node.js >= 20.12 (requis par Vitest 4 / rolldown)
- PostgreSQL >= 14 (ou Docker pour la stack `docker-compose`)

### Configuration

```bash
cd server
cp .env.example .env
# Remplir les variables dans .env
npm install
```

### Variables d'environnement

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL PostgreSQL |
| `JWT_ACCESS_SECRET` | Secret JWT access (min 32 car.) |
| `JWT_REFRESH_SECRET` | Secret JWT refresh (min 32 car.) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key (PEM) |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email |
| `AT_API_KEY` | Africa's Talking API key |
| `AT_USERNAME` | Africa's Talking username |
| `AT_SENDER_ID` | SMS Sender ID (doit etre approuve par l'operateur) |
| `PORT` | Port du serveur (defaut : 3000) |
| `NODE_ENV` | `development` / `production` / `test` |
| `CORS_ORIGIN` | Origine autorisee pour CORS |
| `SENTRY_DSN` | *(optionnel)* DSN Sentry — active le reporting si defini |
| `SENTRY_TRACES_SAMPLE_RATE` | *(optionnel)* taux d'echantillonnage 0..1 (defaut 0) |

### Base de donnees

```bash
# Creer la base
createdb bookswap

# Appliquer les migrations
npx prisma migrate dev

# Remplir la base avec des donnees de demo
npm run prisma:seed

# Visualiser les donnees
npx prisma studio
```

**Donnees de seed :** 1 admin, 2 fournisseurs, 5 utilisateurs, 10 livres,
3 demandes, 4 fournitures.
Mot de passe par defaut : `Password123!` — comptes : `admin@bookswap.sn`,
`user1@bookswap.sn` ... `user5@bookswap.sn`.

## Lancement

### Option 1 — Tout en Docker (Postgres + API hot reload)

```bash
# Une fois : installer node_modules sur l'hote (bind-mount)
cd server && npm ci && cd ..

# Stack complete
docker compose up -d

# Logs API
docker compose logs -f api

# Arret
docker compose down
```

Le service `api` utilise [Dockerfile.dev](Dockerfile.dev) : il bind-mounte
le source et les `node_modules` de l'hote — pas de `npm ci` dans le
conteneur (rapide, robuste sur reseau lent), hot reload via `ts-node-dev`.

### Option 2 — Postgres en Docker, API en local

```bash
docker compose up -d postgres
cd server && npm run dev
```

### Option 3 — Build standalone (production)

Le [Dockerfile](Dockerfile) (sans `.dev`) construit une image autonome
pour deploiement (Render, Fly.io, Railway, etc.) : `npm ci` + `prisma
migrate deploy` + `node dist/index.js`.

```bash
cd server
docker build -t bookswap-api .
docker run -p 3000:3000 --env-file .env bookswap-api
```

### Sans Docker

```bash
npm run build
npm start
```

## Verification

```bash
curl http://localhost:3000/api/health
# → {"success":true,"data":{"status":"ok"}}

curl http://localhost:3000/api/health/ready
# → {"success":true,"data":{"status":"ready","database":"connected"}}

open http://localhost:3000/api/docs
```

## Tests

Setup Vitest + Supertest, 34 tests d'integration (auth + requests) qui
tournent contre une base PostgreSQL **locale dediee** (`bookswap_test`).

```bash
# Creer la base de test une fois
createdb bookswap_test
cp .env.test.example .env.test
# Editer .env.test pour pointer vers bookswap_test

# Appliquer les migrations sur la base de test
DATABASE_URL=postgresql://.../bookswap_test npx prisma migrate deploy

# Lancer les tests
npm test            # one-shot
npm run test:watch  # mode watch
```

**Garde-fou :** [src/test/setup.ts](src/test/setup.ts) refuse de tourner
si `DATABASE_URL` ne pointe pas vers une base locale dont le nom contient
`test` (les hooks `beforeEach` truncate toutes les tables).

## Qualite de code

```bash
npm run lint        # ESLint (zero warning)
npm run lint:fix
npm run format      # Prettier
npm run typecheck   # tsc --noEmit
npm run check       # lint + typecheck + tests
```

**Hooks Git automatiques** (Husky, configures a la racine) :
- `pre-commit` → lint-staged (ESLint --fix + Prettier sur les fichiers stages)
- `commit-msg` → commitlint (Conventional Commits obligatoires)

Installation des hooks : `npm install` depuis la racine.

## Mode developpement

En `NODE_ENV=development` :
- **SMS OTP** logues via pino au lieu d'etre envoyes
- **Notifications push** loguees via pino au lieu de passer par FCM
- **Erreurs 500** incluent la stack trace dans la reponse
- **Logs** affiches en format lisible (pino-pretty) au lieu de JSON

## Securite

- Mots de passe hashes avec bcrypt (12 rounds)
- JWT access 15 min, refresh 7 j stocke en base (hash SHA-256), rotation
  a chaque utilisation
- Detection de replay : reutilisation d'un ancien refresh → revocation
  de tous les tokens du user
- `tokenVersion` sur User pour revoquer globalement
- Validation UUID sur tous les `:id` (middleware `validateId`)
- Rate limiting global (100 req/min) + par endpoint (register, login, OTP)
- Validation Zod sur toutes les entrees (body, query, params)
- Upload : JPEG/PNG uniquement, 5 Mo max, stockage memoire
- Profils publics : nom tronque ("Diallo" → "D."), pas de telephone
- Routes admin protegees par `authorize('ADMIN')`
- Forgot password : reponse opaque (ne revele pas si le numero existe)
- `helmet` + `compression` + CORS configurable

## CI/CD

Le pipeline GitHub Actions ([../.github/workflows/ci.yml](../.github/workflows/ci.yml))
s'execute sur chaque push/PR vers `main` :

1. `npm ci` — installation des dependances
2. `prisma generate` — generation du client
3. `npm run lint` — ESLint (zero warning autorise)
4. `npx tsc --noEmit` — verification TypeScript
5. `npx prisma validate` — validation du schema
6. `npm test` — Vitest

## Deploiement

Pret a etre deploye sur [Render](https://render.com) via le blueprint
[render.yaml](../render.yaml) a la racine.

### Premiere fois

1. Creer un compte Render et connecter le repo GitHub
2. **New → Blueprint** → selectionner ce repo
3. Render detecte [render.yaml](../render.yaml) et propose :
   - une base **PostgreSQL 16** (plan free, region Frankfurt)
   - un **web service Docker** (plan free, healthcheck sur `/api/health`)
4. Remplir dans le dashboard les secrets marques `sync: false` :
   - `CORS_ORIGIN` — URL du frontend (ex : `https://bookswap.expo.app`)
   - Cloudinary : `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
     `CLOUDINARY_API_SECRET`
   - Firebase : `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`,
     `FIREBASE_CLIENT_EMAIL`
   - Africa's Talking : `AT_API_KEY`, `AT_USERNAME`, `AT_SENDER_ID`
   - *(optionnel)* `SENTRY_DSN`
5. `DATABASE_URL`, `JWT_ACCESS_SECRET` et `JWT_REFRESH_SECRET` sont
   injectes automatiquement (Postgres interne + secrets generes par Render)
6. Le service se deploie : `prisma migrate deploy` puis `node dist/index.js`

### Deploiements suivants

Chaque push sur `main` redeploie automatiquement (CI valide avant, Render
build l'image Docker et redemarre le service).

> Le plan free a un **cold start d'environ 30 s** apres 15 min d'inactivite.
> Pour un usage demo/jury c'est acceptable ; pour de la prod passer au plan
> starter (~7 $/mois).
