# Cahier de Conception -- Application Mobile d'Echange de Livres Scolaires

---

## 1. Introduction

### 1.1 Objet du document

Ce cahier de conception traduit le cahier d'analyse en specifications techniques implementables. Il sert de reference pour :
- L'equipe **backend** : architecture, schema SQL, contrats API avec exemples de requetes/reponses.
- L'equipe **frontend/design** : structure des ecrans, composants, flux de navigation, etats de l'interface.

### 1.2 Stack technique retenue

| Couche | Technologie |
|---|---|
| Mobile | React Native + Expo (SDK 52+) |
| Backend API | Node.js + Express + TypeScript |
| Base de donnees | PostgreSQL 16 |
| ORM | Prisma |
| Stockage images | Cloudinary |
| Notifications push | Firebase Cloud Messaging (FCM) |
| Verification SMS (OTP) | Africa's Talking |
| Hebergement (MVP) | Render |
| Hebergement (production) | Railway |

---

## 2. Architecture detaillee

### 2.1 Architecture globale

L'application suit une architecture **client-serveur REST classique** avec separation stricte entre le frontend mobile, le backend API et les services tiers.

```
                    ┌─────────────────────┐
                    │   App Mobile        │
                    │  (React Native +    │
                    │   Expo)             │
                    └─────────┬───────────┘
                              │ HTTPS
                              ▼
                    ┌─────────────────────┐
                    │   API Gateway       │
                    │   (Express)         │
                    │                     │
                    │  ┌───────────────┐  │
                    │  │  Middleware    │  │
                    │  │  Chain        │  │
                    │  └───────┬───────┘  │
                    │          │          │
                    │  ┌───────▼───────┐  │
                    │  │   Router      │  │
                    │  │   Layer       │  │
                    │  └───────┬───────┘  │
                    │          │          │
                    │  ┌───────▼───────┐  │
                    │  │  Controllers  │  │
                    │  └───────┬───────┘  │
                    │          │          │
                    │  ┌───────▼───────┐  │
                    │  │   Services    │  │
                    │  └───────┬───────┘  │
                    │          │          │
                    │  ┌───────▼───────┐  │
                    │  │  Prisma ORM   │  │
                    │  └───────────────┘  │
                    └─────┬─────┬────┬────┘
                          │     │    │
                ┌─────────▼┐ ┌─▼────▼──────┐
                │PostgreSQL│ │ Services     │
                │          │ │ externes     │
                └──────────┘ │- Cloudinary  │
                             │- Firebase FCM│
                             └──────────────┘
```

### 2.2 Pattern d'architecture backend : Controller → Service → Repository

Chaque module suit un pattern en 3 couches :

| Couche | Responsabilite | Exemple |
|---|---|---|
| **Controller** | Recoit la requete HTTP, valide les entrees (Zod), appelle le service, formate la reponse | `bookController.getAll(req, res)` |
| **Service** | Logique metier, orchestration, regles de gestion | `bookService.createBook(data, userId)` |
| **Repository** | Acces aux donnees via Prisma (queries) | `prisma.book.findMany(...)` |

Les controllers ne contiennent aucune logique metier. Les services ne connaissent pas Express (pas de `req`/`res`).

### 2.3 Structure des dossiers du backend

```
server/
├── prisma/
│   ├── schema.prisma          # Schema de la base de donnees
│   └── migrations/            # Migrations auto-generees
├── src/
│   ├── index.ts               # Point d'entree, demarrage du serveur
│   ├── app.ts                 # Configuration Express (middlewares, routes)
│   ├── config/
│   │   ├── env.ts             # Variables d'environnement (validees avec Zod)
│   │   ├── cloudinary.ts      # Configuration Cloudinary
│   │   ├── firebase.ts        # Configuration Firebase Admin SDK
│   │   └── africastalking.ts  # Configuration Africa's Talking (SMS OTP)
│   ├── middleware/
│   │   ├── auth.ts            # Verification JWT, extraction user
│   │   ├── validate.ts        # Middleware generique de validation Zod
│   │   ├── upload.ts          # Multer config pour reception fichiers
│   │   ├── rateLimiter.ts     # Rate limiting (express-rate-limit)
│   │   └── errorHandler.ts    # Gestionnaire d'erreurs global
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.schema.ts    # Schemas de validation Zod
│   │   │   └── auth.routes.ts
│   │   ├── user/
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.schema.ts
│   │   │   └── user.routes.ts
│   │   ├── book/
│   │   │   ├── book.controller.ts
│   │   │   ├── book.service.ts
│   │   │   ├── book.schema.ts
│   │   │   └── book.routes.ts
│   │   ├── request/
│   │   │   ├── request.controller.ts
│   │   │   ├── request.service.ts
│   │   │   ├── request.schema.ts
│   │   │   └── request.routes.ts
│   │   ├── supply/
│   │   │   ├── supply.controller.ts
│   │   │   ├── supply.service.ts
│   │   │   ├── supply.schema.ts
│   │   │   └── supply.routes.ts
│   │   └── notification/
│   │       ├── notification.controller.ts
│   │       ├── notification.service.ts
│   │       └── notification.routes.ts
│   ├── utils/
│   │   ├── cloudinary.ts      # Fonctions upload/delete image
│   │   ├── jwt.ts             # Generation/verification tokens
│   │   ├── password.ts        # Hash/compare bcrypt
│   │   ├── otp.ts             # Generation/verification codes OTP
│   │   └── pagination.ts      # Helper de pagination
│   └── types/
│       └── express.d.ts       # Extension du type Request (user)
├── package.json
├── tsconfig.json
└── .env
```

### 2.4 Structure des dossiers du frontend mobile

```
mobile/
├── app/                          # Expo Router (file-based routing)
│   ├── _layout.tsx               # Layout racine (providers, theme)
│   ├── index.tsx                 # Splash / redirection
│   ├── (auth)/                   # Groupe auth (non connecte)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── verify-otp.tsx        # Ecran saisie code OTP
│   │   └── forgot-password.tsx
│   └── (tabs)/                   # Groupe principal (connecte)
│       ├── _layout.tsx           # Tab navigator (4 onglets)
│       ├── home/
│       │   ├── index.tsx         # Ecran accueil (switch modes)
│       │   ├── book/[id].tsx     # Details d'un livre
│       │   └── add-book.tsx      # Formulaire ajout livre
│       ├── supplies/
│       │   ├── index.tsx         # Liste fournitures
│       │   └── [id].tsx          # Details fourniture
│       ├── notifications.tsx     # Liste notifications
│       └── profile/
│           ├── index.tsx         # Mon profil
│           ├── edit.tsx          # Modifier profil
│           ├── my-books.tsx      # Mes livres
│           ├── my-requests.tsx   # Mes demandes
│           └── settings.tsx      # Parametres (theme, notifs)
├── components/
│   ├── ui/                       # Composants generiques
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── EmptyState.tsx
│   │   └── LoadingSpinner.tsx
│   ├── book/
│   │   ├── BookCard.tsx          # Carte livre (liste)
│   │   ├── BookDetail.tsx        # Vue detail livre
│   │   ├── BookForm.tsx          # Formulaire ajout/modif
│   │   └── BookFilters.tsx       # Barre de filtres
│   ├── supply/
│   │   ├── SupplyCard.tsx
│   │   └── SupplyFilters.tsx
│   └── shared/
│       ├── ModeSwitch.tsx        # Toggle "Je recherche" / "J'ai un livre"
│       ├── ImagePicker.tsx       # Selection + upload photo
│       └── NotificationBadge.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useBooks.ts
│   ├── useSupplies.ts
│   └── useNotifications.ts
├── services/
│   ├── api.ts                    # Instance Axios configuree
│   ├── auth.service.ts
│   ├── book.service.ts
│   ├── supply.service.ts
│   └── notification.service.ts
├── store/
│   ├── authStore.ts              # Zustand store (auth state)
│   └── themeStore.ts             # Zustand store (theme clair/sombre)
├── theme/
│   ├── colors.ts                 # Palette clair + sombre
│   ├── typography.ts             # Styles typographiques
│   └── spacing.ts                # Systeme d'espacement 8px
├── constants/
│   └── config.ts                 # URL API, cles publiques
├── app.json                      # Config Expo
└── package.json
```

