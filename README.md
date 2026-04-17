# BookSwap

Application mobile d'echange de livres scolaires. Les eleves et parents publient les manuels qu'ils souhaitent echanger, un administrateur facilite la mise en relation, et les fournisseurs proposent des fournitures scolaires.

## Documentation

| Document | Description |
|----------|-------------|
| [Cahier des charges](📘%20Cahier%20des%20charges%20books.pdf) | Specifications fonctionnelles initiales |
| [Cahier d'analyse](CAHIER_ANALYSE.md) | Analyse detaillee : cas d'utilisation, modele de donnees, regles de gestion |
| [Cahier de conception](CAHIER_CONCEPTION.md) | Architecture technique, schema Prisma, contrats API, specs UI |
| [Maquettes](maquettes.html) | 12 ecrans interactifs (ouvrir dans un navigateur en mode mobile) |
| **API interactive** | Swagger UI disponible sur `/api/docs` une fois le serveur lance |

## Stack technique

| Couche | Technologies |
|--------|-------------|
| **Backend** | Node.js, Express, TypeScript |
| **ORM / BDD** | Prisma, PostgreSQL |
| **Auth** | JWT (access 15min + refresh 7j en base), bcrypt, OTP SMS |
| **Validation** | Zod, validation UUID sur tous les params `:id` |
| **Upload images** | Multer + Cloudinary |
| **Notifications push** | Firebase Cloud Messaging |
| **SMS** | Africa's Talking |
| **Logging** | Pino (JSON en prod, pretty en dev) |
| **Documentation API** | Swagger / OpenAPI 3.0 (swagger-jsdoc + swagger-ui-express) |
| **Qualite de code** | ESLint + Prettier |
| **CI/CD** | GitHub Actions (lint, build, prisma validate) |
| **Containerisation** | Docker (multi-stage build) |
| **Frontend** *(a venir)* | React Native + Expo |

## Structure du projet

```
bookswap/
├── .github/workflows/
│   └── ci.yml                       # Lint → Build → Prisma validate
├── CAHIER_ANALYSE.md
├── CAHIER_CONCEPTION.md
├── maquettes.html
└── server/
    ├── .eslintrc.json               # ESLint v8 + @typescript-eslint + Prettier
    ├── .prettierrc                   # Semi, singleQuote, trailingComma: all
    ├── Dockerfile                   # Multi-stage : build → production
    ├── .dockerignore
    ├── prisma/
    │   ├── schema.prisma            # 8 modeles, 6 enums
    │   └── migrations/
    │       ├── 20260415_init/
    │       ├── 20260415_add_search_vector/       # tsvector + index GIN
    │       ├── 20260416_add_userid_to_otp/       # Lien OTP → User
    │       ├── 20260416_add_composite_index/     # Index (status, grade, condition)
    │       └── 20260416_add_refresh_tokens/      # Table refresh_tokens
    └── src/
        ├── index.ts                 # Point d'entree
        ├── app.ts                   # Express : CORS, rate limiter, Swagger UI, routes
        ├── config/
        │   ├── env.ts               # Validation Zod des variables d'environnement
        │   ├── logger.ts            # Pino : JSON en prod, pino-pretty en dev
        │   ├── swagger.ts           # OpenAPI 3.0 spec (28 endpoints documentes)
        │   ├── cloudinary.ts        # SDK Cloudinary
        │   ├── africastalking.ts    # SMS (log en dev, envoi reel en prod)
        │   └── firebase.ts          # Push FCM (log en dev, envoi reel en prod)
        ├── lib/
        │   └── prisma.ts            # Singleton PrismaClient
        ├── middleware/
        │   ├── errorHandler.ts      # AppError, Zod, Prisma → format JSON standard
        │   ├── auth.ts              # authenticate (JWT) + authorize (roles)
        │   ├── validate.ts          # Factory Zod pour body/query/params
        │   ├── validateId.ts        # Validation UUID sur tous les params :id
        │   ├── rateLimiter.ts       # Global (100/min) + factory custom
        │   └── upload.ts            # Multer memory, 5 Mo, JPEG/PNG
        ├── utils/
        │   ├── jwt.ts               # Access token (15min), refresh token (7j), hashToken
        │   ├── password.ts          # bcrypt 12 rounds
        │   ├── otp.ts               # Code 4 chiffres, expiration, masquage
        │   ├── pagination.ts        # paginate(), buildMeta()
        │   ├── cloudinary.ts        # uploadImage(), deleteImage()
        │   └── asyncHandler.ts      # Wrapper try/catch pour controllers
        ├── types/
        │   ├── express.d.ts         # Extend Request avec user
        │   └── africastalking.d.ts  # Types Africa's Talking SDK
        ├── docs/                    # Swagger/OpenAPI annotations
        │   ├── auth.ts
        │   ├── users.ts
        │   ├── books.ts
        │   ├── requests.ts
        │   ├── supplies.ts
        │   ├── notifications.ts
        │   └── admin.ts
        └── modules/
            ├── auth/                # Inscription, OTP, login, refresh, logout, passwords
            ├── user/                # Profil, suppression compte, admin (list, block, stats)
            ├── book/                # CRUD, full-text search, upload
            ├── request/             # Demandes, transitions de statut
            ├── supply/              # Fournitures, contact fournisseur
            └── notification/        # In-app + push FCM
```

## Base de donnees

**8 modeles :** User, Book, Request, Supply, ContactRequest, Notification, OtpVerification, RefreshToken

**Fonctionnalites notables :**
- Recherche full-text en francais (`tsvector` + index GIN sur titre et auteur des livres)
- Index composite `(status, grade, condition)` sur les livres pour les filtres frequents
- Contrainte d'unicite `@@unique([bookId, requesterId])` sur les demandes (RG-04)
- Refresh tokens stockes en base (hash SHA-256) avec rotation et detection de replay
- `tokenVersion` sur User pour revoquer tous les tokens d'un utilisateur
- `isActive` / `isPhoneVerified` pour le flux d'inscription avec OTP
- OTP lie au User (`userId` sur OtpVerification) pour tracabilite

## API — 34 endpoints

> Documentation interactive Swagger UI disponible sur `/api/docs`
> Spec JSON telechargeable sur `/api/docs.json`

### Authentification

| Methode | Endpoint | Description | Rate limit |
|---------|----------|-------------|------------|
| POST | `/api/auth/register` | Inscription + envoi OTP SMS | 3 / 10min |
| POST | `/api/auth/verify-otp` | Verification du code OTP, active le compte | 5 / 15min |
| POST | `/api/auth/resend-otp` | Renvoyer le code (cooldown 60s, max 3/h) | 2 / min |
| POST | `/api/auth/login` | Connexion, retourne les tokens JWT | 5 / min |
| POST | `/api/auth/refresh-token` | Renouveler les tokens (rotation automatique) | - |
| POST | `/api/auth/logout` | Revoquer le refresh token (ou tous) | Auth |
| PUT | `/api/auth/change-password` | Changer de mot de passe (invalide les tokens) | Auth |
| POST | `/api/auth/forgot-password` | Envoi OTP de reinitialisation (reponse opaque) | - |
| POST | `/api/auth/reset-password` | Reinitialiser le mot de passe via OTP | - |

### Utilisateurs

| Methode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/api/users/me` | Mon profil complet | User |
| PUT | `/api/users/me` | Modifier mon profil / FCM token | User |
| DELETE | `/api/users/me` | Supprimer mon compte (verification mot de passe) | User |
| GET | `/api/users/:id` | Profil public (nom tronque : "Diallo" → "D.") | User |

### Livres

| Methode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/api/books` | Liste avec filtres (grade, condition, status, search), pagination | User |
| GET | `/api/books/me` | Mes livres (max 100) | User |
| GET | `/api/books/:id` | Detail + `hasRequested` + owner tronque | User |
| POST | `/api/books` | Creer (multipart/form-data + image) | User |
| PUT | `/api/books/:id` | Modifier (proprietaire uniquement) | User |
| DELETE | `/api/books/:id` | Supprimer (proprietaire ou admin) | User |

### Demandes

| Methode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/api/requests` | Demander un livre (regles RG-04, RG-05) | User |
| GET | `/api/requests/me` | Mes demandes avec infos livre | User |

### Fournitures

| Methode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/api/supplies` | Liste avec filtre type, pagination | User |
| GET | `/api/supplies/:id` | Detail fourniture | User |
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
| GET | `/api/admin/users/stats` | Statistiques globales (users, books, requests, supplies) | Admin |
| GET | `/api/admin/users` | Liste utilisateurs (filtre role, search) | Admin |
| PUT | `/api/admin/users/:id/block` | Bloquer/debloquer (invalide les tokens) | Admin |
| GET | `/api/admin/requests` | Toutes les demandes (coordonnees completes) | Admin |
| PUT | `/api/admin/requests/:id` | Changer le statut (transitions controlees) | Admin |

### Health checks

| Methode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/api/health` | Statut de l'API | - |
| GET | `/api/health/ready` | Readiness (teste la connexion PostgreSQL) | - |

### Transitions de statut des demandes

```
PENDING → IN_PROGRESS → ACCEPTED → COMPLETED
                   ↘       ↘
                  REFUSED   REFUSED
```

**Effets de bord automatiques :**
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

- Node.js >= 18
- PostgreSQL >= 14

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
| `JWT_ACCESS_SECRET` | Secret JWT access token (min 32 car.) |
| `JWT_REFRESH_SECRET` | Secret JWT refresh token (min 32 car.) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key (PEM) |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email |
| `AT_API_KEY` | Africa's Talking API key |
| `AT_USERNAME` | Africa's Talking username |
| `AT_SENDER_ID` | SMS Sender ID (doit etre approuve par l'operateur) |
| `PORT` | Port du serveur (defaut: 3000) |
| `NODE_ENV` | `development` / `production` / `test` |
| `CORS_ORIGIN` | Origine autorisee pour CORS |

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

**Donnees de seed :** 1 admin, 2 fournisseurs, 5 utilisateurs, 10 livres, 3 demandes, 4 fournitures.
Mot de passe par defaut : `Password123!` — comptes : `admin@bookswap.sn`, `user1@bookswap.sn`...`user5@bookswap.sn`.

### Lancement

```bash
# Developpement (hot reload)
npm run dev

# Production
npm run build
npm start

# Docker (image seule)
docker build -t bookswap-api .
docker run -p 3000:3000 --env-file .env bookswap-api
```

### Docker Compose (dev local complet)

Depuis la racine du projet :

```bash
# Demarrer Postgres + API
docker compose up -d

# Logs de l'API
docker compose logs -f api

# Demarrer uniquement Postgres (si on lance l'API avec npm run dev)
docker compose up -d postgres

# Arret
docker compose down
```

Le compose applique automatiquement les migrations Prisma au demarrage (`prisma migrate deploy`).

### Qualite de code

```bash
# Linter
npm run lint
npm run lint:fix

# Formattage
npm run format
```

### Verification

```bash
# Health check basique
curl http://localhost:3000/api/health
# → {"success":true,"data":{"status":"ok"}}

# Readiness (teste PostgreSQL)
curl http://localhost:3000/api/health/ready
# → {"success":true,"data":{"status":"ready","database":"connected"}}

# Documentation API interactive
open http://localhost:3000/api/docs
```

## Mode developpement

En `NODE_ENV=development` :
- Les **SMS OTP** sont logues via pino au lieu d'etre envoyes
- Les **notifications push** sont loguees via pino au lieu de passer par FCM
- Les **erreurs 500** incluent la stack trace dans la reponse
- Les **logs** sont affiches en format lisible (pino-pretty) au lieu de JSON

## Securite

- Mots de passe hashes avec bcrypt (12 rounds)
- JWT access token expire en 15 minutes
- Refresh tokens stockes en base (hash SHA-256), rotation automatique a chaque utilisation
- Detection de replay : reutilisation d'un ancien refresh token → revocation de tous les tokens de l'utilisateur
- `tokenVersion` sur User pour revoquer globalement les tokens (blocage, changement de mot de passe)
- Validation UUID sur tous les parametres `:id` des routes (middleware `validateId`)
- Rate limiting global (100 req/min) + par endpoint (register, login, OTP)
- Validation Zod sur toutes les entrees (body, query, params)
- Upload : JPEG/PNG uniquement, 5 Mo max, stockage memoire (pas de fichier temporaire)
- Profils publics : nom de famille tronque ("D."), pas de telephone ni adresse
- Routes admin protegees par middleware `authorize('ADMIN')`
- Forgot password : reponse opaque (ne revele pas si le numero existe)

## CI/CD

Le pipeline GitHub Actions s'execute sur chaque push et PR vers `main` :

1. **npm ci** — installation des dependances
2. **prisma generate** — generation du client Prisma
3. **npm run lint** — ESLint (zero warnings autorise)
4. **npx tsc --noEmit** — verification TypeScript
5. **npx prisma validate** — validation du schema Prisma
