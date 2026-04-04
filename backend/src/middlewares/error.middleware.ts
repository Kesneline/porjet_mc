/**
 * @file error.middleware.ts
 * @description Middleware de gestion centralisée des erreurs Express.
 *
 * PROBLÈME résolu :
 * Sans ce middleware, chaque controller a son propre try/catch qui gère
 * les erreurs de façon différente et répétitive. C'est du code dupliqué.
 *
 * SOLUTION :
 * Express a un mécanisme prévu pour ça : un middleware "error handler" avec
 * 4 arguments (err, req, res, next). Quand n'importe quel controller appelle
 * `next(error)` ou quand une erreur est lancée dans un middleware async,
 * Express la route automatiquement vers ce gestionnaire centralisé.
 *
 * USAGE dans les controllers (à la place du try/catch) :
 *   export const register = async (req, res, next) => {
 *     try { ... } catch (err) { next(err); } // ← Express fait tout le reste
 *   };
 *
 * Ce middleware doit être déclaré EN DERNIER dans app.ts, après toutes les routes.
 */
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { errorResponse } from '../utils/response.formatter';

/**
 * Classe d'erreur personnalisée pour les erreurs métier "attendues".
 * Permet de distinguer une erreur volontaire (ex: "email déjà pris") d'une
 * erreur système inattendue (ex: base de données inaccessible).
 *
 * @example
 * // Dans un service :
 * throw new AppError('Cet email est déjà utilisé.', 409);
 */
export class AppError extends Error {
  /** Code HTTP à retourner (ex: 400, 401, 403, 404, 409, 500) */
  public statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    // Maintient la chaîne de prototype correcte pour instanceof
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Middleware global de gestion des erreurs Express.
 * Intercepte TOUTES les erreurs passées via `next(error)` dans l'application.
 *
 * Gère 3 types d'erreurs :
 * 1. ZodError        → Erreur de validation (données invalides du client) → HTTP 422
 * 2. AppError        → Erreur métier volontaire (email déjà pris, etc.)  → HTTP variable
 * 3. Error générique → Erreur système inattendue (bug, DB down, etc.)    → HTTP 500
 */
export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {

  // --- 1. Erreur de validation Zod (données invalides du client) ---
  if (err instanceof ZodError) {
    // On formate les erreurs Zod en un tableau lisible pour le client
    const validationErrors = err.errors.map((e) => ({
      field: e.path.join('.'), // Ex: "email", "password"
      message: e.message,     // Ex: "Le format de l'email est invalide"
    }));
    res.status(422).json(
      errorResponse("Les données envoyées sont invalides.", validationErrors)
    );
    return;
  }

  // --- 2. Erreur métier volontaire (AppError) ---
  if (err instanceof AppError) {
    res.status(err.statusCode).json(errorResponse(err.message));
    return;
  }

  // --- 3. Erreur système inattendue ---
  // En production, on masque les détails techniques pour ne pas exposer l'infra
  console.error('❌ Erreur système non gérée:', err);
  const message = process.env.NODE_ENV === 'production'
    ? 'Une erreur interne est survenue. Veuillez réessayer.'
    : err.message; // En dev, on affiche le vrai message pour debugger

  res.status(500).json(errorResponse(message));
};
