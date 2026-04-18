# Cahier de Conception — Frontend Mobile BookSwap

> Document de conception detaillee pour l'application mobile React Native /
> Expo de BookSwap. Complemente le [Cahier de Conception](CAHIER_CONCEPTION.md)
> qui couvre le backend, en se concentrant exclusivement sur le client mobile.

---

## 1. Introduction

### 1.1 Objet du document

Ce cahier traduit les exigences UX (cf. [maquettes.html](maquettes.html), 12
ecrans interactifs) et les contrats API (cf. [Cahier de Conception §4](CAHIER_CONCEPTION.md))
en specifications techniques implementables pour l'app mobile.

Il couvre :
- Architecture client (couches, gestion d'etat, navigation)
- Structure du code (Expo Router file-based)
- Specifications par ecran (donnees, actions, etats UI)
- Strategies transverses (auth, cache, erreurs, offline-tolerance)
- Plan de tests et procedure de build

### 1.2 Stack retenue

| Couche | Technologie | Justification |
|---|---|---|
| Runtime | Expo SDK 52+ (managed workflow) | Builds cloud via EAS, pas de Xcode/Android Studio requis pour le dev |
| Langage | TypeScript 5+ strict | Coherence avec le backend, type-safety des contrats API |
| Routing | Expo Router v4 (file-based) | Routes type-safe, deep linking gratuit, layout partages |
| Networking | TanStack Query v5 + fetch natif | Cache/refetch/retry/polling integres, pas besoin de Redux pour les donnees serveur |
| Auth state | React Context (`AuthContext`) | Etat global limite et simple, pas de surcouche |
| Tokens | expo-secure-store (refresh) + memoire (access) | Refresh chiffre via Keychain/Keystore, access volatile |
| Forms | react-hook-form + Zod | Validation declarative, schemas reutilisables |
| UI | Composants natifs RN + design system maison | Pas de lib UI lourde (Tamagui/NativeBase), suit la maquette pixel-perfect |
| Images | expo-image (cache) + expo-image-picker (selection) | Performances superieures au composant Image natif |
| Notifs push | expo-notifications | Compatible Expo Go (preview) et build EAS (prod) |
| Tests unitaires | Jest + @testing-library/react-native | Standard Expo |
| Tests E2E | (post-MVP) Maestro ou Detox | Nice-to-have, pas critique pour la demo |
| Lint/format | ESLint + Prettier (config alignee sur le back) | Coherence repo |

### 1.3 Hors-scope

- **Mode hors-ligne complet** : pas de queue de mutations offline. Lecture cachee via TanStack Query, mais les mutations exigent le reseau.
- **Internationalisation** : application en francais uniquement (cible Senegal).
- **Themes clair/sombre** : un seul theme (clair) pour le MVP, conformement aux maquettes.
- **Accessibilite avancee** : labels accessibilite presents (a11y), mais pas d'audit complet WCAG dans le MVP.
- **Animations elaborees** : transitions de navigation par defaut Expo Router, pas de Reanimated complexe.

---

## 2. Architecture detaillee

### 2.1 Vue d'ensemble

```
┌──────────────────────────────────────────────────────────────┐
│                  App Mobile (React Native)                   │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Couche Presentation (app/ — Expo Router)              │  │
│  │  Ecrans + layouts, consomment des hooks                │  │
│  └────────────────────┬───────────────────────────────────┘  │
│                       │                                      │
│  ┌────────────────────▼───────────────────────────────────┐  │
│  │  Couche Hooks (src/hooks/)                             │  │
│  │  useBooks, useRequests, useAuth, useNotifications…     │  │
│  │  Wrappent TanStack Query pour cache + refetch          │  │
│  └────────────────────┬───────────────────────────────────┘  │
│                       │                                      │
│  ┌────────────────────▼───────────────────────────────────┐  │
│  │  Couche API Client (src/api/)                          │  │
│  │  fetch wrapper + intercepteur auth/refresh             │  │
│  │  Modules : authApi, booksApi, requestsApi, …           │  │
│  └────────────────────┬───────────────────────────────────┘  │
│                       │                                      │
│  ┌────────────────────▼───────────────────────────────────┐  │
│  │  Couche Auth (src/auth/)                               │  │
│  │  AuthContext (user, login, logout)                     │  │
│  │  Token storage : access (memoire) + refresh (SecureStore)│  │
│  └────────────────────┬───────────────────────────────────┘  │
│                       │ HTTPS                                │
└───────────────────────┼──────────────────────────────────────┘
                        ▼
                 Backend Express
```

### 2.2 Pattern : `Presentation → Hooks → API Client`

Chaque ecran consomme uniquement des hooks. Les hooks encapsulent :
- L'appel API (via le client)
- La cle de cache TanStack Query
- La logique d'invalidation apres mutation

Exemple :

```ts
// src/hooks/useBooks.ts
export const useBooks = (filters: BookFilters) =>
  useQuery({
    queryKey: ['books', filters],
    queryFn: () => booksApi.list(filters),
    staleTime: 30_000,
  });

export const useCreateBook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: booksApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['books'] }),
  });
};
```

```tsx
// app/(app)/(tabs)/index.tsx
export default function HomeScreen() {
  const { data, isLoading } = useBooks({ grade: '6e' });
  if (isLoading) return <Loader />;
  return <BookList books={data.books} />;
}
```

L'ecran ne sait rien du transport ni du cache.

### 2.3 Structure des dossiers

```
mobile/
├── app.json                        # Expo config (nom, slug, icone, splash)
├── eas.json                        # Profils de build EAS
├── package.json
├── tsconfig.json
├── .env.example                    # EXPO_PUBLIC_API_URL=...
│
├── app/                            # Routes (Expo Router file-based)
│   ├── _layout.tsx                 # Root : QueryClient + AuthProvider
│   ├── index.tsx                   # Splash/redirect selon auth
│   │
│   ├── (auth)/                     # Group : non authentifie
│   │   ├── _layout.tsx             # Stack header transparent
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── otp.tsx                 # Verification + resend
│   │   ├── forgot-password.tsx
│   │   └── reset-password.tsx
│   │
│   ├── (app)/                      # Group : authentifie
│   │   ├── _layout.tsx             # Guard : redirect si pas connecte
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx         # Bottom tabs
│   │   │   ├── index.tsx           # Liste livres + filtres + search
│   │   │   ├── my-books.tsx
│   │   │   ├── notifications.tsx
│   │   │   └── profile.tsx
│   │   ├── books/
│   │   │   ├── [id].tsx            # Detail livre
│   │   │   └── new.tsx             # Creation (form + image picker)
│   │   ├── requests/
│   │   │   └── me.tsx              # Mes demandes
│   │   └── supplies/
│   │       ├── index.tsx           # Liste fournitures
│   │       └── [id].tsx            # Detail + contact
│   │
│   └── +not-found.tsx
│
├── src/
│   ├── api/
│   │   ├── client.ts               # fetch wrapper + intercepteur
│   │   ├── auth.ts                 # register/verify/login/refresh/logout
│   │   ├── books.ts
│   │   ├── requests.ts
│   │   ├── supplies.ts
│   │   ├── notifications.ts
│   │   └── users.ts
│   │
│   ├── auth/
│   │   ├── AuthContext.tsx         # provider + useAuth
│   │   ├── tokenStorage.ts         # SecureStore wrapper
│   │   └── refresh.ts              # Logique de refresh anti-replay
│   │
│   ├── components/
│   │   ├── ui/                     # Primitives : Button, Input, Card…
│   │   ├── BookCard.tsx
│   │   ├── BookFilters.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorState.tsx
│   │   ├── Loader.tsx
│   │   └── ImagePickerField.tsx
│   │
│   ├── hooks/
│   │   ├── useBooks.ts
│   │   ├── useRequests.ts
│   │   ├── useNotifications.ts
│   │   └── useDebounced.ts
│   │
│   ├── theme/
│   │   ├── colors.ts               # Palette
│   │   ├── typography.ts
│   │   └── spacing.ts
│   │
│   ├── types/
│   │   └── api.ts                  # Types des entites (Book, User, Request…)
│   │
│   └── utils/
│       ├── formatPhone.ts
│       ├── formatDate.ts
│       └── validation.ts           # Schemas Zod
│
└── assets/
    ├── icon.png
    ├── splash.png
    └── adaptive-icon.png
```

### 2.4 Navigation et flux

```
                    ┌──────────────┐
                    │  app/index   │
                    │  (splash)    │
                    └───┬──────┬───┘
                        │      │
              non-auth  │      │ auth
                        ▼      ▼
              ┌─────────────┐  ┌──────────────────────┐
              │  (auth)/    │  │  (app)/(tabs)/index  │
              │  login      │  │  Liste livres        │
              └──┬───┬───┬──┘  └──┬─────┬──────┬──────┘
                 │   │   │        │     │      │
                 │   │   │        ▼     ▼      ▼
            register otp forgot  detail mybooks profile
                                   │
                                   ▼
                                request
```

Guards :
- `(app)/_layout.tsx` redirige vers `(auth)/login` si pas de user dans `AuthContext`
- `(auth)/_layout.tsx` redirige vers `(app)/(tabs)` si user deja connecte

### 2.5 Gestion d'etat

| Type d'etat | Outil | Exemple |
|---|---|---|
| Donnees serveur (lecture) | TanStack Query | Liste livres, profil user |
| Mutations serveur | TanStack Query (`useMutation`) | Creer livre, demander livre |
| Auth (user + tokens) | React Context | `AuthContext.user`, `login()`, `logout()` |
| UI locale (form, modal) | `useState` / `react-hook-form` | Champs de formulaire, ouverture modal |
| Persistant | expo-secure-store | refreshToken, fcmToken |

Pas de Redux, pas de Zustand, pas de MobX. Le perimetre ne le justifie pas.

---

## 3. Auth, secrets et securite

### 3.1 Flux d'authentification

```
┌─────────┐                  ┌─────────┐                ┌─────────┐
│  User   │                  │  App    │                │  API    │
└────┬────┘                  └────┬────┘                └────┬────┘
     │  Saisit email + pass       │                          │
     │ ──────────────────────────►│                          │
     │                            │  POST /auth/login        │
     │                            │ ────────────────────────►│
     │                            │ ◄────────────────────────│
     │                            │  { accessToken,          │
     │                            │    refreshToken,         │
     │                            │    user }                │
     │                            │                          │
     │                            │  SecureStore.set(refresh)│
     │                            │  setUser(user)           │
     │                            │  setAccessToken(memoire) │
     │ ◄──────────────────────────│                          │
     │  Redirect (app)/(tabs)     │                          │
     │                            │  GET /books              │
     │                            │  Authorization: Bearer   │
     │                            │ ────────────────────────►│
     │                            │ ◄────────────────────────│
```

### 3.2 Token storage

| Token | Stockage | Duree de vie | Pourquoi |
|---|---|---|---|
| `accessToken` | Memoire (`AuthContext`) | 15 min | Volatile, perdu au kill de l'app, regenere par refresh |
| `refreshToken` | `expo-secure-store` (Keychain iOS / Keystore Android) | 7 jours | Persiste entre lancements, chiffre par l'OS |
| `fcmToken` | `expo-secure-store` | tant que valide | Envoye au backend a chaque login + au refresh FCM |

### 3.3 Intercepteur de refresh

Le wrapper fetch (`src/api/client.ts`) :

1. Ajoute `Authorization: Bearer <accessToken>` a chaque requete
2. Si reponse `401` :
   - Pose un mutex (eviter refresh multiples concurrents)
   - Appelle `POST /auth/refresh-token` avec le refresh
   - Si succes : stocke les nouveaux tokens, rejoue la requete originale
   - Si echec : `logout()` + redirect login

```ts
// Pseudocode src/api/client.ts
async function apiFetch(path: string, init: RequestInit = {}) {
  const access = authStore.getAccessToken();
  const headers = { ...init.headers, Authorization: `Bearer ${access}` };
  let res = await fetch(API_URL + path, { ...init, headers });

  if (res.status === 401) {
    const ok = await refreshTokensSafely();  // mutex
    if (!ok) {
      authStore.logout();
      throw new ApiError('SESSION_EXPIRED');
    }
    // Retry avec le nouveau access
    headers.Authorization = `Bearer ${authStore.getAccessToken()}`;
    res = await fetch(API_URL + path, { ...init, headers });
  }
  return parseResponse(res);
}
```

### 3.4 Securite

- **Pas de tokens dans AsyncStorage** : SecureStore uniquement pour le refresh
- **HTTPS uniquement** en prod (Render fournit, contrainte cote app via `EXPO_PUBLIC_API_URL`)
- **Pas de log des tokens** ni de credentials, meme en dev
- **Validation cote client** : duplication des regles Zod du backend pour UX, mais le backend reste autorite
- **Detection de replay** : geree cote backend, le client doit gerer le 401 → logout proprement
- **Expo SecureStore** : uniquement disponible sur device physique (pas web), donc app cible mobile uniquement

---

## 4. Specifications par ecran

> 12 ecrans alignes sur [maquettes.html](maquettes.html). Format pour chaque
> ecran : route, etats UI, donnees, actions, gestion d'erreurs.

### 4.1 Splash / Redirect (`app/index.tsx`)

| Champ | Detail |
|---|---|
| Route | `/` |
| Donnees | Lit `AuthContext.user` au montage |
| Logique | Si user → redirect `(app)/(tabs)`. Sinon → `(auth)/login` |
| Etats UI | Splash visuel pendant 200ms max (eviter flash) |

### 4.2 Login (`(auth)/login.tsx`)

| Champ | Detail |
|---|---|
| Route | `/login` |
| Donnees | Aucune au montage |
| Form | `email` (Zod email), `password` (Zod min 8) |
| Action | `POST /auth/login` → stocke tokens + redirect |
| Etats UI | Idle / Loading / Erreur (INVALID_CREDENTIALS, ACCOUNT_INACTIVE) |
| Liens | "Pas de compte ?" → register. "Mot de passe oublie ?" → forgot |

### 4.3 Register (`(auth)/register.tsx`)

| Champ | Detail |
|---|---|
| Form | firstName, lastName, email, password, phone (+221), address, gradeInterests[] |
| Validation | Min 2 char nom, password fort (maj+min+chiffre), phone min 8 |
| Action | `POST /auth/register` → redirect `(auth)/otp?email=...` |
| Etats UI | Idle / Loading / Erreur (EMAIL_EXISTS, PHONE_EXISTS, VALIDATION_ERROR) |

### 4.4 OTP (`(auth)/otp.tsx`)

| Champ | Detail |
|---|---|
| Form | Code 4 chiffres (5 inputs auto-focus) |
| Action principale | `POST /auth/verify-otp { email, code }` → tokens + redirect `(app)` |
| Action secondaire | `POST /auth/resend-otp` (cooldown 60s, max 3/h) |
| Mode demo | Affiche un hint "Code de demo : 1234" si `EXPO_PUBLIC_DEMO_MODE=true` |
| Etats UI | Idle / Loading / Erreur (INVALID_CODE, EXPIRED, TOO_MANY_ATTEMPTS) + countdown resend |

### 4.5 Forgot password / Reset (`(auth)/forgot-password.tsx`, `(auth)/reset-password.tsx`)

| Champ | Detail |
|---|---|
| Forgot | Form `email` → `POST /auth/forgot-password` (reponse opaque "OK" toujours) → redirect reset |
| Reset | Form `email`, `code`, `newPassword` → `POST /auth/reset-password` → redirect login |

### 4.6 Liste livres (`(app)/(tabs)/index.tsx`)

| Champ | Detail |
|---|---|
| Route | `/` (tab par defaut) |
| Donnees | `useBooks({ grade, condition, status, search, page })` |
| UI | FlatList paginee + barre de recherche debounced (300ms) + bottom sheet filtres |
| Etats UI | Loading initial / Empty / Error / Data / Loading more |
| Action | Tap card → `/books/[id]` |

### 4.7 Detail livre (`(app)/books/[id].tsx`)

| Champ | Detail |
|---|---|
| Donnees | `useBook(id)` |
| UI | Image grande + titre + auteur + grade + condition + description + owner (nom tronque) |
| Action proprietaire | Edit / Delete (autorise par backend) |
| Action visiteur | "Demander ce livre" (si `!hasRequested && status==='AVAILABLE'` et pas son livre) |
| Etats UI | Loading / Error 404 / Data / Mutation pending |

### 4.8 Mes livres (`(app)/(tabs)/my-books.tsx`)

| Champ | Detail |
|---|---|
| Donnees | `useMyBooks()` (max 100, pas de pagination — RG cahier) |
| UI | Liste verticale + FAB "+" → `/books/new` |
| Action | Tap → detail. Long-press → menu contextuel (Edit/Delete) |
| Sous-vue | Compteur de demandes recues par livre + lien vers `books/[id]/requests` |

### 4.9 Creation livre (`(app)/books/new.tsx`)

| Champ | Detail |
|---|---|
| Form | title, author, grade, className, condition, description, image (optionnel) |
| Image | `expo-image-picker.launchImageLibrary` → preview → upload multipart |
| Action | `POST /books` (multipart) → redirect detail nouvellement cree |
| Etats UI | Idle / Loading (avec progress upload) / Erreur (FILE_TOO_LARGE, INVALID_TYPE) |

### 4.10 Mes demandes (`(app)/requests/me.tsx`)

| Champ | Detail |
|---|---|
| Donnees | `useMyRequests()` |
| UI | Liste avec badge statut (PENDING/IN_PROGRESS/ACCEPTED/REFUSED/COMPLETED) |
| Action | Tap → detail. Si PENDING → "Annuler" (DELETE) |

### 4.11 Notifications (`(app)/(tabs)/notifications.tsx`)

| Champ | Detail |
|---|---|
| Donnees | `useNotifications()` paginee + `useUnreadCount()` (badge tab) |
| UI | Liste DESC, non-lues en gras |
| Action | Tap → marque lue + navigate vers entite (livre/demande) |
| Action header | "Tout marquer lu" |
| Push | Au montage : registerForPushNotifications + send FCM token via `PUT /users/me` |

### 4.12 Profil (`(app)/(tabs)/profile.tsx`)

| Champ | Detail |
|---|---|
| Donnees | `AuthContext.user` + `useMe()` (refresh) |
| UI | Header (avatar initiales + nom) + sections Infos / Securite / Compte |
| Actions | Edit profil, Changer password, Deconnexion, Supprimer compte (avec verif password) |

### 4.13 Fournitures (`(app)/supplies/index.tsx`, `[id].tsx`)

| Champ | Detail |
|---|---|
| Liste | Filtre par type, pagination |
| Detail | Photo + description + bouton "Contacter le fournisseur" → `POST /supplies/:id/contact` |

---

## 5. Strategies transverses

### 5.1 Gestion des erreurs

Le backend renvoie `{ success: false, error: { code, message, details? } }`.
Le client parse ca dans une classe `ApiError` :

```ts
class ApiError extends Error {
  constructor(public code: string, message: string, public details?: unknown, public status?: number) {
    super(message);
  }
}
```

Convention d'affichage :
- **Erreurs metier** (`code` connu) : message en francais via une map `ERROR_MESSAGES`
- **Erreurs reseau** (`fetch` reject) : "Connexion impossible, verifiez votre reseau"
- **500** : "Erreur serveur, reessayez plus tard"
- **401 final** : redirect login avec toast "Session expiree"

### 5.2 Cache et invalidation

| Mutation | Invalide |
|---|---|
| `createBook` | `['books']`, `['my-books']` |
| `updateBook(id)` | `['books']`, `['book', id]` |
| `deleteBook(id)` | `['books']`, `['my-books']` |
| `createRequest` | `['my-requests']`, `['book', bookId]` (pour `hasRequested`) |
| `cancelRequest(id)` | `['my-requests']` |
| `markNotificationRead(id)` | `['notifications']`, `['unread-count']` |

### 5.3 Performance

- **Liste de livres** : `FlatList` avec `getItemLayout` quand possible, `removeClippedSubviews`, `windowSize=10`
- **Images** : `expo-image` avec `cachePolicy='memory-disk'` et URLs Cloudinary transformees (`w_400,c_fill`)
- **Search debounced** 300ms pour eviter les requetes a chaque touche
- **Pagination cursorless** : page-based (limit 20), `keepPreviousData: true` pour eviter le flash

### 5.4 Notifications push

```
┌──────────┐                                    ┌─────────┐
│   App    │                                    │  API    │
└────┬─────┘                                    └────┬────┘
     │ Au login                                      │
     │ ─► registerForPushNotifications()             │
     │ ─► getExpoPushToken()                         │
     │ ─► PUT /users/me { fcmToken }                 │
     │                                              │
     │ … plus tard …                                │
     │                                              │
     │   Demande passe en ACCEPTED                  │
     │ ◄────────── push FCM ────────────────────────│
     │                                              │
     │ App.notification handler :                   │
     │   - Si app foreground : toast + invalidate   │
     │   - Si tap : navigate vers entite           │
```

### 5.5 Mode demo (jury)

Pour que l'inscription marche sans credentials AT reels en prod :
- Cote backend : si `DEMO_MODE=true`, accepter `code === '1234'` en plus du vrai OTP
- Cote frontend : afficher un hint sur l'ecran OTP si `EXPO_PUBLIC_DEMO_MODE=true`
- Setup : a ajouter dans une PR ulterieure (`feat(auth): demo mode for OTP verification`)

---

## 6. Build et deploiement

### 6.1 Profils EAS

`eas.json` :

```json
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal", "android": { "buildType": "apk" } },
    "production": { "autoIncrement": true }
  }
}
```

### 6.2 Variables d'environnement

| Variable | Dev | Staging | Prod |
|---|---|---|---|
| `EXPO_PUBLIC_API_URL` | `http://<ip-LAN>:3000/api` | `https://bookswap-api-2osb.onrender.com/api` | URL prod future |
| `EXPO_PUBLIC_DEMO_MODE` | `true` | `true` | `false` |
| `EXPO_PUBLIC_SENTRY_DSN` | _(vide)_ | DSN staging | DSN prod |

### 6.3 Sequence de build

```bash
# Dev (Expo Go, sans build)
npx expo start

# Build APK preview pour le jury
eas build --profile preview --platform android

# Build production (App Store / Play Store)
eas build --profile production --platform all
```

---

## 7. Tests

### 7.1 Strategie

| Niveau | Outil | Couverture cible |
|---|---|---|
| Unitaire | Jest + RTL | Hooks (`useBooks`, `useAuth`), composants UI critiques (BookCard, ImagePickerField), utils (formatPhone, validation) |
| Integration | Jest + RTL + msw | Flux complets : login → liste livres, register → otp → tabs |
| E2E | Maestro (post-MVP) | 1-2 parcours critiques sur device |

### 7.2 Mocking

- **API** : `msw` (Mock Service Worker) pour intercepter les fetch, snapshots de reponses serialisees
- **Navigation** : `expo-router` fournit des helpers de test
- **SecureStore** : mock natif via `jest.mock('expo-secure-store')`

---

## 8. Plan de livraison

10 commits / phases (cf. plan global discute) :

1. Setup Expo + Router + theme + ESLint
2. API client + AuthContext + token refresh
3. Ecrans auth (login, register, otp, forgot)
4. Liste + detail livres
5. Mes livres + creation
6. Demandes
7. Fournitures
8. Notifications + push
9. Profil
10. Polish + EAS build preview

Chaque phase = 1 PR, mergee si :
- TypeScript compile (`tsc --noEmit`)
- ESLint passe
- Tests unitaires existants passent
- Demo manuelle sur Expo Go (iOS + Android)
