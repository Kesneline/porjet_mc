# 🏠 Stud'Housing Trust

> Plateforme de mise en relation entre propriétaires et étudiants chercheurs de logement au Cameroun.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)
![Prisma](https://img.shields.io/badge/Prisma-ORM-orange)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-blue)

## 🎯 Description

Stud'Housing Trust est une API REST conçue pour faciliter la recherche et la gestion de logements pour étudiants au Cameroun. La plateforme permet :

- Aux **propriétaires** de publier et gérer leurs annonces de logement
- Aux **étudiants** de rechercher, filtrer et contacter des logements
- Un système de **confiance** (TrustScore) pour sécuriser les transactions
- Un système de **messagerie** pour faciliter la communication
- Un système de **paiement** via Mobile Money (MTN MoMo, Orange Money)
- Une **correspondance intelligente** via IA (Claude API)

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+
- PostgreSQL (Supabase)
- npm ou yarn

### Installation

```bash
# Cloner le projet
git clone https://github.com/Kesneline/porjet_mc.git
cd porjet_mc/backend

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Modifier .env avec vos credentials

# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma db push

# Démarrer le serveur
npm run dev
```

## 📡 API Endpoints

### 🔑 Authentification (`/api/auth`)

| Méthode | Endpoint    | Description                               |
| ------- | ----------- | ----------------------------------------- |
| POST    | `/register` | Inscription d'un nouvel utilisateur       |
| POST    | `/login`    | Connexion utilisateur                     |
| POST    | `/refresh`  | Renouvellement du Access Token            |
| POST    | `/logout`   | Déconnexion (révocation du Refresh Token) |
| DELETE  | `/account`  | Suppression de son propre compte          |

> **Note :** `/register` et `/login` sont publics. Les autres endpoints nécessitent une authentification.

---

### 👤 Utilisateurs (`/api/users`)

| Méthode | Endpoint   | Description                             |
| ------- | ---------- | --------------------------------------- |
| GET     | `/:id`     | Profil public d'un utilisateur          |
| GET     | `/me`      | Mon profil (authentifié)                |
| PATCH   | `/profile` | Modifier mon profil (avatar, bio, etc.) |
| DELETE  | `/account` | Supprimer mon compte                    |

> **Note :** `GET /:id` est public. Les autres endpoints nécessitent une authentification.

---

### 🏠 Annonces (`/api/listings`)

| Méthode | Endpoint | Description                                                         |
| ------- | -------- | ------------------------------------------------------------------- |
| GET     | `/`      | Liste des annonces (filtres basiques : ville, type, prix)           |
| GET     | `/`      | Liste des annonces (filtres avancés : équipements, distance campus) |
| GET     | `/map`   | Données géographiques pour carte interactive                        |
| GET     | `/:id`   | Détail d'une annonce                                                |
| POST    | `/`      | Créer une nouvelle annonce                                          |
| PATCH   | `/:id`   | Modifier une annonce                                                |
| DELETE  | `/:id`   | Supprimer une annonce                                               |

> **Note :** Les endpoints GET sont publics. POST/PATCH/DELETE nécessitent une authentification.

---

### 🔒 Admin (`/api/admin`)

| Méthode | Endpoint               | Description                         |
| ------- | ---------------------- | ----------------------------------- |
| GET     | `/users`               | Liste de tous les utilisateurs      |
| GET     | `/users/:id`           | Détails d'un utilisateur            |
| PATCH   | `/users/:id/verify`    | Valider l'identité d'un utilisateur |
| PATCH   | `/users/:id/role`      | Changer le rôle d'un utilisateur    |
| PATCH   | `/users/:id/status`    | Suspendre ou bannir un utilisateur  |
| DELETE  | `/users/:id`           | Supprimer un utilisateur            |
| GET     | `/listings/pending`    | Annonces en attente de validation   |
| PATCH   | `/listings/:id/status` | Approuver ou rejeter une annonce    |
| GET     | `/reports`             | Liste des signalements              |
| PATCH   | `/reports/:id/resolve` | Résoudre un signalement             |
| GET     | `/stats`               | Statistiques globales du système    |

> **Note :** Tous les endpoints admin nécessitent le rôle `ADMIN` ou `MODERATOR`.

---

### 💬 Messagerie (`/api/conversations`)

| Méthode | Endpoint        | Description                            |
| ------- | --------------- | -------------------------------------- |
| POST    | `/`             | Démarrer ou reprendre une conversation |
| GET     | `/`             | Lister mes conversations               |
| GET     | `/:id/messages` | Lire les messages d'une conversation   |
| POST    | `/:id/messages` | Envoyer un message                     |

> **Note :** Tous les endpoints nécessitent une authentification. Les numéros de téléphone ne sont jamais exposés.

---

### 🔍 Recherche (`/api/search`)

| Méthode | Endpoint | Description                     |
| ------- | -------- | ------------------------------- |
| GET     | `/`      | Recherche full-text via Algolia |

> **Note :** Endpoint public. Utilise Algolia pour une recherche rapide et pertinente.

---

### 🤖 Matching Intelligent (`/api/matching`)

| Méthode | Endpoint | Description                                              |
| ------- | -------- | -------------------------------------------------------- |
| POST    | `/`      | Classement personnalisé des annonces via IA (Claude API) |

> **Note :** Nécessite une authentification.

---

### 💳 Paiements (`/api/payments`)

| Méthode | Endpoint               | Description                                  |
| ------- | ---------------------- | -------------------------------------------- |
| POST    | `/initiate`            | Initier un paiement (MTN MoMo, Orange Money) |
| GET     | `/:referenceId/status` | Vérifier le statut d'un paiement             |
| GET     | `/my`                  | Historique de mes paiements                  |
| POST    | `/webhook/orange`      | Webhook pour callback Orange Money           |

> **Note :** Le webhook Orange Money est public. Les autres endpoints nécessitent une authentification.

---

## 🔐 Authentification

L'API utilise un système de **JWT (JSON Web Tokens)** avec deux types de tokens :

| Token         | Durée      | Usage                          |
| ------------- | ---------- | ------------------------------ |
| Access Token  | 15 minutes | Authentification API           |
| Refresh Token | 30 jours   | Renouvellement du Access Token |

### Format des headers

```bash
Authorization: Bearer <access_token>
```

### Flux d'authentification

```
1. POST /api/auth/register  → Créer un compte
2. POST /api/auth/login     → Obtenir les tokens
3. [Utiliser l'API]
4. POST /api/auth/refresh   → Renouveler le Access Token (quand expiré)
5. POST /api/auth/logout    → Révoquer le Refresh Token
```

## 🛠️ Stack technique

| Technologie            | Usage                                      |
| ---------------------- | ------------------------------------------ |
| **Node.js**            | Runtime JavaScript                         |
| **Express.js**         | Framework API REST                         |
| **TypeScript**         | Typage statique                            |
| **Prisma**             | ORM PostgreSQL                             |
| **Supabase**           | Base de données PostgreSQL                 |
| **JWT**                | Authentification (Access + Refresh tokens) |
| **Zod**                | Validation et sanitization des données     |
| **Cloudinary**         | Stockage et gestion des images             |
| **Pino**               | Logging structuré haute performance        |
| **Algolia**            | Recherche full-text et filtres avancés     |
| **Claude API**         | Matching intelligent par IA                |
| **Resend**             | Emails transactionnels                     |
| **express-rate-limit** | Protection contre les attaques DDoS        |
| **Helmet.js**          | Headers de sécurité HTTP                   |

## 📁 Structure du projet

```
backend/
├── src/
│   ├── config/                 # Configurations (DB, Cloudinary, JWT, etc.)
│   ├── constants/              # Constantes (codes d'erreur, etc.)
│   ├── middlewares/            # Middlewares (auth, rate limit, upload, etc.)
│   ├── modules/                # Modules de l'application
│   │   ├── admin/              # Module administration
│   │   ├── auth/              # Module authentification
│   │   ├── listing/            # Module annonces
│   │   ├── matching/           # Module matching IA
│   │   ├── messaging/          # Module messagerie
│   │   ├── payment/           # Module paiements
│   │   ├── search/            # Module recherche (Algolia)
│   │   └── user/              # Module utilisateurs
│   ├── services/              # Services partagés (email, cloudinary, etc.)
│   ├── utils/                  # Utilitaires (sanitization, response formatter)
│   ├── app.ts                  # Configuration Express
│   └── index.ts                # Point d'entrée
├── prisma/
│   └── schema.prisma          # Schéma de la base de données
├── .env.example                # Template des variables d'environnement
├── package.json
└── tsconfig.json
```

## 🤝 Comment contribuer

Nous accueillons les contributions de la communauté ! Voici comment participer :

### 1. Fork le projet

Cliquez sur le bouton "Fork" en haut de la page GitHub.

### 2. Clonez votre fork

```bash
git clone https://github.com/VOTRE-USERNAME/porjet_mc.git
cd porjet_mc/backend
```

### 3. Créez une branche

```bash
git checkout -b feature/ma-nouvelle-fonctionnalite
```

### 4. Faites vos modifications

- Écrivez du code propre et documenté
- Ajoutez des tests si possible
- Respectez les conventions du projet

### 5. Commitez vos changements

```bash
git add .
git commit -m "feat: description de la fonctionnalité"
```

### 6. Pushez vers votre fork

```bash
git push origin feature/ma-nouvelle-fonctionnalite
```

### 7. Ouvrez une Pull Request

- Allez sur la page GitHub du projet original
- Cliquez sur "New Pull Request"
- Décrivez vos changements en détail

## 🔧 Variables d'environnement

```env
# Base de données
DATABASE_URL=              # URL PostgreSQL Supabase

# Authentification JWT
JWT_SECRET=                # Secret pour Access Token (HS256)
JWT_REFRESH_SECRET=        # Secret pour Refresh Token

# Cloudinary (Images)
CLOUDINARY_CLOUD_NAME=    # Nom du cloud
CLOUDINARY_API_KEY=       # Clé API
CLOUDINARY_API_SECRET=    # Secret API

# Algolia (Recherche)
ALGOLIA_APP_ID=           # ID Application
ALGOLIA_SEARCH_KEY=       # Clé de recherche (public)
ALGOLIA_ADMIN_KEY=        # Clé admin (privé)

# CORS
ALLOWED_ORIGINS=           # Origines autorisées (séparées par virgules)

# Email (Resend)
RESEND_API_KEY=            # Clé API Resend

# IA (Claude)
CLAUDE_API_KEY=           # Clé API Claude (optionnel)
```

## ⚙️ Sécurité

L'API implémente plusieurs couches de sécurité :

- ✅ **Rate Limiting** : Limitation des requêtes par IP et endpoint
  - `/auth/register` : 3/heure
  - `/auth/login` : 5/15min
  - `/listings` : 60/minute (public), 10/heure (authentifié)

- ✅ **Validation Zod** : Sanitization et validation de toutes les entrées
  - Protection XSS
  - Limites de longueur
  - Validation des types

- ✅ **JWT** : Tokens sécurisés avec expiration
  - Access Token : 15 minutes
  - Refresh Token : 30 jours (stocké en base)

- ✅ **Bcrypt** : Hachage des mots de passe (10 rounds)

- ✅ **CORS** : Restrictions d'origine configurables

- ✅ **Helmet.js** : Headers de sécurité HTTP

- ✅ **Audit Log** : Toutes les actions admin sont tracées

## 📄 Licence

MIT © 2026 Stud'Housing Trust
