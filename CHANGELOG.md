# Changelog

Tous les changements notables du projet BookSwap sont documentes dans ce fichier.

Le format est base sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
et le projet suit une versioning [SemVer](https://semver.org/lang/fr/).

## [Non publie]

### Ajouts

- **Stack Docker Compose complete (Postgres + API)** avec hot reload. Le
  service `api` utilise un nouveau [Dockerfile.dev](server/Dockerfile.dev)
  minimal (juste `openssl` pour Prisma) et bind-mounte le source et les
  `node_modules` de l'hote — pas de `npm ci` dans le conteneur, ce qui rend
  le build instantane et robuste meme sur reseau lent/flaky.

### Modifie

- **Dockerfile (production)** : nettoyage et ajout de `openssl` +
  `ca-certificates` dans l'image runtime pour que la detection de version
  OpenSSL des engines Prisma fonctionne sur `bookworm-slim`. Sans le binaire
  `openssl`, Prisma tombait silencieusement sur le mauvais binaire d'engine.

## [0.1.0] — 2026-04-17

Premiere version de l'API backend BookSwap. Couvre l'ensemble des regles de gestion
du cahier des charges et comprend le scaffolding CI/CD, les tests d'integration et
les hooks Git.

### Ajouts

#### API backend

- Scaffolding Express 4 + TypeScript 5.7 + Prisma 6 + PostgreSQL 16.
- Schema Prisma : 8 modeles (User, Book, Request, Supply, ContactRequest,
  Notification, OtpVerification, RefreshToken) et 6 enums.
- Module **auth** : inscription avec OTP SMS, verification, connexion, renvoi OTP,
  refresh token avec rotation automatique et detection de replay, logout,
  forgot-password et reset-password (reponse opaque), change-password.
- Module **user** : profil complet, edition, suppression compte (verification
  mot de passe), profil public tronque, routes admin (liste, blocage, stats).
- Module **book** : CRUD avec upload Cloudinary (JPEG/PNG, 5 Mo), recherche
  full-text francaise (tsvector + index GIN), index composite
  `(status, grade, condition)`, listing des demandes recues (proprietaire).
- Module **request** : creation avec regles RG-04 (unicite `[bookId, requesterId]`)
  et RG-05 (interdiction de demander son propre livre), annulation (PENDING
  uniquement), transitions de statut controlees cote admin, effets de bord
  automatiques (ACCEPTED -> livre RESERVED, COMPLETED -> livre EXCHANGED).
- Module **supply** : listing filtre par type, contact fournisseur.
- Module **notification** : liste paginee, compteur non-lues, marquage unitaire
  et global, push Firebase Cloud Messaging.
- Module **admin** : statistiques globales, gestion utilisateurs, transitions
  de demandes.
- Health checks `/api/health` (basique) et `/api/health/ready` (teste PostgreSQL).
- Documentation Swagger UI sur `/api/docs` (28 endpoints decrits, spec JSON sur
  `/api/docs.json`).

#### Securite et durcissement

- Hashage bcrypt (12 rounds) pour les mots de passe.
- JWT access token 15 min + refresh token 7 j stocke en base (hash SHA-256)
  avec rotation a chaque utilisation.
- `tokenVersion` sur User pour revoquer globalement (blocage, changement de
  mot de passe).
- Detection de replay : reutilisation d'un ancien refresh token -> revocation
  de tous les tokens de l'utilisateur.
- Validation UUID sur tous les parametres `:id` des routes.
- Validation Zod sur toutes les entrees (body, query, params).
- Rate limiting global (100 req/min) + par endpoint (register, login, OTP).
- `helmet` + `compression` + CORS configurable.
- Upload memoire Multer (pas de fichier temporaire).
- Profils publics : nom de famille tronque, pas de telephone ni adresse.

#### Observabilite

- Logging structure `pino` + `pino-pretty` en dev, JSON en prod.
- Middleware `pino-http` avec correlation `x-request-id` (reutilise l'entete
  entrant ou genere un UUID).
- Graceful shutdown : gestion SIGTERM/SIGINT, fermeture du serveur HTTP puis
  deconnexion Prisma, timeout de 10 s force-exit.
- Integration **Sentry** optionnelle (active seulement si `SENTRY_DSN` defini).

#### Tests

- Setup Vitest 4 + Supertest avec base de test dediee.
- 13 tests d'integration auth (register, verify-otp, login, refresh rotation
  + replay, logout).
- 21 tests d'integration request (POST avec RG-04/RG-05, transitions admin,
  effets de bord sur le livre, GET/DELETE, endpoint livres-demandes).
- 34 tests, 100 % passants.

#### Outillage et DX

- Configuration ESLint 8 + Prettier.
- Husky 9 + lint-staged 15 + `@commitlint/config-conventional` (Conventional
  Commits obligatoires).
- GitHub Actions CI : lint, typecheck, prisma validate, vitest.
- `npm run check` (lint + typecheck + tests) en un seul script.
- `Dockerfile` multi-stage prod-ready : utilisateur non-root, `dumb-init`
  comme PID 1 pour propager SIGTERM, `HEALTHCHECK` wget,
  `prisma migrate deploy` au demarrage.
- `docker-compose.yml` pour le dev local (Postgres + API).
- Script `prisma:seed` : 1 admin, 2 fournisseurs, 5 utilisateurs, 10 livres,
  3 demandes, 4 fournitures (mot de passe par defaut `Password123!`).
- Badges CI/Node/License et diagramme d'architecture Mermaid dans le README.

### Corrections

- `generateRefreshToken` ajoute un `jti` UUID a chaque signature, evitant que
  deux rotations rapprochees produisent des tokens identiques (precision
  seconde du champ `iat`).
- ESLint v10 retrograde en v8 (version stable compatible avec la config).
- Variables `DATABASE_URL` factices fournies a l'etape `prisma validate` du CI.
- SMS Africa's Talking : envoi conditionne au senderId valide pour eviter les
  erreurs en dev.
- Hook `lint-staged` corrige pour transmettre les fichiers stages a
  `eslint`/`prettier` (precedemment executes sans arguments).
