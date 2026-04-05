/**
 * @file correlationId.middleware.ts
 * @description Middleware pour assigner un unique request ID à chaque requête.
 *
 * Permet de tracer une requête ENTIRE à travers tous les logs:
 * - Client envoie X-Request-ID header → utiliser celui-là
 * - Sinon → générer un UUID aléatoire
 * - Ajouter à la réponse header X-Request-ID (client peut track)
 *
 * Exemple flow:
 * 1. Client: POST /api/auth/login avec X-Request-ID: "abc123"
 * 2. Middleware: req.id = "abc123" + ajoute au response header
 * 3. Tous les logs: {"requestId": "abc123", ...}
 * 4. Si erreur → tous les logs liés sont faciles à trouver
 */
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Assigner un request ID unique à chaque requête
 * IMPORTANT: Ajouter EN PREMIER (avant autres middlewares)
 */
export const correlationId = (req: Request, res: Response, next: NextFunction): void => {
  // Utiliser le header X-Request-ID si fourni, sinon générer un UUID
  const id = (req.headers['x-request-id'] as string) || uuidv4();

  // Attacher à la requête pour utilisation dans les logs
  req.id = id;

  // Ajouter au response header (client peut tracker la réponse)
  res.setHeader('X-Request-ID', id);

  next();
};