### 2.5 Middleware chain (ordre d'execution)

```
Requete entrante
    │
    ▼
1. CORS (cors)
    │
    ▼
2. Body parser (express.json, limite 10mb)
    │
    ▼
3. Rate limiter global (100 req/min par IP)
    │
    ▼
4. Route matching (Express Router)
    │
    ▼
5. [Si route protegee] Auth middleware (JWT verification)
    │
    ▼
6. [Si donnees attendues] Validation middleware (Zod schema)
    │
    ▼
7. [Si upload fichier] Multer middleware
    │
    ▼
8. Controller → Service → Prisma
    │
    ▼
9. Reponse JSON
    │
    ▼
[En cas d'erreur a n'importe quelle etape]
    │
    ▼
Error handler global → Reponse d'erreur formatee
```

---

## 3. Conception de la base de donnees

### 3.1 Schema Prisma complet

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
  SUPPLIER
}

enum BookCondition {
  NEW        // neuf
  USED       // occasion
}

enum BookStatus {
  AVAILABLE  // disponible
  RESERVED   // reserve
  EXCHANGED  // echange
}

enum RequestStatus {
  PENDING     // en_attente
  IN_PROGRESS // en_cours
  ACCEPTED    // accepte
  REFUSED     // refuse
  COMPLETED   // termine
}

enum SupplyType {
  NOTEBOOK  // cahier
  PEN       // stylo
  BAG       // sac
  OTHER     // autre
}

enum NotificationType {
  BOOK_REQUEST        // demande de livre
  REQUEST_UPDATE      // mise a jour demande
  SUPPLIER_CONTACT    // contact fournisseur
  SYSTEM              // systeme
}

model User {
  id            String   @id @default(uuid()) @db.Uuid
  firstName     String   @map("first_name") @db.VarChar(100)
  lastName      String   @map("last_name") @db.VarChar(100)
  email         String   @unique @db.VarChar(255)
  password      String   @db.VarChar(255)
  phone         String   @unique @db.VarChar(20)
  isPhoneVerified Boolean @default(false) @map("is_phone_verified")
  address       String   @db.VarChar(500)
  gradeInterests String[] @map("grade_interests")
  role          Role     @default(USER)
  isActive      Boolean  @default(false) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  books          Book[]
  requests       Request[]       @relation("Requester")
  supplies       Supply[]
  contactRequests ContactRequest[] @relation("ContactRequester")
  notifications  Notification[]

  @@map("users")
}

model Book {
  id          String        @id @default(uuid()) @db.Uuid
  title       String        @db.VarChar(255)
  author      String?       @db.VarChar(255)
  grade       String        @db.VarChar(100)
  className   String?       @map("class_name") @db.VarChar(100)
  condition   BookCondition
  description String?       @db.Text
  imageUrl    String        @map("image_url") @db.VarChar(500)
  imagePublicId String?     @map("image_public_id") @db.VarChar(255)
  status      BookStatus    @default(AVAILABLE)
  ownerId     String        @map("owner_id") @db.Uuid
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  owner    User      @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  requests Request[]

  @@index([grade])
  @@index([status])
  @@index([ownerId])
  @@map("books")
}

model Request {
  id          String        @id @default(uuid()) @db.Uuid
  bookId      String        @map("book_id") @db.Uuid
  requesterId String        @map("requester_id") @db.Uuid
  status      RequestStatus @default(PENDING)
  adminNotes  String?       @map("admin_notes") @db.Text
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  book      Book @relation(fields: [bookId], references: [id], onDelete: Cascade)
  requester User @relation("Requester", fields: [requesterId], references: [id], onDelete: Cascade)

  @@unique([bookId, requesterId])
  @@index([status])
  @@map("requests")
}

model Supply {
  id          String     @id @default(uuid()) @db.Uuid
  name        String     @db.VarChar(255)
  type        SupplyType
  description String?    @db.Text
  imageUrl    String?    @map("image_url") @db.VarChar(500)
  price       Decimal?   @db.Decimal(10, 2)
  supplierId  String     @map("supplier_id") @db.Uuid
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")

  supplier        User             @relation(fields: [supplierId], references: [id], onDelete: Cascade)
  contactRequests ContactRequest[]

  @@index([type])
  @@index([supplierId])
  @@map("supplies")
}

model ContactRequest {
  id          String   @id @default(uuid()) @db.Uuid
  supplyId    String   @map("supply_id") @db.Uuid
  requesterId String   @map("requester_id") @db.Uuid
  message     String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at")

  supply    Supply @relation(fields: [supplyId], references: [id], onDelete: Cascade)
  requester User   @relation("ContactRequester", fields: [requesterId], references: [id], onDelete: Cascade)

  @@map("contact_requests")
}

model Notification {
  id          String           @id @default(uuid()) @db.Uuid
  userId      String           @map("user_id") @db.Uuid
  type        NotificationType
  content     String           @db.Text
  isRead      Boolean          @default(false) @map("is_read")
  createdAt   DateTime         @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@map("notifications")
}

model OtpVerification {
  id        String   @id @default(uuid()) @db.Uuid
  phone     String   @db.VarChar(20)
  code      String   @db.VarChar(6)
  attempts  Int      @default(0)
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  @@index([phone, code])
  @@map("otp_verifications")
}
```

### 3.2 Index et performances

| Table | Index | Justification |
|---|---|---|
| `books` | `grade` | Filtre principal dans le mode recherche |
| `books` | `status` | Filtrer les livres disponibles |
| `books` | `owner_id` | "Mes livres proposes" |
| `requests` | `status` | Dashboard admin : filtrer par statut |
| `requests` | `(book_id, requester_id)` UNIQUE | Regle RG-04 : une seule demande active par livre/utilisateur |
| `supplies` | `type` | Filtre par type de fourniture |
| `notifications` | `(user_id, is_read)` | Compteur de notifications non lues |
| `otp_verifications` | `(phone, code)` | Recherche rapide lors de la verification |
| `users` | `phone` UNIQUE | Unicite du numero de telephone (RG-01b) |

### 3.3 Recherche full-text (livres)

Pour la recherche par mot-cle sur titre et auteur, utiliser la recherche full-text PostgreSQL :

```sql
-- Migration manuelle a ajouter apres la migration Prisma initiale
ALTER TABLE books ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('french', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(author, '')), 'B')
  ) STORED;

