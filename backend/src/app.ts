/**
 * @file app.ts
 * @description Configuration centrale de l'application Express.
 *
 * Ce fichier configure l'application Express (middlewares globaux, routes)
 * mais NE DÉMARRE PAS le serveur (c'est le rôle de index.ts).
 *
 * SÉPARATION app.ts / index.ts :
 * Permet de tester l'app avec supertest sans démarrer un vrai port réseau.
 *
 * MIDDLEWARES GLOBAUX (ordre important) :
 * 1. helmet()         → Sécurise les headers HTTP
 * 2. cors()           → Autorise les requêtes cross-origin (app mobile)
 * 3. express.json()   → Parse le body JSON des requêtes entrantes
 *
 * ARBRE DE ROUTES :
 * /api/health       → Healthcheck
 * /api/auth/*       → Module Authentification (register, login)
 * [404 catch-all]   → Route non définie → JSON 404
 * [globalErrorHandler] → Gestionnaire centralisé de toutes les erreurs → JSON formaté
 */
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { successResponse } from './utils/response.formatter';
import authRoutes from './modules/auth/auth.routes';
import listingRoutes from './modules/listing/listing.routes';
import { globalErrorHandler } from './middlewares/error.middleware';

const app: Application = express();

// ===================================================================
// MIDDLEWARES GLOBAUX DE SÉCURITÉ ET DE PARSING
// ===================================================================

// helmet : Ajoute automatiquement des headers HTTP de sécurité (CSP, HSTS, etc.)
app.use(helmet());

// cors : Autorise les requêtes cross-origin (depuis l'app Flutter / React Native)
// TODO Production : Restreindre aux origines connues via corsOptions
app.use(cors());

// express.json : Parse le body des requêtes avec Content-Type: application/json
app.use(express.json());

// ===================================================================
// ROUTES DE L'API
// Chaque module a son propre fichier de routes, monté sur un préfixe.
// ===================================================================

app.use('/api/auth', authRoutes); // POST /api/auth/register, POST /api/auth/login
app.use('/api/listings', listingRoutes); // CRUD public et propriétaire des logements

// ===================================================================
// ROUTES SYSTÈME
// ===================================================================

/**
 * GET /api/health
 * Endpoint de vérification de l'état du serveur (Healthcheck).
 * Utilisé par les outils de monitoring (Uptime Robot, Railway, etc.)
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json(
    successResponse("Stud'Housing Trust API opérationnelle", {
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    })
  );
});

/**
 * Catch-all 404 : Répond avec une erreur JSON si aucune route n'a matché.
 * DOIT être déclaré AVANT le globalErrorHandler mais APRÈS toutes les routes.
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Ressource introuvable : ${req.method} ${req.path}` });
});

// ===================================================================
// GESTIONNAIRE D'ERREURS GLOBAL
// DOIT être déclaré EN DERNIER (après toutes les routes et le 404).
// Capture toutes les erreurs passées via next(err) depuis les controllers.
// ===================================================================
app.use(globalErrorHandler);

export default app;
