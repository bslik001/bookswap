# Cahier d'Analyse – Application Mobile d'Echange de Livres Scolaires

---

## 1. Introduction

### 1.1 Objet du document

Ce cahier d'analyse a pour objectif de traduire les exigences fonctionnelles et non fonctionnelles du cahier des charges en spécifications techniques détaillées. Il constitue le document de référence pour l'équipe de développement.

### 1.2 Rappel du contexte

L'application vise à faciliter l'échange et l'achat de livres scolaires entre élèves, parents et étudiants, tout en offrant un espace dédié aux fournitures scolaires via des fournisseurs partenaires. L'équipe de l'application agit comme intermédiaire pour sécuriser les transactions.

### 1.3 Public cible

| Profil | Besoins principaux |
|---|---|
| Élèves (primaire, collège, lycée) | Rechercher/proposer des livres scolaires |
| Étudiants du supérieur | Rechercher/proposer des livres universitaires |
| Parents d'élèves | Rechercher des livres et fournitures pour leurs enfants |
| Fournisseurs partenaires | Proposer des fournitures scolaires (cahiers, stylos, sacs...) |
| Administrateurs | Modérer les annonces, gérer les utilisateurs et les demandes |

---

## 2. Analyse des acteurs et cas d'utilisation

### 2.1 Identification des acteurs

| Acteur | Type | Description |
|---|---|---|
| Utilisateur (non connecté) | Principal | Visiteur pouvant consulter l'application mais sans interaction |
| Utilisateur (connecté) | Principal | Peut rechercher, proposer des livres et manifester son intérêt |
| Administrateur | Principal | Gère la plateforme, modère les contenus, facilite les échanges |
| Fournisseur partenaire | Secondaire | Propose des fournitures via la plateforme |
| Système de notification | Secondaire | Envoie des notifications push/email |

### 2.2 Cas d'utilisation détaillés

#### CU-01 : Inscription

| Champ | Détail |
|---|---|
| **Acteur** | Utilisateur non connecté |
| **Précondition** | L'utilisateur n'a pas de compte |
| **Scénario principal** | 1. L'utilisateur accède au formulaire d'inscription. 2. Il renseigne : nom, prénom, adresse, téléphone, email, mot de passe, niveaux scolaires d'intérêt. 3. Le système valide les données. 4. Le système crée le compte (inactif) et envoie un code OTP par SMS au numéro de téléphone. 5. L'utilisateur saisit le code OTP reçu. 6. Le système vérifie le code. 7. Le compte est activé et l'utilisateur est redirigé vers l'écran d'accueil. |
| **Scénario alternatif** | 3a. Email déjà utilisé : le système affiche une erreur. 3b. Numéro de téléphone déjà utilisé : le système affiche une erreur. 3c. Données invalides : le système indique les champs incorrects. 5a. Code OTP incorrect : le système affiche une erreur (max 5 tentatives). 5b. Code OTP expiré : l'utilisateur peut demander un renvoi (cooldown 60s, max 3 envois/heure). |
| **Postcondition** | Le compte est créé et activé après vérification du numéro de téléphone. |

#### CU-02 : Connexion

| Champ | Détail |
|---|---|
| **Acteur** | Utilisateur inscrit |
| **Précondition** | L'utilisateur possède un compte |
| **Scénario principal** | 1. L'utilisateur saisit email + mot de passe. 2. Le système vérifie les identifiants. 3. Un token JWT est généré. 4. L'utilisateur accède à l'application. |
| **Scénario alternatif** | 2a. Identifiants incorrects : message d'erreur. 2b. Compte bloqué : redirection vers le support. |
| **Postcondition** | L'utilisateur est authentifié avec un token JWT valide. |

#### CU-03 : Rechercher un livre (Mode "Je recherche un livre")

| Champ | Détail |
|---|---|
| **Acteur** | Utilisateur connecté |
| **Précondition** | L'utilisateur est authentifié |
| **Scénario principal** | 1. L'utilisateur active le mode "Je recherche un livre". 2. Le système affiche la liste des livres disponibles. 3. L'utilisateur applique des filtres (classe, niveau, état, mot-clé). 4. L'utilisateur consulte les détails d'un livre (titre, auteur, niveau, photo, description). 5. L'utilisateur clique sur "Je veux ce livre". 6. Le système enregistre la demande et notifie l'équipe admin. |
| **Scénario alternatif** | 3a. Aucun résultat : le système affiche un message et propose d'élargir les filtres. |
| **Postcondition** | La demande est enregistrée ; l'administrateur est notifié. |

