# BookSwap — Application mobile

App React Native / Expo qui consomme l'[API BookSwap](../server). Cf.
[CAHIER_CONCEPTION_FRONTEND.md](../CAHIER_CONCEPTION_FRONTEND.md) pour la
conception detaillee (architecture, ecrans, strategies transverses).

## Stack

- **Expo SDK 54** + React Native 0.81 + React 19
- **Expo Router v6** (routing file-based)
- **TypeScript** strict
- **TanStack Query** v5 (a venir phase 2)
- **react-hook-form** + **Zod** (a venir phase 2)
- **expo-secure-store** pour les tokens (a venir phase 2)

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

Pour tester sur device physique : installer **Expo Go** depuis le store et
scanner le QR. Si le backend tourne en local, `EXPO_PUBLIC_API_URL` doit
pointer sur l'**IP LAN** du PC (pas `localhost`, qui resoudrait sur le device).

## Structure

```
mobile/
├── app/                  # Routes (Expo Router file-based)
│   ├── _layout.tsx       # Root : SafeArea + StatusBar
│   └── index.tsx         # Splash temporaire
├── src/
│   ├── api/              # Client API + endpoints
│   ├── auth/             # AuthContext + token storage
│   ├── components/       # Composants reutilisables
│   ├── hooks/            # Hooks TanStack Query
│   ├── theme/            # colors, typography, spacing
│   ├── types/            # Types des entites (Book, User, Request…)
│   └── utils/            # Helpers (formatPhone, validation…)
└── assets/
```

Path alias : `@/*` → `./src/*` (ex: `import { colors } from '@/theme'`).

## Variables d'environnement

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_URL` | URL de l'API (defaut : staging Render) |
| `EXPO_PUBLIC_DEMO_MODE` | Si `true`, hint "Code OTP : 1234" sur l'ecran OTP |
| `EXPO_PUBLIC_SENTRY_DSN` | *(optionnel)* DSN Sentry |

Toutes les vars `EXPO_PUBLIC_*` sont incluses dans le bundle, donc **pas de
secrets** dedans.

## Plan de livraison

10 phases, cf. [CAHIER_CONCEPTION_FRONTEND.md §8](../CAHIER_CONCEPTION_FRONTEND.md#8-plan-de-livraison).
Phase actuelle : **1 — Setup (en cours)**.
