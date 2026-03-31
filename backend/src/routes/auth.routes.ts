/**
 * @file auth.routes.ts
 * @description Déclaration des routes du module Authentification.
 *
 * Ce fichier lie chaque endpoint HTTP (méthode + chemin) à son Controller.
 * Le Router est ensuite monté sur app.ts avec le préfixe /api/auth.
 *
 * Routes publiques (sans JWT) :
 *  POST /api/auth/register  → Inscription (Controller: register)
 *  POST /api/auth/login     → Connexion   (Controller: login)
 *
 * Routes protégées à venir (avec requireAuth) :
 *  POST /api/auth/refresh   → Renouvellement de l'Access Token via le Refresh Token
 *  POST /api/auth/logout    → Révocation du Refresh Token en base de données
 */
import { Router } from 'express';
import { register, login, refresh, logout } from '../controllers/auth.controller';

const router = Router();

// --- ROUTES PUBLIQUES (ne nécessitent pas d'Access Token) ---
router.post('/register', register);
router.post('/login', login);

// --- ROUTES DE GESTION DE SESSION ---
// Ces routes reçoivent le Refresh Token dans le body de la requête
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;