#### CU-04 : Proposer un livre (Mode "J'ai un livre")

| Champ | Détail |
|---|---|
| **Acteur** | Utilisateur connecté |
| **Précondition** | L'utilisateur est authentifié |
| **Scénario principal** | 1. L'utilisateur active le mode "J'ai un livre". 2. Il remplit le formulaire : titre, niveau, état (neuf/occasion), photo de couverture. 3. Le système valide les données et enregistre le livre. 4. Le livre est visible dans la base publique. |
| **Scénario alternatif** | 2a. Photo manquante : le système demande d'ajouter une photo. 2b. Données incomplètes : le système indique les champs requis. |
| **Postcondition** | Le livre est publié et consultable par tous les utilisateurs. |

#### CU-05 : Mise en relation (Demande de livre)

| Champ | Détail |
|---|---|
| **Acteur** | Utilisateur connecté, Administrateur |
| **Précondition** | Un utilisateur a manifesté son intérêt pour un livre |
| **Scénario principal** | 1. L'administrateur reçoit la notification de demande. 2. Il contacte le propriétaire du livre. 3. Il organise l'échange ou la vente. 4. Il met à jour le statut de la demande. 5. Les deux parties sont notifiées. |
| **Postcondition** | L'échange/vente est organisé ; le livre est marqué comme réservé ou échangé. |

#### CU-06 : Consulter les fournitures scolaires

| Champ | Détail |
|---|---|
| **Acteur** | Utilisateur connecté |
| **Précondition** | L'utilisateur est authentifié |
| **Scénario principal** | 1. L'utilisateur accède à la section "Fournitures scolaires". 2. Il parcourt les articles (cahiers, stylos, sacs...). 3. Il filtre par type d'article. 4. Il consulte les détails d'un article. 5. Il clique sur "Demander un contact" pour joindre le fournisseur. |
| **Postcondition** | La demande de contact est transmise au fournisseur. |

#### CU-07 : Administration et modération

| Champ | Détail |
|---|---|
| **Acteur** | Administrateur |
| **Précondition** | L'administrateur est authentifié sur le tableau de bord web |
| **Scénario principal** | 1. Modérer les annonces de livres (approuver, rejeter, supprimer). 2. Gérer les utilisateurs (blocage, suppression). 3. Traiter les demandes d'échange/achat. 4. Gérer les fournisseurs partenaires. 5. Envoyer des notifications aux utilisateurs. |
| **Postcondition** | La plateforme est maintenue en état de fonctionnement sûr. |

---

## 3. Analyse des données

### 3.1 Dictionnaire de données