CREATE INDEX idx_books_search ON books USING GIN (search_vector);
```

Utilisation dans le service :

```typescript
// book.service.ts — recherche par mot-cle
const books = await prisma.$queryRaw`
  SELECT * FROM books
  WHERE search_vector @@ plainto_tsquery('french', ${searchTerm})
  AND status = 'AVAILABLE'
  ORDER BY ts_rank(search_vector, plainto_tsquery('french', ${searchTerm})) DESC
  LIMIT ${limit} OFFSET ${offset}
`;
```

---

## 4. Contrats API detailles

### 4.1 Format de reponse standard

Toutes les reponses suivent ce format :

**Succes :**

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Erreur :**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Donnees invalides",
    "details": [
      { "field": "email", "message": "Format d'email invalide" }
    ]
  }
}
```

### 4.2 Codes d'erreur standardises

| Code | HTTP Status | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Donnees d'entree invalides |
| `UNAUTHORIZED` | 401 | Token manquant ou invalide |
| `FORBIDDEN` | 403 | Action non autorisee pour ce role |
| `NOT_FOUND` | 404 | Ressource introuvable |
| `OTP_EXPIRED` | 400 | Code OTP expire (duree de vie : 5 min) |
| `OTP_INVALID` | 400 | Code OTP incorrect |
| `CONFLICT` | 409 | Conflit (email deja utilise, telephone deja utilise, demande deja existante) |
| `RATE_LIMITED` | 429 | Trop de requetes |
| `INTERNAL_ERROR` | 500 | Erreur serveur interne |

---

### 4.3 Authentification

#### POST `/api/auth/register`

**Request :**

```json
{
  "firstName": "Amadou",
  "lastName": "Diallo",
  "email": "amadou@example.com",
  "password": "MonMotDePasse123!",
  "phone": "+223 70 12 34 56",
  "address": "Bamako, Quartier ACI 2000",
  "gradeInterests": ["6eme", "5eme"]
}
```

**Validation Zod :**

```typescript
const registerSchema = z.object({
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Doit contenir majuscule, minuscule et chiffre"),
  phone: z.string().min(8).max(20),
  address: z.string().min(5).max(500),
  gradeInterests: z.array(z.string()).min(1)
});
```

**Response 201 :**

> Le compte est cree avec `isActive: false`. Un code OTP est envoye par SMS au numero fourni. L'utilisateur doit verifier son numero avant de pouvoir se connecter.

```json
{
  "success": true,
  "data": {
    "message": "Compte cree. Un code de verification a ete envoye au +223 70 ** ** 56.",
    "phone": "+223 70 ** ** 56",
    "expiresIn": 300
  }
}
```

**Response 409 (email ou telephone existant) :**

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Un compte existe deja avec cet email ou ce numero de telephone"
  }
}
```

#### POST `/api/auth/verify-otp`

Verifie le code OTP recu par SMS. Si valide, active le compte et retourne les tokens JWT.

**Request :**

```json
{
  "phone": "+223 70 12 34 56",
  "code": "4837"
}
```

**Regles verifiees par le service :**
- Le code correspond au dernier OTP genere pour ce numero
- Le code n'a pas expire (5 minutes)
- Le nombre de tentatives n'a pas depasse 5 (sinon, le code est invalide et il faut en redemander un)

**Response 200 :**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "a1b2c3d4-...",
      "firstName": "Amadou",
      "lastName": "Diallo",
      "email": "amadou@example.com",
      "role": "USER"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Response 400 (code incorrect) :**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Code incorrect. 3 tentatives restantes.",
    "details": [{ "field": "code", "attemptsLeft": 3 }]
  }
}
```

**Response 400 (code expire) :**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Code expire. Demandez un nouveau code."
  }
}
```

**Response 429 (trop de tentatives) :**

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Trop de tentatives. Demandez un nouveau code dans 15 minutes."
  }
}
```

> **Effet de bord** : apres verification reussie, `isPhoneVerified` passe a `true`, `isActive` passe a `true`, et les entrees OTP pour ce numero sont supprimees.

#### POST `/api/auth/resend-otp`

Renvoie un nouveau code OTP par SMS. Soumis a un cooldown et une limite horaire.

**Request :**

```json
{
  "phone": "+223 70 12 34 56"
}
```

**Regles verifiees par le service :**
- Un compte non verifie existe pour ce numero
- Le dernier OTP a ete envoye il y a plus de 60 secondes (cooldown)
- Moins de 3 OTP envoyes dans la derniere heure pour ce numero

**Response 200 :**

```json
{
  "success": true,
  "data": {
    "message": "Nouveau code envoye au +223 70 ** ** 56.",
    "expiresIn": 300,
    "cooldown": 60
  }
}
```

