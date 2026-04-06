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
 * 2. cors()           → Autorise les requêtes cross-origin (restreint aux origines connues)
 * 3. globalApiLimiter → Rate limiting global (filet de sécurité)
 * 4. express.json()   → Parse le body JSON des requêtes entrantes
 *
 * ARBRE DE ROUTES :
 * /api/health        → Healthcheck
 * /api/auth/*        → Module Authentification (register, login)
 * /api/listings/*    → Annonces CRUD + filtres (US1.3, US1.4, US2.1)
 * /api/search        → Recherche Algolia full-text (US2.4)
 * /api/payments/*    → Paiement Mobile Money MTN/Orange (US4.3, US4.4)
 * /api/matching      → Matching IA personnalisé (US4.1)
 * /api/chatbot       → Chatbot IA conseils logement 24/7 (US4.2)
 * /api/conversations → Messagerie sécurisée avec anti-arnaque (US2.3, US5.3)
 * [404 catch-all]    → Route non définie → JSON 404
 * [globalErrorHandler] → Gestionnaire centralisé de toutes les erreurs → JSON formaté
 */
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { successResponse } from './utils/response.formatter';
import authRoutes from './modules/auth/auth.routes';
import listingRoutes from './modules/listing/listing.routes';
import userRoutes from './modules/user/user.routes';
import adminRoutes from './modules/admin/admin.routes';
import searchRoutes from './modules/search/search.routes';
import paymentRoutes from './modules/payment/payment.routes';
import matchingRoutes from './modules/matching/matching.routes';
import messagingRoutes from './modules/messaging/messaging.routes';
import chatbotRoutes from './modules/chatbot/chatbot.routes';
import { globalErrorHandler } from './middlewares/error.middleware';
import { globalApiLimiter } from './middlewares/rateLimit.middleware';
import { correlationId } from './middlewares/correlationId.middleware';
import { requestLogger } from './middlewares/requestLogger.middleware';

const app: Application = express();

// ===================================================================
// MIDDLEWARES GLOBAUX DE SÉCURITÉ ET DE PARSING
// ===================================================================

// correlationId : Assigner un request ID unique à chaque requête
// IMPORTANT: DOIT être EN PREMIER (avant tous les autres middlewares)
app.use(correlationId);

// helmet : Ajoute automatiquement des headers HTTP de sécurité (CSP, HSTS, etc.)
app.use(helmet());

// cors : Autorise les requêtes cross-origin avec restrictions
// En développement : accepte localhost:3000 et localhost:8080 (Flutter)
// En production : accepter UNIQUEMENT l'origine de l'app (définie via env var ALLOWED_ORIGINS)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:5000']; // Dev defaults

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Rate limiting global : filet de sécurité contre les requêtes en masse
app.use('/api/', globalApiLimiter);

// express.json : Parse le body des requêtes avec Content-Type: application/json
app.use(express.json());

// requestLogger : Log chaque requête HTTP (method, path, status, duration, userId)
app.use(requestLogger);

// ===================================================================
// ROUTES DE L'API
// Chaque module a son propre fichier de routes, monté sur un préfixe.
// ===================================================================

app.use('/api/auth', authRoutes);               // POST /api/auth/register, POST /api/auth/login
app.use('/api/listings', listingRoutes);         // CRUD + filtres US1.3/US1.4/US2.1
app.use('/api/users', userRoutes);               // Profils utilisateurs
app.use('/api/admin', adminRoutes);              // Actions de modération (Admin uniquement)
app.use('/api/search', searchRoutes);            // US2.4 — Recherche full-text Algolia
app.use('/api/payments', paymentRoutes);         // US4.3/US4.4 — MTN MoMo + Orange Money
app.use('/api/matching', matchingRoutes);        // US4.1 — Matching IA via Claude API
app.use('/api/conversations', messagingRoutes);  // US2.3 — Messagerie sécurisée
app.use('/api/chatbot', chatbotRoutes);          // US4.2 — Chatbot IA conseils logement 24/7

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
