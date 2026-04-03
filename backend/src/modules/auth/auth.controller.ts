/**
 * @file auth.controller.ts
 * @description Contrôleur HTTP pour les endpoints d'authentification (Couche C du MVC).
 *
 * Ce contrôleur utilise maintenant deux améliorations majeures :
 *
 * 1. VALIDATION ZOD : Les données de req.body sont validées via Schema.parse()
 *    avant tout traitement. Si les données sont invalides, Zod lance une ZodError
 *    qui est capturée par le middleware globalErrorHandler et retournée en JSON 422.
 *
 * 2. DÉLÉGATION D'ERREURS : Grâce à `next(err)`, toutes les erreurs (validation,
 *    métier, système) sont déléguées au middleware d'erreurs global de app.ts.
 *    Plus de try/catch répétitifs et inconsistants → gestion unifiée.
 *
 * ENDPOINTS :
 *  POST /api/auth/register → handler: register
 *  POST /api/auth/login    → handler: login
 */
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { RegisterSchema, LoginSchema, RefreshSchema } from './auth.validator';
import { successResponse } from '../../utils/response.formatter';
import { AppError } from '../../middlewares/error.middleware';

/**
 * Handler POST /api/auth/register
 * 1. Valide req.body avec le schéma Zod RegisterSchema
 * 2. Appelle AuthService.register() avec les données validées et typées
 * 3. Retourne HTTP 201 avec { user, accessToken }
 *
 * En cas d'erreur (Zod ou AppError), `next(err)` délègue au globalErrorHandler.
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validation Zod : lance une ZodError si les données sont invalides
    // ZodError → capturée par globalErrorHandler → HTTP 422 avec détail des champs
    const validatedData = RegisterSchema.parse(req.body);

    // Appel du service avec des données typées et validées (plus de `any`)
    const result = await AuthService.register(validatedData);

    res.status(201).json(successResponse("Compte créé avec succès !", result));

  } catch (err) {
    // Délégation au middleware d'erreurs global (error.middleware.ts)
    next(err);
  }
};

/**
 * Handler POST /api/auth/login
 * 1. Valide req.body avec le schéma Zod LoginSchema
 * 2. Appelle AuthService.login() avec les données validées
 * 3. Retourne HTTP 200 avec { user, accessToken, refreshToken }
 *
 * En cas d'erreur, `next(err)` délègue au globalErrorHandler.
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validation Zod : format email, présence du mot de passe, etc.
    const validatedData = LoginSchema.parse(req.body);

    // Appel du service (vérification des identifiants + génération des tokens)
    const result = await AuthService.login(validatedData);

    res.status(200).json(successResponse("Connexion réussie", result));

  } catch (err) {
    next(err);
  }
};

/**
 * Handler POST /api/auth/refresh
 * 1. Valide req.body avec le schéma RefreshSchema (attend un UUID valide)
 * 2. Appelle AuthService.refreshAccessToken()
 * 3. Retourne HTTP 200 avec le nouvel accessToken
 */
export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = RefreshSchema.parse(req.body);
    const result = await AuthService.refreshAccessToken(validatedData);
    
    res.status(200).json(successResponse("Token renouvelé avec succès", result));
  } catch (err) {
    next(err);
  }
};

/**
 * Handler POST /api/auth/logout
 * 1. Valide req.body avec le schéma RefreshSchema
 * 2. Appelle AuthService.logout() pour supprimer le token de la base
 * 3. Retourne HTTP 200 sans données
 */
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = RefreshSchema.parse(req.body);
    await AuthService.logout(validatedData);

    res.status(200).json(successResponse("Déconnexion réussie"));
  } catch (err) {
    next(err);
  }
};