| Entité | Attribut | Type | Contraintes | Description |
|---|---|---|---|---|
| **Utilisateur** | id | UUID | PK, auto-généré | Identifiant unique |
| | nom | String(100) | NOT NULL | Nom de famille |
| | prenom | String(100) | NOT NULL | Prénom |
| | email | String(255) | NOT NULL, UNIQUE | Adresse email |
| | mot_de_passe | String(255) | NOT NULL, hashé | Mot de passe (bcrypt) |
| | telephone | String(20) | NOT NULL, UNIQUE | Numéro de téléphone (vérifié par OTP) |
| | telephone_verifie | Boolean | DEFAULT false | Numéro vérifié par OTP |
| | adresse | String(500) | NOT NULL | Adresse postale |
| | niveaux_interet | String[] | - | Niveaux scolaires d'intérêt |
| | role | Enum | DEFAULT 'user' | 'user', 'admin', 'fournisseur' |
| | date_inscription | DateTime | auto | Date de création du compte |
| | actif | Boolean | DEFAULT true | Compte actif ou bloqué |
| **Livre** | id | UUID | PK, auto-généré | Identifiant unique |
| | titre | String(255) | NOT NULL | Titre du livre |
| | auteur | String(255) | - | Auteur du livre |
| | niveau | String(100) | NOT NULL | Niveau scolaire ciblé |
| | classe | String(100) | - | Classe spécifique |
| | etat | Enum | NOT NULL | 'neuf', 'occasion' |
| | description | Text | - | Description détaillée |
| | photo_url | String(500) | NOT NULL | URL de la photo de couverture |
| | statut | Enum | DEFAULT 'disponible' | 'disponible', 'reserve', 'echange' |
| | proprietaire_id | UUID | FK -> Utilisateur | Propriétaire du livre |
| | date_publication | DateTime | auto | Date d'ajout |
| **Demande** | id | UUID | PK, auto-généré | Identifiant unique |
| | livre_id | UUID | FK -> Livre | Livre demandé |
| | demandeur_id | UUID | FK -> Utilisateur | Utilisateur intéressé |
| | statut | Enum | DEFAULT 'en_attente' | 'en_attente', 'en_cours', 'accepte', 'refuse', 'termine' |
| | date_demande | DateTime | auto | Date de la demande |
| | notes_admin | Text | - | Notes de l'administrateur |
| **Fourniture** | id | UUID | PK, auto-généré | Identifiant unique |
| | nom | String(255) | NOT NULL | Nom de l'article |
| | type | Enum | NOT NULL | 'cahier', 'stylo', 'sac', 'autre' |
| | description | Text | - | Description de l'article |
| | photo_url | String(500) | - | Image de l'article |
| | prix | Decimal(10,2) | - | Prix indicatif |
| | fournisseur_id | UUID | FK -> Utilisateur | Fournisseur partenaire |
| **DemandeContact** | id | UUID | PK, auto-généré | Identifiant unique |
| | fourniture_id | UUID | FK -> Fourniture | Fourniture concernée |
| | demandeur_id | UUID | FK -> Utilisateur | Utilisateur demandeur |
| | message | Text | - | Message optionnel |
| | date_demande | DateTime | auto | Date de la demande |
| **Notification** | id | UUID | PK, auto-généré | Identifiant unique |
| | destinataire_id | UUID | FK -> Utilisateur | Destinataire |
| | type | Enum | NOT NULL | 'demande_livre', 'mise_a_jour', 'contact_fournisseur', 'systeme' |
| | contenu | Text | NOT NULL | Contenu de la notification |
| | lu | Boolean | DEFAULT false | Statut de lecture |
| | date_creation | DateTime | auto | Date de création |
| **OtpVerification** | id | UUID | PK, auto-généré | Identifiant unique |
| | telephone | String(20) | NOT NULL | Numéro à vérifier |
| | code | String(6) | NOT NULL | Code OTP (4-6 chiffres) |
| | tentatives | Integer | DEFAULT 0 | Nombre de tentatives de saisie |
| | expire_a | DateTime | NOT NULL | Date d'expiration (5 min après création) |
| | date_creation | DateTime | auto | Date de création |

### 3.2 Relations entre entités

```
Utilisateur (1) ──── (0..*) Livre           : Un utilisateur peut proposer plusieurs livres
Utilisateur (1) ──── (0..*) Demande         : Un utilisateur peut faire plusieurs demandes
Livre       (1) ──── (0..*) Demande         : Un livre peut recevoir plusieurs demandes
Utilisateur (1) ──── (0..*) Fourniture      : Un fournisseur propose plusieurs fournitures
Fourniture  (1) ──── (0..*) DemandeContact  : Une fourniture peut recevoir plusieurs demandes
Utilisateur (1) ──── (0..*) DemandeContact  : Un utilisateur peut contacter plusieurs fournisseurs
Utilisateur (1) ──── (0..*) Notification    : Un utilisateur reçoit plusieurs notifications
```

