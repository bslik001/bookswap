# BookSwap

Application mobile d'echange de livres scolaires. Les eleves et parents publient les manuels qu'ils souhaitent echanger, un administrateur facilite la mise en relation, et les fournisseurs proposent des fournitures scolaires.

## Documentation

| Document | Description |
|----------|-------------|
| [Cahier des charges](📘%20Cahier%20des%20charges%20books.pdf) | Specifications fonctionnelles initiales |
| [Cahier d'analyse](CAHIER_ANALYSE.md) | Analyse detaillee : cas d'utilisation, modele de donnees, regles de gestion |
| [Cahier de conception](CAHIER_CONCEPTION.md) | Architecture technique, schema Prisma, contrats API, specs UI |
| [Maquettes](maquettes.html) | 12 ecrans interactifs (ouvrir dans un navigateur en mode mobile) |

## Stack technique

| Couche | Technologies |
|--------|-------------|
| **Backend** | Node.js, Express, TypeScript |
| **ORM / BDD** | Prisma, PostgreSQL |
| **Auth** | JWT (access 15min + refresh 7j), bcrypt, OTP SMS |
| **Validation** | Zod |
| **Upload images** | Multer + Cloudinary |
| **Notifications push** | Firebase Cloud Messaging |
| **SMS** | Africa's Talking |
| **Frontend** *(a venir)* | React Native + Expo |

## Structure du projet

```
bookswap/
├── CAHIER_ANALYSE.md
├── CAHIER_CONCEPTION.md
├── maquettes.html
└── server/
    ├── prisma/
    │   ├── schema.prisma            # 7 modeles, 6 enums
    │   └── migrations/
    │       ├── 20260415_init/
    │       └── 20260415_add_search_vector/   # tsvector + index GIN
    └── src/
        ├── index.ts                 # Point d'entree
        ├── app.ts                   # Express : CORS, rate limiter, routes, error handler
        ├── config/
        │   ├── env.ts               # Validation Zod des variables d'environnement
        │   ├── cloudinary.ts        # SDK Cloudinary
        │   ├── africastalking.ts    # SMS (log en console en dev)
        │   └── firebase.ts          # Push FCM (log en console en dev)
        ├── lib/
        │   └── prisma.ts            # Singleton PrismaClient
        ├── middleware/
        │   ├── errorHandler.ts      # AppError, Zod, Prisma → format JSON standard
        │   ├── auth.ts              # authenticate (JWT) + authorize (roles)
        │   ├── validate.ts          # Factory Zod pour body/query/params
        │   ├── rateLimiter.ts       # Global (100/min) + factory custom
        │   └── upload.ts            # Multer memory, 5 Mo, JPEG/PNG
        ├── utils/
        │   ├── jwt.ts               # Access token (15min), refresh token (7j)
        │   ├── password.ts          # bcrypt 12 rounds
        │   ├── otp.ts               # Code 4 chiffres, expiration, masquage
        │   ├── pagination.ts        # paginate(), buildMeta()
        │   ├── cloudinary.ts        # uploadImage(), deleteImage()
        │   └── asyncHandler.ts      # Wrapper try/catch pour controllers
        ├── types/
        │   └── express.d.ts         # Extend Request avec user
        └── modules/
            ├── auth/                # Inscription, OTP, login, refresh
            ├── user/                # Profil, admin (list, block)
            ├── book/                # CRUD, full-text search, upload
            ├── request/             # Demandes, transitions de statut
            ├── supply/              # Fournitures, contact fournisseur
            └── notification/        # In-app + push FCM
```

## Base de donnees

**7 modeles :** User, Book, Request, Supply, ContactRequest, Notification, OtpVerification

**Fonctionnalites notables :**
- Recherche full-text en francais (`tsvector` + index GIN sur titre et auteur des livres)
- Contrainte d'unicite `@@unique([bookId, requesterId])` sur les demandes (RG-04)
- `tokenVersion` sur User pour invalider les refresh tokens au blocage
- `isActive` / `isPhoneVerified` pour le flux d'inscription avec OTP

## API — 28 endpoints

### Authentification

| Methode | Endpoint | Description | Rate limit |
|---------|----------|-------------|------------|
| POST | `/api/auth/register` | Inscription + envoi OTP SMS | 3 / 10min |
| POST | `/api/auth/verify-otp` | Verification du code OTP, active le compte | 5 / 15min |
| POST | `/api/auth/resend-otp` | Renvoyer le code (cooldown 60s, max 3/h) | 2 / min |
| POST | `/api/auth/login` | Connexion, retourne les tokens JWT | 5 / min |
| POST | `/api/auth/refresh-token` | Renouveler la paire de tokens | - |

### Utilisateurs

| Methode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/api/users/me` | Mon profil complet | User |
| PUT | `/api/users/me` | Modifier mon profil / FCM token | User |
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
| GET | `/api/admin/users` | Liste utilisateurs (filtre role, search) | Admin |
| PUT | `/api/admin/users/:id/block` | Bloquer/debloquer (invalide les tokens) | Admin |
| GET | `/api/admin/requests` | Toutes les demandes (coordonnees completes) | Admin |
| PUT | `/api/admin/requests/:id` | Changer le statut (transitions controlees) | Admin |

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
| `NODE_ENV` | `development` / `production` |
| `CORS_ORIGIN` | Origine autorisee pour CORS |

### Base de donnees

```bash
# Creer la base
createdb bookswap

# Appliquer les migrations
npx prisma migrate dev

# Visualiser les donnees
npx prisma studio
```

### Lancement

```bash
# Developpement (hot reload)
npm run dev

# Production
npm run build
npm start
```

### Verification

```bash
curl http://localhost:3000/api/health
# → {"success":true,"data":{"status":"ok"}}
```

## Mode developpement

En `NODE_ENV=development` :
- Les **SMS OTP** sont logues en console au lieu d'etre envoyes
- Les **notifications push** sont loguees en console au lieu de passer par FCM
- Les **erreurs 500** incluent la stack trace dans la reponse

## Securite

- Mots de passe hashes avec bcrypt (12 rounds)
- JWT access token expire en 15 minutes
- `tokenVersion` sur User pour revoquer tous les refresh tokens d'un utilisateur
- Rate limiting global (100 req/min) + par endpoint (register, login, OTP)
- Validation Zod sur toutes les entrees (body, query, params)
- Upload : JPEG/PNG uniquement, 5 Mo max, stockage memoire (pas de fichier temporaire)
- Profils publics : nom de famille tronque ("D."), pas de telephone ni adresse
- Routes admin protegees par middleware `authorize('ADMIN')`
