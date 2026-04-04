/**
 * @file auth.routes.ts
 * @description Déclaration des routes du module Authentification.
 *
 * Ce fichier lie chaque endpoint HTTP (méthode + chemin) à son Controller.
 * Le Router est ensuite monté sur app.ts avec le préfixe /api/auth.
 *
 * Routes publiques (sans JWT) :
 *  POST /api/auth/register  → Inscription (Controller: register) - Rate limited: 3/heure
 *  POST /api/auth/login     → Connexion   (Controller: login) - Rate limited: 5/15min
 *
 * Routes protégées (avec requireAuth) :
 *  POST /api/auth/refresh   → Renouvellement de l'Access Token via le Refresh Token
 *  POST /api/auth/logout    → Révocation du Refresh Token en base de données
 */
import { Router } from 'express';
import * as AuthController from './auth.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { loginLimiter, registerLimiter } from '../../middlewares/rateLimit.middleware';

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Inscription d'un nouvel utilisateur
 * @access Public
 * @rate 3 requêtes par heure pour prévenir les inscriptions massives
 */
router.post('/register', registerLimiter, AuthController.register);

/**
 * @route POST /api/auth/login
 * @desc Connexion utilisateur
 * @access Public
 * @rate 5 requêtes par 15 minutes pour prévenir le brute force
 */
router.post('/login', loginLimiter, AuthController.login);

/**
 * @route POST /api/auth/refresh
 * @desc Renouvellement de l'Access Token via Refresh Token
 * @access Public
 */
router.post('/refresh', AuthController.refresh);

/**
 * @route POST /api/auth/logout
 * @desc Déconnexion (révocation du Refresh Token)
 * @access Private
 */
router.post('/logout', requireAuth, AuthController.logout);

export default router;