### 3.3 Modèle Entité-Relation (schéma textuel)

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  Utilisateur │       │    Livre     │       │   Demande    │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │──1:N──│ id (PK)      │──1:N──│ id (PK)      │
│ nom          │       │ titre        │       │ livre_id(FK) │
│ prenom       │       │ auteur       │       │ demandeur_id │
│ email        │       │ niveau       │       │ statut       │
│ mot_de_passe │       │ classe       │       │ date_demande │
│ telephone    │       │ etat         │       │ notes_admin  │
│ adresse      │       │ description  │       └──────────────┘
│ niveaux      │       │ photo_url    │
│ role         │       │ statut       │
│ date_insc    │       │ proprio_id   │
│ actif        │       │ date_pub     │
└──────┬───────┘       └──────────────┘
       │
       │1:N     ┌──────────────┐       ┌────────────────┐
       ├────────│  Fourniture  │──1:N──│ DemandeContact │
       │        ├──────────────┤       ├────────────────┤
       │        │ id (PK)      │       │ id (PK)        │
       │        │ nom          │       │ fourniture_id  │
       │        │ type         │       │ demandeur_id   │
       │        │ description  │       │ message        │
       │        │ photo_url    │       │ date_demande   │
       │        │ prix         │       └────────────────┘
       │        │ fournisseur  │
       │        └──────────────┘
       │1:N
       │        ┌──────────────┐
       └────────│ Notification │
                ├──────────────┤
                │ id (PK)      │
                │ destinataire │
                │ type         │
                │ contenu      │
                │ lu           │
                │ date_creation│
                └──────────────┘
```

---

## 4. Architecture technique

### 4.1 Choix technologiques retenus

| Couche | Technologie | Justification |
|---|---|---|
| **Frontend mobile** | React Native + Expo | Cross-platform (Android prioritaire, iOS futur), large écosystème JS, Expo simplifie le build et les mises à jour OTA |
| **Backend API** | Node.js + Express | Cohérence JS/TS full-stack, performances I/O async, écosystème npm riche |
| **Base de données** | PostgreSQL | Relationnel, intégrité des données (FK, contraintes), filtres performants, full-text search natif, support UUID et JSON |
| **Authentification** | JWT (JSON Web Token) | Stateless, adapté aux API REST mobiles |
| **Stockage images** | Cloudinary | CDN global, transformations d'images automatiques via URL (redimensionnement, compression, format WebP), optimisation pour réseaux mobiles |
| **Notifications** | Firebase Cloud Messaging (FCM) | Push notifications Android/iOS, gratuit, intégration Expo simplifiée |
| **Hébergement API** | Render (MVP) → Railway (production) | Render : tier gratuit permanent pour le MVP. Railway : pas de cold starts, meilleure performance pour la production |
| **ORM** | Prisma | Type-safe, migrations automatiques, compatible PostgreSQL |
| **Vérification SMS (OTP)** | Africa's Talking | Spécialisé Afrique, bonne délivrabilité sur opérateurs locaux (Orange, MTN, Moov), coût réduit (~0.01-0.03 $/SMS) |

### 4.2 Architecture globale

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT MOBILE                            │
│                  (React Native + Expo App)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Auth     │  │ Livres   │  │ Fourni-  │  │ Notifications │  │
│  │  Screens  │  │ Screens  │  │ tures    │  │ Handler       │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────────┘  │
└───────────────────────┬─────────────────────────────────────────┘
                        │ HTTPS (REST API)
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js + Express)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Auth     │  │ Livres   │  │ Fourni-  │  │ Notifications │  │
│  │ Module   │  │ Module   │  │ tures    │  │ Module        │  │
│  │ (JWT)    │  │          │  │ Module   │  │ (FCM)         │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────────┘  │
│  ┌──────────┐  ┌──────────────────────────────────────────────┐│
│  │ Upload   │  │           Middleware                         ││
│  │ Module   │  │  (Auth, Validation, Error Handling, CORS)    ││
│  │(Cloudinary)│ └──────────────────────────────────────────────┘│
│  └──────────┘                                                   │
└──────────┬──────────────┬──────────────────────┬────────────────┘
           │              │                      │
           ▼              ▼                      ▼
  ┌──────────────┐ ┌──────────────┐    ┌──────────────────┐
  │  PostgreSQL  │ │  Cloudinary  │    │   Firebase FCM   │
  │  (Données)   │ │  (Images +   │    │  (Notifications) │
  └──────────────┘ │  CDN + Trans-│    └──────────────────┘
                   │  formations) │
                   └──────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  TABLEAU DE BORD ADMIN (Web)                    │
│                  (React.js ou Next.js)                          │
│  Modération | Gestion utilisateurs | Gestion demandes          │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTPS (mêmes endpoints API)
                          ▼
                   Backend (Node.js)

Hébergement : Render (MVP, tier gratuit) → Railway (production, sans cold starts)
```

### 4.3 Structure des endpoints API REST

#### Authentification

