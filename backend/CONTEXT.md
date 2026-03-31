# Contexte Systémique - Stud'Housing Trust (Backend)

*Ce document permet à l'IA d'avoir un "point de sauvegarde" permanent de l'état du projet et de l'architecture.*

## 📋 Progression des Jalons

- [x] **Étape 1 :** Initialisation & Architecture MVC 3-Tiers
- [x] **Étape 2 :** Modèles (Prisma) & Connexion Supabase (Port 6543)
- [x] **Étape 2.2 :** Synchronisation d'équipe (Dossier `/backend` sur Git)
- [x] **Étape 3 :** Authentification & Sécurité (JWT Multi-rôles, Zod)
- [⚙️] **Étape 4 :** Gestion Logements (CRUD, Cloudinary)
- [ ] **Étape 5 :** Recherche & Filtrage (Algolia)
- [ ] **Étape 6 :** Confiance (Avis, Signalements, TrustScore)
- [ ] **Étape 7 :** Trésorerie (Mobile Money)
- [ ] **Étape 8 :** Intelligence Artificielle (Claude API)
- [ ] **Étape 9 :** Notifications Firebase (FCM) & Analytics

## 🏗️ Architecture Actuelle
- **Dossier de travail :** `/backend`
- **Design Pattern :** API REST en 3-Tiers strict (Routes -> Controllers -> Services)
- **Base de Données :** PostgreSQL (via Supabase) interfacé par Prisma ORM
- **Validation** : Zod et DTOs TypeScript (ZodError mappées auto)
- **Format de Réponse :** Centralisé via `response.formatter.ts` + `error.middleware.ts` pour la gestion des erreurs
- **Sécurité Globale :** Helmet.js, JWT Access 15m / Refresh 30j (RS256 prod / HS256 dev), bcryptjs (hachage 10 rounds)