**Response 429 (cooldown actif) :**

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Veuillez attendre avant de demander un nouveau code.",
    "details": [{ "retryAfter": 45 }]
  }
}
```

#### POST `/api/auth/login`

**Request :**

```json
{
  "email": "amadou@example.com",
  "password": "MonMotDePasse123!"
}
```

**Response 200 :**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "a1b2c3d4-...",
      "firstName": "Amadou",
      "lastName": "Diallo",
      "email": "amadou@example.com",
      "role": "USER"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### POST `/api/auth/refresh`

**Request :**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response 200 :**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### 4.4 Livres

#### GET `/api/books?grade=6eme&condition=USED&search=mathematiques&page=1&limit=20`

**Headers :** `Authorization: Bearer <accessToken>`

**Response 200 :**

```json
{
  "success": true,
  "data": [
    {
      "id": "b1c2d3e4-...",
      "title": "Mathematiques 6eme - Collection CIAM",
      "author": "Collectif CIAM",
      "grade": "6eme",
      "className": "6eme A",
      "condition": "USED",
      "description": "Bon etat, quelques annotations au crayon",
      "imageUrl": "https://res.cloudinary.com/.../w_400,q_auto/books/b1c2d3e4.jpg",
      "status": "AVAILABLE",
      "owner": {
        "id": "a1b2c3d4-...",
        "firstName": "Fatou",
        "lastName": "K."
      },
      "createdAt": "2026-03-15T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

> **Note pour le frontend** : le champ `owner.lastName` est tronque a la premiere lettre pour respecter l'anonymat (RG-09). Le backend ne renvoie jamais le telephone ni l'adresse d'un autre utilisateur.

#### GET `/api/books/:id`

**Response 200 :**

```json
{
  "success": true,
  "data": {
    "id": "b1c2d3e4-...",
    "title": "Mathematiques 6eme - Collection CIAM",
    "author": "Collectif CIAM",
    "grade": "6eme",
    "className": "6eme A",
    "condition": "USED",
    "description": "Bon etat, quelques annotations au crayon. Pages 45-46 legerement cornees.",
    "imageUrl": "https://res.cloudinary.com/.../w_800,q_auto/books/b1c2d3e4.jpg",
    "status": "AVAILABLE",
    "owner": {
      "id": "a1b2c3d4-...",
      "firstName": "Fatou",
      "lastName": "K."
    },
    "createdAt": "2026-03-15T10:30:00Z",
    "hasRequested": false
  }
}
```

> **`hasRequested`** : `true` si l'utilisateur connecte a deja fait une demande pour ce livre. Le frontend utilise ce champ pour desactiver le bouton "Je veux ce livre".

#### POST `/api/books`

**Headers :** `Authorization: Bearer <accessToken>`, `Content-Type: multipart/form-data`

**Request (form-data) :**

| Champ | Type | Valeur |
|---|---|---|
| `title` | text | "Physique-Chimie Terminale S" |
| `author` | text | "Hachette" |
| `grade` | text | "Terminale" |
| `className` | text | "Terminale S" |
| `condition` | text | "NEW" |
| `description` | text | "Jamais utilise, encore emballe" |
| `image` | file | photo.jpg (max 5 Mo, JPG/PNG) |

**Response 201 :**

```json
{
  "success": true,
  "data": {
    "id": "c3d4e5f6-...",
    "title": "Physique-Chimie Terminale S",
    "author": "Hachette",
    "grade": "Terminale",
    "className": "Terminale S",
    "condition": "NEW",
    "description": "Jamais utilise, encore emballe",
    "imageUrl": "https://res.cloudinary.com/.../books/c3d4e5f6.jpg",
    "status": "AVAILABLE",
    "createdAt": "2026-04-13T14:00:00Z"
  }
}
```

#### PUT `/api/books/:id`

Memes champs que POST, tous optionnels. Seul le proprietaire peut modifier.

#### DELETE `/api/books/:id`

Proprietaire ou admin. Supprime aussi l'image sur Cloudinary via `imagePublicId`.

**Response 200 :**

```json
{
  "success": true,
  "data": { "message": "Livre supprime avec succes" }
}
```

#### GET `/api/books/me`

Retourne les livres de l'utilisateur connecte (pas de pagination, limite 100).

---

### 4.5 Demandes

#### POST `/api/requests`

**Request :**

```json
{
  "bookId": "b1c2d3e4-..."
}
```

**Regles verifiees par le service :**
- Le livre existe et son statut est `AVAILABLE` (sinon 400)
- Le demandeur n'est pas le proprietaire (RG-05, sinon 403)
- Le demandeur n'a pas deja une demande active pour ce livre (RG-04, sinon 409)

**Response 201 :**

```json
{
  "success": true,
  "data": {
    "id": "d4e5f6g7-...",
    "bookId": "b1c2d3e4-...",
    "bookTitle": "Mathematiques 6eme - Collection CIAM",
    "status": "PENDING",
    "createdAt": "2026-04-13T15:00:00Z"
  }
}
```

> **Effet de bord** : une notification est creee pour le proprietaire du livre + push FCM envoyee.

#### GET `/api/requests/me`

**Response 200 :**

```json
{
  "success": true,
  "data": [
    {
      "id": "d4e5f6g7-...",
      "status": "PENDING",
      "createdAt": "2026-04-13T15:00:00Z",
      "book": {
        "id": "b1c2d3e4-...",
        "title": "Mathematiques 6eme",
        "imageUrl": "https://res.cloudinary.com/.../w_200,q_auto/books/b1c2d3e4.jpg",
        "grade": "6eme"
      }
    }
  ]
}
```

#### GET `/api/admin/requests?status=PENDING&page=1`

**(Admin uniquement)**

**Response 200 :**

```json
{
  "success": true,
  "data": [
    {
      "id": "d4e5f6g7-...",
      "status": "PENDING",
      "createdAt": "2026-04-13T15:00:00Z",
      "book": {
        "id": "b1c2d3e4-...",
        "title": "Mathematiques 6eme",
        "owner": {
          "id": "a1b2c3d4-...",
          "firstName": "Fatou",
          "lastName": "Diallo",
          "phone": "+223 70 12 34 56",
          "email": "fatou@example.com"
        }
      },
      "requester": {
        "id": "e5f6g7h8-...",
        "firstName": "Amadou",
        "lastName": "Keita",
        "phone": "+223 76 98 76 54",
        "email": "amadou@example.com"
      },
      "adminNotes": null
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 12, "totalPages": 1 }
}
```

> **Note** : l'endpoint admin expose les coordonnees completes des deux parties car l'admin agit comme intermediaire (section 8 du cahier des charges).

#### PUT `/api/admin/requests/:id`

**(Admin uniquement)**

**Request :**

```json
{
  "status": "IN_PROGRESS",
  "adminNotes": "Contact proprietaire effectue, echange prevu samedi"
}
```

**Response 200 :**

```json
{
  "success": true,
  "data": {
    "id": "d4e5f6g7-...",
    "status": "IN_PROGRESS",
    "adminNotes": "Contact proprietaire effectue, echange prevu samedi",
    "updatedAt": "2026-04-13T16:00:00Z"
  }
}
```

> **Effet de bord** : notification envoyee au demandeur pour l'informer du changement de statut.

> **Transition de statut du livre** : quand une demande passe a `ACCEPTED`, le livre passe automatiquement a `RESERVED`. Quand elle passe a `COMPLETED`, le livre passe a `EXCHANGED`.

---

### 4.6 Fournitures

#### GET `/api/supplies?type=NOTEBOOK&page=1&limit=20`

**Response 200 :**

```json
{
  "success": true,
  "data": [
    {
      "id": "f6g7h8i9-...",
      "name": "Cahier 200 pages grands carreaux",
      "type": "NOTEBOOK",
      "description": "Cahier broche, couverture rigide, 200 pages",
      "imageUrl": "https://res.cloudinary.com/.../w_400,q_auto/supplies/f6g7h8i9.jpg",
      "price": 1500.00,
      "supplier": {
        "id": "s1u2p3-...",
        "firstName": "Papeterie",
        "lastName": "Centrale"
      }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 35, "totalPages": 2 }
}
```

#### POST `/api/supplies/:id/contact`

**Request :**

```json
{
  "message": "Bonjour, je souhaite commander 5 cahiers 200 pages pour la rentree"
}
```

**Response 201 :**

```json
{
  "success": true,
  "data": {
    "id": "g7h8i9j0-...",
    "message": "Votre demande a ete transmise au fournisseur",
    "createdAt": "2026-04-13T17:00:00Z"
  }
}
```

---

### 4.7 Notifications

#### GET `/api/notifications?page=1&limit=30`

**Response 200 :**

```json
{
  "success": true,
  "data": [
    {
      "id": "h8i9j0k1-...",
      "type": "BOOK_REQUEST",
      "content": "Amadou D. est interesse par votre livre \"Mathematiques 6eme\"",
      "isRead": false,
      "createdAt": "2026-04-13T15:00:00Z"
    },
    {
      "id": "i9j0k1l2-...",
      "type": "REQUEST_UPDATE",
      "content": "Votre demande pour \"Physique Terminale\" a ete acceptee",
      "isRead": true,
      "createdAt": "2026-04-12T10:00:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 30, "total": 8, "totalPages": 1 }
}
```

#### PUT `/api/notifications/read-all`

**Response 200 :**

```json
{
  "success": true,
  "data": { "updated": 5 }
}
```

---

## 5. Conception UI/UX detaillee

Cette section fournit les specifications necessaires pour creer les maquettes Figma. Chaque ecran est decrit avec sa structure, ses composants et ses etats.

### 5.1 Systeme de design

#### Palette de couleurs

```
THEME CLAIR                          THEME SOMBRE
─────────────────────────────────    ─────────────────────────────────
Primary:      #4A90D9 (bleu)        Primary:      #6BA3E0 (bleu clair)
Primary Dark: #3A7BC8               Primary Dark: #4A90D9
Success:      #5CB85C (vert)        Success:      #6EC96E
Warning:      #F0AD4E (orange)      Warning:      #F0AD4E
Danger:       #D9534F (rouge)       Danger:       #E06B67
Background:   #F5F5F5               Background:   #1A1A2E
Surface:      #FFFFFF               Surface:      #262640
Text Primary: #212121               Text Primary: #E0E0E0
Text Secondary: #757575             Text Secondary: #A0A0A0
Border:       #E0E0E0               Border:       #3A3A5C
```

#### Typographie

```
Famille : Inter (Google Fonts, gratuite)

Titre ecran (H1):   24px, SemiBold (600)
Titre section (H2): 20px, SemiBold (600)
Titre carte (H3):   16px, Medium (500)
Corps de texte:     14px, Regular (400)
Caption / label:    12px, Regular (400)
Bouton:             14px, SemiBold (600)
```

#### Grille et espacement

```
Systeme de base : 8px

xs:  4px   (espacement minimal, padding interne dense)
sm:  8px   (espacement entre elements proches)
md:  16px  (padding standard des cartes, marges entre composants)
lg:  24px  (marge entre sections)
xl:  32px  (marge externe ecran)

Coins arrondis :
- Boutons :     8px
- Cartes :      12px
- Champs input: 8px
- Avatars :     50% (cercle)

Largeur max contenu : 100% - 32px (16px de marge de chaque cote)
```

#### Composants communs

| Composant | Specs |
|---|---|
| **Button (primary)** | Hauteur 48px, fond Primary, texte blanc, bold, coins 8px, ombre legere |
| **Button (secondary)** | Hauteur 48px, fond transparent, bordure Primary, texte Primary |
| **Input** | Hauteur 48px, bordure 1px Border, coins 8px, padding horizontal 16px, label au-dessus 12px |
| **Card** | Fond Surface, coins 12px, ombre `0 2px 8px rgba(0,0,0,0.08)`, padding 16px |
| **Badge** | Hauteur 24px, coins 12px, fond couleur, texte blanc 12px bold |
| **Tab Bar** | Hauteur 56px, 4 icones (28px) + labels (10px), indicateur actif Primary |
| **EmptyState** | Illustration centree (120x120), titre H2, sous-titre corps, bouton CTA |
| **OtpInput** | 4 champs de 48x48px, bordure 2px, coins 8px, espacement 12px, auto-focus champ suivant, texte 24px bold centre |

---

### 5.2 Ecrans detailles

#### 5.2.1 Splash Screen

```
┌──────────────────────────────┐
│                              │
│                              │
│                              │
│         [Logo App]           │
│         120 x 120            │
│                              │
│       "Nom de l'App"         │
│        H1, Primary           │
│                              │
│     [Barre de chargement]    │
│                              │
│                              │
│                              │
└──────────────────────────────┘
```

- Duree : 2 secondes max
- Fond : Primary ou blanc selon le theme
- Redirect : vers Onboarding (premiere fois) ou Login/Home

#### 5.2.2 Onboarding (3 slides swipables)

```
┌──────────────────────────────┐
│                              │
│      [Illustration]          │
│       240 x 240              │
│                              │
│   "Trouvez vos livres"       │  Slide 1: Recherche
│   "Echangez facilement       │  Slide 2: Echange
│    vos anciens livres"       │  Slide 3: Fournitures
│                              │
│   "Description courte du"    │
│   "fonctionnement"           │
│                              │
│        ● ○ ○                 │  Indicateur de page
│                              │
│   [    Suivant    ]          │  Bouton primary
│   [    Passer     ]          │  Lien texte discret
│                              │
└──────────────────────────────┘
```

#### 5.2.3 Connexion

```
┌──────────────────────────────┐
│                              │
│         [Logo App]           │
│          80 x 80             │
│                              │
│      "Connexion"  H1         │
│                              │
│  Email                       │
│  ┌────────────────────────┐  │
│  │ amadou@example.com     │  │
│  └────────────────────────┘  │
│                              │
│  Mot de passe                │
│  ┌────────────────────────┐  │
│  │ ●●●●●●●●        [eye] │  │  Toggle visibilite
│  └────────────────────────┘  │
│                              │
│  "Mot de passe oublie ?"     │  Lien aligne a droite
│                              │
│  [    Se connecter    ]      │  Bouton primary pleine largeur
│                              │
│  "Pas encore de compte ?"    │
│  "Inscrivez-vous"            │  Lien vers inscription
│                              │
└──────────────────────────────┘
```

**Etats :**
- **Chargement** : bouton desactive, spinner a l'interieur
- **Erreur** : champ en rouge, message sous le champ
- **Erreur globale** : bandeau rouge en haut "Identifiants incorrects"

#### 5.2.4 Inscription

```
┌──────────────────────────────┐
│  [←]     "Inscription"       │  Header avec retour
│──────────────────────────────│
│                              │  ScrollView
│  Prenom                      │
│  ┌────────────────────────┐  │
│  │                        │  │
│  └────────────────────────┘  │
│  Nom                         │
│  ┌────────────────────────┐  │
│  │                        │  │
│  └────────────────────────┘  │
│  Email                       │
│  ┌────────────────────────┐  │
│  │                        │  │
│  └────────────────────────┘  │
│  Telephone                   │
│  ┌────────────────────────┐  │
│  │ +223                   │  │  Prefixe pays par defaut
│  └────────────────────────┘  │
│  Adresse                     │
│  ┌────────────────────────┐  │
│  │                        │  │
│  └────────────────────────┘  │
│  Mot de passe                │
│  ┌────────────────────────┐  │
│  │                  [eye] │  │
│  └────────────────────────┘  │
│  Force: [████░░░░] Moyen     │  Indicateur force mdp
│                              │
│  Niveaux scolaires           │
│  ┌──────┐ ┌──────┐ ┌──────┐ │
│  │ CP   │ │ CE1  │ │ CE2  │ │  Chips selectionnables
│  └──────┘ └──────┘ └──────┘ │  (multi-selection)
│  ┌──────┐ ┌──────┐ ┌──────┐ │
│  │ 6eme │ │ 5eme │ │ 4eme │ │
│  └──────┘ └──────┘ └──────┘ │
│  ... (autres niveaux)        │
│                              │
│  [    S'inscrire     ]       │
│                              │
│  "Deja un compte ?"         │
│  "Connectez-vous"            │
└──────────────────────────────┘
```

#### 5.2.5 Verification OTP

```
┌──────────────────────────────┐
│  [←]     "Verification"      │  Header avec retour
│──────────────────────────────│
│                              │
│                              │
│      [Icone SMS/Phone]       │
│         64 x 64              │
│                              │
│   "Entrez le code recu"  H1 │
│                              │
│   "Un code a 4 chiffres a   │
│    ete envoye au"            │
│   "+223 70 ** ** 56"  bold   │  Numero masque
│                              │
│   ┌────┐ ┌────┐ ┌────┐ ┌────┐
│   │  4 │ │  8 │ │  3 │ │  _ │  4 champs individuels
│   └────┘ └────┘ └────┘ └────┘  Auto-focus sur le suivant
│                              │
│   Expire dans 4:32           │  Compte a rebours (5 min)
│                              │
│   [    Verifier     ]        │  Bouton primary
│                              │
│   "Vous n'avez pas recu"    │
│   "le code ?"               │
│   "Renvoyer le code"         │  Lien (grise pendant cooldown)
│   Disponible dans 0:45       │  Cooldown 60s visible
│                              │
└──────────────────────────────┘
```

**Etats :**
- **Saisie en cours** : chaque chiffre saisi passe au champ suivant automatiquement
- **Verification** : bouton desactive + spinner apres saisie des 4 chiffres
- **Code incorrect** : champs passent en rouge, shake animation, message "Code incorrect. X tentatives restantes."
- **Code expire** : message "Code expire" + le lien "Renvoyer" devient actif
- **Cooldown renvoi** : le lien "Renvoyer le code" est grise avec un compte a rebours (60s)
- **Trop de tentatives** : message "Trop de tentatives" + timer avant de pouvoir redemander
- **Succes** : animation check vert, redirect automatique vers l'accueil

#### 5.2.6 Accueil — Mode "Je recherche un livre"

```
┌──────────────────────────────┐
│  "Bonjour, Amadou"    [🔔3]  │  Header + badge notifs
│──────────────────────────────│
│                              │
│  ┌─────────────┬────────────┐│
│  │ Je recherche│ J'ai un    ││  Toggle switch
│  │  ██████████ │ livre      ││  (actif = fond Primary)
│  └─────────────┴────────────┘│
│                              │
│  ┌────────────────────────┐  │
│  │ 🔍 Rechercher un livre │  │  Barre de recherche
│  └────────────────────────┘  │
│                              │
│  ┌──────┐┌──────┐┌────────┐ │
│  │Niveau││ Etat ││ Classe │ │  Filtres (chips / dropdown)
│  └──────┘└──────┘└────────┘ │
│                              │
│  45 livres disponibles       │  Compteur resultats
│                              │
│  ┌────────────────────────┐  │
│  │ [Photo]  Maths 6eme    │  │  BookCard
│  │  80x80   CIAM          │  │
│  │          6eme | Occasion│  │
│  │          Il y a 2 jours│  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ [Photo]  Physique Term │  │  BookCard
│  │  80x80   Hachette      │  │
│  │          Term S | Neuf  │  │
│  │          Il y a 5 jours│  │
│  └────────────────────────┘  │
│  ... (FlatList avec pull     │
│       to refresh)            │
│                              │
│──────────────────────────────│
│  [🏠]    [📦]    [🔔]  [👤] │  Tab Bar
│  Accueil  Fourn  Notif  Profil│
└──────────────────────────────┘
```

**Etats de l'ecran :**
- **Chargement initial** : skeleton cards (3 placeholders animes)
- **Liste vide** : EmptyState "Aucun livre trouve" + suggestion elargir filtres
- **Erreur reseau** : Message + bouton "Reessayer"
- **Pull to refresh** : spinner en haut de la liste

#### 5.2.7 Accueil — Mode "J'ai un livre"

```
┌──────────────────────────────┐
│  "Bonjour, Amadou"    [🔔3]  │
│──────────────────────────────│
│                              │
│  ┌─────────────┬────────────┐│
│  │ Je recherche│ J'ai un    ││
│  │             │ ██████████ ││  Toggle bascule
│  └─────────────┴────────────┘│
│                              │
│  "Mes livres proposes"       │  Titre section
│                              │
│  ┌────────────────────────┐  │
│  │ [Photo]  Maths 6eme    │  │
│  │  80x80   ● Disponible  │  │  Badge vert
│  │          2 demandes     │  │  Compteur demandes
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ [Photo]  Francais 5eme │  │
│  │  80x80   ● Reserve     │  │  Badge orange
│  │          1 demande      │  │
│  └────────────────────────┘  │
│                              │
│  [  + Ajouter un livre  ]    │  Bouton primary
│                              │
│──────────────────────────────│
│  [🏠]    [📦]    [🔔]  [👤] │
└──────────────────────────────┘
```

**Etat vide :**

```
┌────────────────────────────┐
│                            │
│      [Illustration]        │
│       livres empiles       │
│                            │
│  "Aucun livre propose"     │
│  "Partagez vos anciens     │
│   livres avec d'autres     │
│   eleves !"                │
│                            │
│  [  + Ajouter un livre  ]  │
│                            │
└────────────────────────────┘
```

#### 5.2.8 Detail d'un livre

```
┌──────────────────────────────┐
│  [←]                 [...]   │  Header + menu options
│──────────────────────────────│
│                              │
│  ┌────────────────────────┐  │
│  │                        │  │
│  │     [Photo du livre]   │  │  Image pleine largeur
│  │      ratio 4:3         │  │  Cloudinary w_800,q_auto
│  │      coins arrondis    │  │
│  │                        │  │
│  └────────────────────────┘  │
│                              │
│  "Mathematiques 6eme"    H1  │
│  "Collection CIAM"       H3  │  Auteur en gris
│                              │
│  ┌────────┐  ┌───────────┐  │
│  │ 6eme   │  │ Occasion  │  │  Badges
│  └────────┘  └───────────┘  │
│                              │
│  "Description"           H2  │
│  "Bon etat, quelques        │
│   annotations au crayon.    │
│   Pages 45-46 legerement    │
│   cornees."                  │
│                              │
│  Propose par : Fatou K.      │  Prenom + initiale nom
│  Publie il y a 2 jours      │
│                              │
│                              │
│  [ Je veux ce livre ]        │  Bouton primary fixe en bas
│                              │
└──────────────────────────────┘
```

**Etats du bouton :**
- **Normal** : "Je veux ce livre" (bleu)
- **Deja demande** : "Demande envoyee ✓" (gris, desactive)
- **Mon propre livre** : bouton absent, afficher "Modifier" et "Supprimer" dans le menu [...]
- **Livre reserve/echange** : "Ce livre n'est plus disponible" (gris, desactive)

**Modale de confirmation apres clic :**

```
┌────────────────────────────┐
│                            │
│  "Confirmer la demande ?"  │
│                            │
│  "L'equipe vous mettra en  │
│   contact avec le          │
│   proprietaire."           │
│                            │
│  [Annuler]  [Confirmer]    │
│                            │
└────────────────────────────┘
```

#### 5.2.9 Formulaire d'ajout de livre

```
┌──────────────────────────────┐
│  [←]   "Ajouter un livre"   │
│──────────────────────────────│
│                              │  ScrollView
│  ┌────────────────────────┐  │
│  │                        │  │
│  │   [+]                  │  │  Zone photo
│  │   "Ajouter une photo"  │  │  Tap → ImagePicker
│  │   de couverture        │  │  (camera ou galerie)
│  │                        │  │
│  └────────────────────────┘  │
│                              │
│  Titre *                     │
│  ┌────────────────────────┐  │
│  │                        │  │
│  └────────────────────────┘  │
│                              │
│  Auteur                      │
│  ┌────────────────────────┐  │
│  │                        │  │
│  └────────────────────────┘  │
│                              │
│  Niveau scolaire *           │
│  ┌────────────────────────┐  │
│  │ Selectionner...      ▼ │  │  Dropdown
│  └────────────────────────┘  │
│                              │
│  Classe                      │
│  ┌────────────────────────┐  │
│  │                        │  │
│  └────────────────────────┘  │
│                              │
│  Etat *                      │
│  ┌────────────┐┌────────────┐│
│  │   ○ Neuf   ││ ● Occasion ││  Radio buttons
│  └────────────┘└────────────┘│
│                              │
│  Description                 │
│  ┌────────────────────────┐  │
│  │                        │  │  TextArea, 4 lignes
│  │                        │  │
│  │                        │  │
│  └────────────────────────┘  │
│                              │
│  [   Publier mon livre   ]   │
│                              │
└──────────────────────────────┘
```

**Validation temps reel :**
- Photo : obligatoire, afficher preview apres selection
- Titre : min 3 caracteres
- Niveau : obligatoire
- Etat : obligatoire
- Le bouton reste desactive tant que les champs requis (*) ne sont pas remplis

#### 5.2.10 Fournitures scolaires

```
┌──────────────────────────────┐
│  "Fournitures scolaires"     │
│──────────────────────────────│
│                              │
│  ┌──────┐┌──────┐┌────────┐ │
│  │ Tous ││Cahier││ Stylos │ │  Filtres horizontaux
│  └──────┘└──────┘└────────┘ │  scrollables
│  ┌──────┐┌──────┐           │
│  │ Sacs ││Autres│           │
│  └──────┘└──────┘           │
│                              │
│  ┌────────────────────────┐  │
│  │ [Photo]  Cahier 200p   │  │  SupplyCard
│  │  80x80   Grands carreaux│ │
│  │          1 500 FCFA     │  │
│  │          Papeterie C.   │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ [Photo]  Sac a dos     │  │
│  │  80x80   Marque XYZ    │  │
│  │          12 000 FCFA    │  │
│  │          FourniPlus     │  │
│  └────────────────────────┘  │
│  ...                         │
│                              │
│──────────────────────────────│
│  [🏠]    [📦]    [🔔]  [👤] │
└──────────────────────────────┘
```

#### 5.2.11 Notifications

```
┌──────────────────────────────┐
│  "Notifications"  [Tout lire]│
│──────────────────────────────│
│                              │
│  ┌────────────────────────┐  │
│  │ ● Amadou D. est        │  │  Non lue (point bleu)
│  │   interesse par votre  │  │
│  │   livre "Maths 6eme"  │  │
│  │   Il y a 2 heures      │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │   Votre demande pour   │  │  Lue (pas de point)
│  │   "Physique Term" a    │  │
│  │   ete acceptee         │  │
│  │   Hier                  │  │
│  └────────────────────────┘  │
│  ...                         │
│                              │
│──────────────────────────────│
│  [🏠]    [📦]    [🔔]  [👤] │
└──────────────────────────────┘
```

**Interactions :**
- Tap sur une notification de type `BOOK_REQUEST` → navigue vers le detail du livre
- Tap sur `REQUEST_UPDATE` → navigue vers "Mes demandes"
- Swipe gauche → supprimer la notification

#### 5.2.12 Profil

```
┌──────────────────────────────┐
│  "Mon profil"        [gear]  │  Gear → Parametres
│──────────────────────────────│
│                              │
│        [Avatar]              │  Initiales dans un cercle
│         64x64                │  colore (genere cote client)
│                              │
│     "Amadou Diallo"          │
│     amadou@example.com       │
│                              │
│  ┌────────────────────────┐  │
│  │ 📖 Mes livres        → │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ 📋 Mes demandes       → │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ ✏️ Modifier mon profil→ │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ 🌙 Theme sombre     [○]│  │  Toggle switch
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ 🔔 Notifications    [●]│  │  Toggle switch
│  └────────────────────────┘  │
│                              │
│  [   Se deconnecter   ]      │  Bouton secondary rouge
│                              │
│──────────────────────────────│
│  [🏠]    [📦]    [🔔]  [👤] │
└──────────────────────────────┘
```

---

### 5.3 Flux de navigation complet

```
App Launch
    │
    ├── [Premiere ouverture] → Onboarding → Login
    │
    ├── [Token valide] → (tabs)/home
    │
    └── [Pas de token] → (auth)/login
                            │
                            ├── "S'inscrire" → (auth)/register → (auth)/verify-otp → Compte active → (tabs)/home
                            │
                            ├── "Mot de passe oublie" → (auth)/forgot-password
                            │
                            └── Login success → (tabs)/home


(tabs) Navigation :
    │
    ├── Accueil (/home)
    │     ├── Mode recherche
    │     │     └── Tap carte → /home/book/[id]
    │     │           └── "Je veux ce livre" → Modale confirmation → POST /api/requests
    │     └── Mode "J'ai un livre"
    │           ├── Tap carte → /home/book/[id] (mode proprietaire)
    │           └── "+ Ajouter" → /home/add-book → POST /api/books
    │
    ├── Fournitures (/supplies)
    │     └── Tap carte → /supplies/[id]
    │           └── "Contacter le fournisseur" → Modale message → POST /api/supplies/:id/contact
    │
    ├── Notifications (/notifications)
    │     ├── Tap notif BOOK_REQUEST → /home/book/[id]
    │     └── Tap notif REQUEST_UPDATE → /profile/my-requests
    │
    └── Profil (/profile)
          ├── "Mes livres" → /profile/my-books → Tap → /home/book/[id]
          ├── "Mes demandes" → /profile/my-requests
          ├── "Modifier profil" → /profile/edit
          └── "Se deconnecter" → Confirmation → (auth)/login
```

---

## 6. Gestion des images (Cloudinary)

### 6.1 Flux d'upload

```
Mobile (ImagePicker)                Backend                    Cloudinary
       │                              │                           │
       │  POST /api/books             │                           │
       │  (multipart/form-data)       │                           │
       │──────────────────────────────>│                           │
       │                              │  upload(buffer, options)  │
       │                              │──────────────────────────>│
       │                              │                           │
       │                              │  { url, public_id }       │
       │                              │<──────────────────────────│
       │                              │                           │
       │                              │  Save to PostgreSQL       │
       │                              │  (imageUrl + publicId)    │
       │                              │                           │
       │  Response { imageUrl }       │                           │
       │<─────────────────────────────│                           │
```

### 6.2 Configuration d'upload

```typescript
// utils/cloudinary.ts
const uploadOptions = {
  folder: "bookswap/books",        // ou "bookswap/supplies"
  transformation: [
    { width: 1200, height: 1600, crop: "limit" },  // Max resolution
    { quality: "auto:good" },                        // Compression auto
    { fetch_format: "auto" }                         // WebP si supporte
  ],
  allowed_formats: ["jpg", "jpeg", "png"],
  max_bytes: 5 * 1024 * 1024       // 5 Mo
};
```

### 6.3 URLs de transformation pour le frontend

Le frontend utilise les transformations Cloudinary dans l'URL pour adapter les images au contexte :

| Contexte | Transformation URL | Dimensions |
|---|---|---|
| **Miniature (liste)** | `/w_200,h_200,c_fill,q_auto/` | 200x200 |
| **Carte (recherche)** | `/w_400,h_300,c_fill,q_auto/` | 400x300 |
| **Detail (plein ecran)** | `/w_800,q_auto/` | 800px largeur max |
| **Placeholder (loading)** | `/w_40,h_40,c_fill,q_10,e_blur:1000/` | 40x40 blurre |

---

## 7. Notifications push (FCM)

### 7.1 Flux

```
Evenement declencheur                    Actions
────────────────────                     ───────
Nouvelle demande sur un livre     →  Notif au proprietaire
Changement statut demande         →  Notif au demandeur
Demande contact fournisseur       →  Notif au fournisseur
Message systeme (maintenance...)  →  Notif broadcast
```

### 7.2 Implementation

Le token FCM du device est stocke cote serveur lors du login :

```
POST /api/auth/login → Response inclut le user
Mobile stocke le FCM token et l'envoie : PUT /api/users/me { fcmToken: "..." }
```

Cote backend, le service de notification :
1. Cree l'entree dans la table `notifications` (pour affichage in-app)
2. Envoie le push via Firebase Admin SDK (pour la notification systeme)

---

## 8. Gestion des erreurs

### 8.1 Backend — Classe AppError

```typescript
class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    public message: string,
    public details?: any[]
  ) {
    super(message);
  }
}

// Utilisation dans un service
throw new AppError(404, "NOT_FOUND", "Livre introuvable");
throw new AppError(409, "CONFLICT", "Vous avez deja fait une demande pour ce livre");
throw new AppError(403, "FORBIDDEN", "Vous ne pouvez pas demander votre propre livre");
```

### 8.2 Frontend — Gestion centralisee

```typescript
// services/api.ts — Intercepteur Axios
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token expire → tenter refresh → sinon redirect login
    }
    // Propager l'erreur formatee
    return Promise.reject(error.response?.data?.error || { message: "Erreur reseau" });
  }
);
```

### 8.3 Etats d'erreur UI

| Situation | Affichage |
|---|---|
| Erreur reseau (pas d'internet) | Bandeau persistant en haut "Pas de connexion internet" |
| Erreur 500 (serveur) | Ecran d'erreur avec bouton "Reessayer" |
| Erreur 401 (token expire) | Redirect silencieux vers login |
| Erreur 403 (action interdite) | Toast "Action non autorisee" |
| Erreur 404 (ressource supprimee) | Ecran "Contenu introuvable" avec bouton retour |
| Erreur 409 (conflit) | Toast avec message specifique |
| Erreur 429 (rate limit) | Toast "Trop de requetes, reessayez dans un instant" |
| Erreur de validation (400) | Messages sous les champs concernes |

---

## 9. Securite

### 9.1 Tokens JWT

| Token | Duree | Stockage mobile | Contenu du payload |
|---|---|---|---|
| Access token | 15 minutes | SecureStore (Expo) | `{ userId, role, iat, exp }` |
| Refresh token | 7 jours | SecureStore (Expo) | `{ userId, tokenVersion, iat, exp }` |

Le `tokenVersion` dans le refresh token permet l'invalidation : si un admin bloque un utilisateur, on incremente son `tokenVersion` en base, ce qui invalide tous ses refresh tokens existants.

### 9.2 Rate limiting

| Endpoint | Limite | Fenetre |
|---|---|---|
| `POST /api/auth/login` | 5 requetes | 1 minute |
| `POST /api/auth/register` | 3 requetes | 10 minutes |
| `POST /api/auth/verify-otp` | 5 requetes | 15 minutes (par numero) |
| `POST /api/auth/resend-otp` | 3 requetes | 1 heure (par numero), cooldown 60s entre chaque |
| `POST /api/books` | 10 requetes | 1 heure |
| `POST /api/requests` | 20 requetes | 1 heure |
| Global (toutes routes) | 100 requetes | 1 minute |

### 9.3 Validation des uploads

```typescript
// middleware/upload.ts
const uploadConfig = {
  limits: { fileSize: 5 * 1024 * 1024 },    // 5 Mo max
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(file.mimetype)) {
      cb(new AppError(400, "VALIDATION_ERROR", "Format d'image invalide (JPG/PNG uniquement)"));
    }
    cb(null, true);
  }
};
```

---

## 10. Strategie de deploiement

### 10.1 Environnements

| Environnement | Usage | Hebergement |
|---|---|---|
| **Development** | Dev local | localhost:3000 (API), Expo Go (mobile) |
| **Staging** | Tests equipe, validation | Render (free tier) |
| **Production** | Utilisateurs finaux | Railway |

### 10.2 Variables d'environnement requises

```
# Base de donnees
DATABASE_URL=postgresql://user:pass@host:5432/bookswap

# JWT
JWT_ACCESS_SECRET=<random 64 chars>
JWT_REFRESH_SECRET=<random 64 chars>

# Cloudinary
CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>

# Firebase
FIREBASE_PROJECT_ID=<project_id>
FIREBASE_PRIVATE_KEY=<private_key>
FIREBASE_CLIENT_EMAIL=<client_email>

# Africa's Talking (SMS OTP)
AT_API_KEY=<api_key>
AT_USERNAME=<username>
AT_SENDER_ID=<sender_id>

# App
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://admin.bookswap.com
```

### 10.3 Pipeline de deploiement

```
git push (branche main)
    │
    ▼
CI (GitHub Actions)
    │
    ├── npm run lint
    ├── npm run build
    ├── npm run test
    │
    ▼
Deploy automatique
    ├── [staging] → Render (auto-deploy depuis branche develop)
    └── [production] → Railway (auto-deploy depuis branche main)
```

### 10.4 Migration de base de donnees

```bash
# En dev
npx prisma migrate dev --name nom_de_la_migration

# En staging/production (applique les migrations existantes)
npx prisma migrate deploy
```

---

## 11. Recapitulatif pour les equipes

### Pour l'equipe frontend / design

1. **Maquettes Figma** : s'appuyer sur les wireframes de la section 5 et le systeme de design (couleurs, typo, espacement)
2. **Composants a concevoir en priorite** : BookCard, ModeSwitch, BookFilters, EmptyState, formulaire d'ajout
3. **Etats a maquetter pour chaque ecran** : chargement (skeleton), vide, erreur, succes
4. **Navigation** : 4 onglets en tab bar, Expo Router file-based

### Pour l'equipe backend

1. **Demarrer par** : setup Prisma + migration initiale, module auth (register/login/refresh)
2. **Puis** : module livres (CRUD + filtres + upload Cloudinary), module demandes
3. **Ensuite** : module fournitures, notifications FCM
4. **En parallele** : middleware de securite, validation Zod, error handler

### Ordre d'implementation recommande

| Semaine | Backend | Frontend |
|---|---|---|
| 1 | Setup projet, Prisma, module Auth | Setup Expo, ecrans Auth, store Zustand |
| 2 | Module Livres (CRUD, filtres, upload) | Ecrans recherche, detail livre, ajout livre |
| 3 | Module Demandes, Notifications DB | Mode switch, demandes, notifications in-app |
| 4 | Module Fournitures, FCM push | Ecrans fournitures, notifications push |
| 5 | Admin endpoints, securite | Profil, parametres, theme sombre |
| 6 | Tests, optimisation, bug fixes | Tests UI, polish, corrections |
