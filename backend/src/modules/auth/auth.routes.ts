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
import * as AuthController from './auth.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Inscription d'un nouvel utilisateur
 * @access Public
 */
router.post('/register', AuthController.register);

/**
 * @route POST /api/auth/login
 * @desc Connexion utilisateur
 * @access Public
 */
router.post('/login', AuthController.login);

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
