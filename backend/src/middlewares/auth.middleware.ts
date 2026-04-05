/**
 * @file auth.middleware.ts
 * @description Middlewares de sécurité pour les routes protégées.
 *
 * Ce module contient deux middlewares réutilisables qui s'insèrent entre
 * la Route et le Controller dans la chaîne Express :
 *
 * 1. requireAuth   → Vérifie que la requête contient un JWT valide.
 *                    Si oui, injecte le payload (userId, role) dans req.user.
 *                    Si non, bloque avec HTTP 401 Unauthorized.
 *
 * 2. requireRole   → S'utilise APRÈS requireAuth. Vérifie que le rôle de
 *                    l'utilisateur (req.user.role) est dans la liste des rôles
 *                    autorisés. Si non, bloque avec HTTP 403 Forbidden.
 *
 * Exemple d'usage dans une route protégée (Owner seulement) :
 *   router.post('/listings', requireAuth, requireRole(['OWNER', 'ADMIN']), createListing);
 */
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt.utils';
import { errorResponse } from '../utils/response.formatter';

// Augmentation du type Express.Request pour que TypeScript accepte req.user
// dans tous les controllers sans erreur de compilation.
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload; // Défini après vérification du token dans requireAuth
    }
  }
}

/**
 * Middleware : Vérifie la présence et la validité du JWT Bearer Token.
 * Doit être placé AVANT tout autre middleware de route qui nécessite un utilisateur.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    // Vérifie que l'en-tête Authorization est présent ET commence par "Bearer "
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json(errorResponse('Accès refusé. Bearer Token JWT manquant.'));
      return;
    }

    // Extrait le token après "Bearer " (chaîne split sur l'espace, on prend l'index 1)
    const token = authHeader.split(' ')[1];

    // Décode et vérifie la signature du token. Lance une exception si invalide.
    const decoded = verifyAccessToken(token);

    // Injecte les données de l'utilisateur dans l'objet Request pour les controllers
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json(errorResponse('Token JWT invalide ou expiré. Refaites /api/auth/login.'));
  }
};

/**
 * Middleware Factory : Restreint l'accès à un ou plusieurs rôles spécifiques.
 * Doit toujours être utilisé APRÈS requireAuth dans la chaîne de middlewares.
 *
 * @param allowedRoles - Tableau des rôles ayant accès à la route.
 * @returns Un middleware Express configuré pour les rôles spécifiés.
 *
 * @example
 * // Route accessible uniquement aux propriétaires et aux admins :
 * router.delete('/:id', requireAuth, requireRole(['OWNER', 'ADMIN']), deleteUser);
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Sécurité défensive : s'assure que requireAuth a bien été appelé avant
    if (!req.user) {
      res.status(401).json(errorResponse('Utilisateur non authentifié.'));
      return;
    }

    // Vérifie si le rôle de l'utilisateur est dans la liste des rôles autorisés
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json(
        errorResponse(`Accès interdit. Rôles requis: ${allowedRoles.join(', ')}`)
      );
      return;
    }

    // Rôle valide → on laisse passer vers le controller
    next();
  };
};