| Méthode | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Inscription (envoie OTP au numéro) | Non |
| POST | `/api/auth/verify-otp` | Vérifier le code OTP reçu par SMS | Non |
| POST | `/api/auth/resend-otp` | Renvoyer un code OTP (cooldown 60s) | Non |
| POST | `/api/auth/login` | Connexion | Non |
| POST | `/api/auth/refresh` | Rafraîchir le token | Oui |
| POST | `/api/auth/forgot-password` | Demande de réinitialisation | Non |
| POST | `/api/auth/reset-password` | Réinitialiser le mot de passe | Non |

#### Utilisateurs

| Méthode | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/users/me` | Profil de l'utilisateur connecté | Oui |
| PUT | `/api/users/me` | Modifier son profil | Oui |
| GET | `/api/users/:id` | Profil public d'un utilisateur | Oui |
| GET | `/api/admin/users` | Liste des utilisateurs (admin) | Admin |
| PUT | `/api/admin/users/:id/block` | Bloquer un utilisateur | Admin |

#### Livres

| Méthode | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/books` | Liste des livres (avec filtres) | Oui |
| GET | `/api/books/:id` | Détails d'un livre | Oui |
| POST | `/api/books` | Ajouter un livre | Oui |
| PUT | `/api/books/:id` | Modifier un livre | Oui (propriétaire) |
| DELETE | `/api/books/:id` | Supprimer un livre | Oui (propriétaire/admin) |
| GET | `/api/books/me` | Mes livres proposés | Oui |

#### Demandes

| Méthode | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/requests` | Demander un livre | Oui |
| GET | `/api/requests/me` | Mes demandes | Oui |
| GET | `/api/admin/requests` | Toutes les demandes | Admin |
| PUT | `/api/admin/requests/:id` | Mettre à jour une demande | Admin |

#### Fournitures

| Méthode | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/supplies` | Liste des fournitures (avec filtres) | Oui |
| GET | `/api/supplies/:id` | Détails d'une fourniture | Oui |
| POST | `/api/supplies` | Ajouter une fourniture | Fournisseur/Admin |
| POST | `/api/supplies/:id/contact` | Demander un contact fournisseur | Oui |

#### Notifications

| Méthode | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/notifications` | Mes notifications | Oui |
| PUT | `/api/notifications/:id/read` | Marquer comme lue | Oui |
| PUT | `/api/notifications/read-all` | Tout marquer comme lu | Oui |

### 4.4 Paramètres de filtrage (GET /api/books)

| Paramètre | Type | Description |
|---|---|---|
| `search` | String | Recherche par mot-clé (titre, auteur) |
| `niveau` | String | Filtrer par niveau scolaire |
| `classe` | String | Filtrer par classe |
| `etat` | Enum | 'neuf' ou 'occasion' |
| `page` | Integer | Numéro de page (pagination) |
| `limit` | Integer | Nombre de résultats par page (défaut: 20) |
| `sort` | String | Tri : 'date_desc', 'date_asc', 'titre_asc' |

---

## 5. Analyse de sécurité

### 5.1 Authentification et autorisation

| Mesure | Détail |
|---|---|
| Hashage des mots de passe | bcrypt avec un coût (salt rounds) de 12 |
| Vérification téléphone (OTP) | Code SMS à l'inscription, expiration 5 min, max 5 tentatives, cooldown 60s entre renvois, max 3 envois/heure par numéro |
| Tokens JWT | Access token (15 min) + Refresh token (7 jours) |
| Validation des entrées | Validation côté client ET serveur (Joi / Zod) |
| Rate limiting | Limiter les tentatives de connexion (5/min par IP) |
| CORS | Restreint aux domaines autorisés |
| HTTPS | Obligatoire en production |

### 5.2 Protection des données personnelles

- Aucune information personnelle (téléphone, adresse, email) n'est partagée entre utilisateurs.
- Seules les informations du livre sont publiques (titre, niveau, état, photo).
- L'équipe admin agit comme intermédiaire unique pour les échanges.
- Les données sensibles sont chiffrées au repos dans la base de données.

### 5.3 Protection contre les abus

| Menace | Contre-mesure |
|---|---|
| Faux comptes | Vérification du numéro de téléphone par OTP à l'inscription, unicité du numéro, rate limiting sur l'inscription |
| Spam d'annonces | Modération admin avant publication (ou post-modération avec signalement) |
| Injection SQL | Utilisation d'un ORM (Prisma) avec requêtes paramétrées |
| XSS | Sanitisation des entrées, Content Security Policy |
| Upload malveillant | Validation du type MIME et de la taille des fichiers image |

---

## 6. Analyse de l'interface utilisateur

### 6.1 Arborescence des écrans

```
Application
├── Splash Screen
├── Onboarding (première utilisation)
├── Auth
│   ├── Connexion
│   ├── Inscription
│   ├── Vérification OTP (saisie du code SMS)
│   └── Mot de passe oublié
├── Accueil (switch entre les 2 modes)
│   ├── Mode "Je recherche un livre"
│   │   ├── Liste des livres (avec filtres)
│   │   ├── Détails d'un livre
│   │   └── Confirmation de demande
│   └── Mode "J'ai un livre"
│       ├── Formulaire d'ajout
│       ├── Mes livres proposés
│       └── Détails / Modifier un livre
├── Fournitures scolaires
│   ├── Liste des fournitures (avec filtres)
│   ├── Détails d'une fourniture
│   └── Formulaire de contact fournisseur
├── Notifications
│   └── Liste des notifications
├── Profil
│   ├── Voir mon profil
│   ├── Modifier mon profil
│   └── Mes demandes (historique)
└── Paramètres
    ├── Thème (clair / sombre)
    ├── Notifications (activer/désactiver)
    └── Déconnexion
