# 🏠 Stud'Housing Trust

> Plateforme de mise en relation entre propriétaires et étudiants chercheurs de logement au Cameroun.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)
![Prisma](https://img.shields.io/badge/Prisma-ORM-orange)

## 🎯 Description

Stud'Housing Trust est une API REST conçue pour faciliter la recherche et la gestion de logements pour étudiants. La plateforme permet :

- Aux **propriétaires** de publier et gérer leurs annonces
- Aux **étudiants** de rechercher et contacter des logements
- Un système de **confiance** (TrustScore) pour sécuriser les transactions

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

### Authentification

| Méthode | Endpoint             | Description         |
| ------- | -------------------- | ------------------- |
| POST    | `/api/auth/register` | Inscription         |
| POST    | `/api/auth/login`    | Connexion           |
| POST    | `/api/auth/refresh`  | Rafraîchir le token |
| POST    | `/api/auth/logout`   | Déconnexion         |

### Utilisateurs

| Méthode | Endpoint             | Description          |
| ------- | -------------------- | -------------------- |
| GET     | `/api/users/me`      | Mon profil           |
| GET     | `/api/users/:id`     | Profil public        |
| PATCH   | `/api/users/profile` | Modifier mon profil  |
| DELETE  | `/api/users/account` | Supprimer mon compte |

### Annonces

| Méthode | Endpoint            | Description           |
| ------- | ------------------- | --------------------- |
| GET     | `/api/listings`     | Liste des annonces    |
| GET     | `/api/listings/:id` | Détail d'une annonce  |
| POST    | `/api/listings`     | Créer une annonce     |
| PATCH   | `/api/listings/:id` | Modifier une annonce  |
| DELETE  | `/api/listings/:id` | Supprimer une annonce |

### Admin

| Méthode | Endpoint                         | Description            |
| ------- | -------------------------------- | ---------------------- |
| GET     | `/api/admin/users`               | Liste des utilisateurs |
| PATCH   | `/api/admin/users/:id/status`    | Bannir un utilisateur  |
| GET     | `/api/admin/listings/pending`    | Annonces en attente    |
| PATCH   | `/api/admin/listings/:id/status` | Approuver/Rejeter      |

## 🛠️ Stack technique

| Technologie    | Usage                                      |
| -------------- | ------------------------------------------ |
| **Node.js**    | Runtime                                    |
| **Express.js** | Framework API                              |
| **TypeScript** | Typage statique                            |
| **Prisma**     | ORM PostgreSQL                             |
| **Supabase**   | Base de données PostgreSQL                 |
| **JWT**        | Authentification (Access + Refresh tokens) |
| **Zod**        | Validation des données                     |
| **Cloudinary** | Stockage d'images                          |
| **Pino**       | Logging structuré                          |
| **Algolia**    | Recherche avancée                          |
| **Resend**     | Emails transactionnels                     |

## 📁 Structure du projet

```
backend/
├── src/
│   ├── config/           #Configurations (DB, Cloudinary, etc.)
│   ├── constants/       #Constantes (codes d'erreur, etc.)
│   ├── middlewares/     #Middleware (auth, rate limit, etc.)
│   ├── modules/         #Modules de l'application
│   │   ├── admin/       #Module admin
│   │   ├── auth/        #Module authentification
│   │   ├── listing/     #Module annonces
│   │   └── user/        #Module utilisateur
│   ├── services/        #Services partagés
│   ├── utils/           #Utilitaires
│   └── app.ts           #Configuration Express
├── prisma/
│   └── schema.prisma    #Schéma de la base de données
└── package.json
```

## 🔐 Sécurité

- ✅ Rate Limiting (protection DDoS)
- ✅ Validation Zod (sanitization XSS)
- ✅ JWT avec Access Token (15min) + Refresh Token (30j)
- ✅ Hachage bcrypt (10 rounds)
- ✅ CORS configuré
- ✅ Helmet.js (headers de sécurité)

## 🔧 Variables d'environnement

```env
DATABASE_URL=           #URL Supabase PostgreSQL
JWT_SECRET=              #Secret pour JWT
JWT_REFRESH_SECRET=      #Secret pour refresh token
CLOUDINARY_CLOUD_NAME=  #Cloudinary
CLOUDINARY_API_KEY=     #Cloudinary
CLOUDINARY_API_SECRET=  #Cloudinary
ALGOLIA_APP_ID=         #Algolia (optionnel)
ALGOLIA_ADMIN_KEY=      #Algolia (optionnel)
ALLOWED_ORIGINS=        #Origins CORS
RESEND_API_KEY=         #Resend (optionnel)
```

## 📄 Licence

MIT © 2026 Stud'Housing Trust
