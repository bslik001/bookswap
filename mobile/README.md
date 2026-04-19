# BookSwap — Application mobile

App React Native / Expo qui consomme l'[API BookSwap](../server). Cf.
[CAHIER_CONCEPTION_FRONTEND.md](../CAHIER_CONCEPTION_FRONTEND.md) pour la
conception detaillee (architecture, ecrans, strategies transverses) et le
[README racine](../README.md) pour la vue d'ensemble du projet.

## Stack

| Couche | Technologies |
|--------|-------------|
| **Runtime** | Expo SDK 54, React Native 0.81, React 19 |
| **Routing** | Expo Router v6 (file-based) |
| **Langage** | TypeScript strict |
| **Data fetching** | TanStack Query v5 |
| **Forms** | react-hook-form + Zod (`@hookform/resolvers`) |
| **Auth / stockage** | `expo-secure-store` (tokens), AuthContext + axios interceptor |
| **Images** | `expo-image` (cache memoire + disque) |
| **Picker** | `expo-image-picker` (creation de livre) |
| **Icones** | `@expo/vector-icons` (Ionicons) |
| **Build** | EAS Build (`dev`, `preview`, `production`) |

## Structure

```
mobile/
├── app/                            # Routes (Expo Router file-based)
│   ├── _layout.tsx                 # Root : QueryClient + AuthProvider + SafeArea
│   ├── index.tsx                   # Splash + redirection auth/app
│   ├── (auth)/                     # Pile non-authentifiee
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── otp.tsx                 # Verification OTP
│   │   ├── forgot-password.tsx
│   │   └── reset-password.tsx
│   └── (app)/                      # Pile authentifiee (guard)
│       ├── _layout.tsx             # Redirige vers /login si pas de user
│       ├── (tabs)/                 # Tab bar
│       │   ├── index.tsx           # Liste livres
│       │   ├── my-books.tsx        # Mes livres (proprietaire)
│       │   ├── notifications.tsx   # Notifications + badge non-lues
│       │   └── profile.tsx
│       ├── books/
│       │   ├── new.tsx             # Creation livre (image picker)
│       │   ├── [id]/index.tsx      # Detail + bouton "demander"
│       │   └── [id]/requests.tsx   # Demandes recues (proprietaire)
│       ├── requests/
│       │   ├── me.tsx              # Mes demandes
│       │   └── [id].tsx            # Detail + annulation
│       ├── supplies/
│       │   ├── index.tsx           # Liste fournitures (filtre par type)
│       │   └── [id].tsx            # Detail + contact fournisseur
│       └── profile/
│           ├── edit.tsx            # Edition profil
│           └── password.tsx        # Changement mot de passe
├── src/
│   ├── api/                        # Client axios + endpoints typees
│   ├── auth/                       # AuthContext + token storage (SecureStore)
│   ├── components/
│   │   ├── ui/                     # Button, TextField, Screen, ErrorBanner, StatusBadge
│   │   └── books/                  # BookCard
│   ├── hooks/                      # useBooks, useRequests, useSupplies, useNotifications, useUser
│   ├── theme/                      # colors, typography, spacing, radius
│   ├── types/                      # Book, User, Request, Supply, Notification
│   └── utils/                      # apiErrorMessage, formatPhone, validation Zod
├── assets/
├── app.json                        # Config Expo (slug, icon, splash, perms)
├── eas.json                        # Profils EAS Build (dev / preview / prod)
└── eslint.config.js                # eslint-config-expo
```

Path alias : `@/*` → `./src/*` (ex : `import { colors } from '@/theme'`).

## Installation

```bash
cd mobile
npm install
cp .env.example .env
# Editer .env :
# - EXPO_PUBLIC_API_URL : URL du backend (defaut = staging Render)
```

## Lancement

```bash
# Demarre Metro + ouvre QR code Expo Go
npm start

# Direct sur Android (device USB ou emulateur)
npm run android

# Direct sur iOS (necessite macOS + simulateur)
npm run ios
```

Pour tester sur un device physique : installer **Expo Go** depuis le store
et scanner le QR. Si le backend tourne en local, `EXPO_PUBLIC_API_URL`
doit pointer sur l'**IP LAN** du PC (pas `localhost`, qui resoudrait sur
le device).

## Variables d'environnement

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_URL` | URL de l'API (defaut : staging Render) |
| `EXPO_PUBLIC_DEMO_MODE` | Si `true`, hint "Code OTP : 1234" sur l'ecran OTP |
| `EXPO_PUBLIC_SENTRY_DSN` | *(optionnel)* DSN Sentry |

Toutes les vars `EXPO_PUBLIC_*` sont incluses dans le bundle, donc
**pas de secrets** dedans.

## Build natif (EAS)

[eas.json](eas.json) definit trois profils :

| Profil | Usage | Distribution | Notes |
|--------|-------|--------------|-------|
| `development` | Dev client (debug, hot reload) | internal | requiert `developmentClient` |
| `preview` | APK partageable pour test | internal | Android : APK signe |
| `production` | Build store-ready | store | `autoIncrement` du build number |

```bash
# Une fois : se connecter et lier le projet
npx eas-cli login
npx eas-cli init

# Build
npx eas-cli build --profile preview --platform android
```

## Qualite de code

```bash
npm run lint          # eslint-config-expo
```

Les hooks Husky / commitlint / lint-staged sont configures a la racine
du monorepo (cf. [README racine](../README.md)).

## Etat des phases

10 phases prevues dans [CAHIER_CONCEPTION_FRONTEND.md §8](../CAHIER_CONCEPTION_FRONTEND.md#8-plan-de-livraison).
**Phases 1 a 9 livrees**. Phase 10 (polish, perfs, accessibilite) en
cours — voir [CHANGELOG](../CHANGELOG.md).