```

### 6.2 Navigation principale

- **Bottom Tab Navigation** avec 4 onglets :
  1. Accueil (modes livres)
  2. Fournitures
  3. Notifications (avec badge de compteur)
  4. Profil

- **Toggle switch** en haut de l'écran d'accueil pour basculer entre "Je recherche" et "J'ai un livre".

### 6.3 Charte graphique

| Élément | Spécification |
|---|---|
| Couleurs principales | Palette douce : bleu éducation ( #4A90D9 ), vert confiance ( #5CB85C ) |
| Couleurs secondaires | Gris clair ( #F5F5F5 ), blanc ( #FFFFFF ) |
| Thème sombre | Fond #1A1A2E, texte #E0E0E0 |
| Typographie | Sans-serif (Inter ou Poppins), lisible pour enfants et adultes |
| Icônes | Set cohérent (Feather Icons ou Material Icons) |
| Coins arrondis | Border radius : 12px pour les cartes, 8px pour les boutons |
| Espacement | Système de 8px (8, 16, 24, 32...) |

---

## 7. Règles de gestion

| ID | Règle | Description |
|---|---|---|
| RG-01 | Unicité email | Un email ne peut être associé qu'à un seul compte. |
| RG-01b | Unicité téléphone | Un numéro de téléphone ne peut être associé qu'à un seul compte. |
| RG-01c | Vérification téléphone | Le compte n'est activé qu'après vérification du numéro par code OTP SMS. |
| RG-02 | Validation photo | Chaque livre doit avoir au moins une photo (max 5 Mo, formats : JPG, PNG). |
| RG-03 | Statut livre | Un livre passe de "disponible" à "réservé" puis "échangé". Un livre réservé ne peut plus recevoir de nouvelles demandes. |
| RG-04 | Demande unique | Un utilisateur ne peut faire qu'une seule demande active par livre. |
| RG-05 | Propriétaire | Un utilisateur ne peut pas demander son propre livre. |
| RG-06 | Modération | L'administrateur peut supprimer tout livre jugé inapproprié. |
| RG-07 | Blocage | Un utilisateur bloqué ne peut plus se connecter ni publier. |
| RG-08 | Notification | Une notification est envoyée au propriétaire à chaque demande sur un de ses livres. |
| RG-09 | Anonymat | Les coordonnées personnelles ne sont jamais affichées aux autres utilisateurs. |
| RG-10 | Fournisseur | Seuls les comptes de type "fournisseur" peuvent ajouter des fournitures. |

---

## 8. Contraintes non fonctionnelles

### 8.1 Performance

| Critère | Objectif |
|---|---|
| Temps de chargement de la liste | < 2 secondes |
| Temps de réponse API | < 500 ms (95e percentile) |
| Upload d'image | < 5 secondes pour une image de 5 Mo |
| Taille de l'APK | < 30 Mo |

### 8.2 Disponibilité

- Disponibilité cible : 99.5% (hors maintenance planifiée).
- Maintenance planifiée en heures creuses (2h-5h).

### 8.3 Scalabilité

- Architecture modulaire permettant le passage à l'échelle horizontal du backend.
- Pagination obligatoire sur toutes les listes.
- Mise en cache des requêtes fréquentes (liste de livres, fournitures).

### 8.4 Compatibilité

- Android : API 24+ (Android 7.0 Nougat et supérieur).
- iOS (phase 2) : iOS 14+.

---

## 9. Plan de tests

### 9.1 Tests unitaires

| Module | Éléments à tester |
|---|---|
| Auth | Hashage, génération/validation JWT, validation des champs |
| Livres | CRUD, filtrage, changement de statut |
| Demandes | Création, règles de gestion (RG-04, RG-05), mise à jour statut |
| Fournitures | CRUD, filtrage par type |

### 9.2 Tests d'intégration

| Scénario | Description |
|---|---|
| Parcours complet recherche | Inscription -> Connexion -> Recherche -> Demande -> Notification |
| Parcours complet proposition | Connexion -> Ajout livre -> Réception demande -> Échange |
| Parcours fournitures | Connexion -> Consultation fournitures -> Contact fournisseur |

### 9.3 Tests de sécurité

- Tentative d'accès sans token JWT.
- Tentative d'accès à des ressources d'un autre utilisateur.
- Injection dans les champs de formulaire.
- Upload de fichiers non-image.
- Dépassement du rate limiting.

### 9.4 Tests d'interface

- Affichage correct en mode clair et sombre.
- Responsive sur différentes tailles d'écran Android.
- Navigation entre les modes "Je recherche" / "J'ai un livre".
- Affichage des états vides (aucun livre, aucune notification).

---

## 10. Planning prévisionnel

| Phase | Durée estimée | Livrables |
|---|---|---|
| **Phase 1** : Analyse & Maquettage | 1 semaine | Cahier d'analyse, maquettes UI (Figma), modèle de données |
| **Phase 2** : Setup & Auth | 1 semaine | Projet initialisé, API auth fonctionnelle, écrans auth mobile |
| **Phase 3** : Module Livres | 1.5 semaines | CRUD livres, recherche/filtres, écrans mobile, upload photos |
| **Phase 4** : Demandes & Notifications | 1 semaine | Système de demandes, notifications push, écrans mobile |
| **Phase 5** : Fournitures scolaires | 1 semaine | Module fournitures, contact fournisseurs, écrans mobile |
| **Phase 6** : Tableau de bord admin | 1 semaine | Interface web admin, modération, gestion demandes |
| **Phase 7** : Tests & Corrections | 1 semaine | Tests complets, corrections de bugs, optimisations |
| **Phase 8** : Déploiement | 0.5 semaine | Publication Play Store, documentation, support |
| **Total estimé** | **~8 semaines** | |

---

## 11. Risques identifiés

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Faible adoption initiale | Moyenne | Élevé | Campagne de communication ciblée dans les établissements scolaires |
| Abus / faux comptes | Moyenne | Moyen | Vérification email, modération active, signalement |
| Charge serveur élevée (rentrée scolaire) | Faible | Élevé | Mise en cache, scaling horizontal, pagination |
| Non-conformité RGPD / données personnelles | Faible | Élevé | Politique de confidentialité, minimisation des données, consentement |
| Livres non conformes (contenu inapproprié) | Faible | Moyen | Modération des photos et descriptions avant publication |

---

## 12. Glossaire

| Terme | Définition |
|---|---|
| **JWT** | JSON Web Token — standard pour l'authentification stateless via des tokens signés |
| **API REST** | Interface de programmation basée sur les principes REST (HTTP, ressources, verbes) |
| **ORM** | Object-Relational Mapping — couche d'abstraction entre le code et la base de données |
| **FCM** | Firebase Cloud Messaging — service Google pour les notifications push |
| **MVP** | Minimum Viable Product — version minimale fonctionnelle du produit |
| **CRUD** | Create, Read, Update, Delete — opérations de base sur les données |
| **BCrypt** | Algorithme de hashage de mots de passe avec salage intégré |
| **CDN** | Content Delivery Network — réseau de distribution de contenu pour accélérer le chargement |
