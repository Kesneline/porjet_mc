/**
 * @file payment.routes.ts
 * @description Routes du module paiement Mobile Money.
 *
 * US4.3 — Abonnement Premium via MTN MoMo
 * US4.4 — Boost annonce via Orange Money
 *
 * Routes :
 *   POST  /api/payments/initiate            → Initier un paiement (authentifié)
 *   GET   /api/payments/:referenceId/status  → Statut d'un paiement (authentifié)
 *   GET   /api/payments/my                  → Historique (authentifié)
 *   POST  /api/payments/webhook/orange      → Webhook Orange Money (public, appelé par Orange)
 */
import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import * as PaymentController from './payment.controller';

const router = Router();

// ─────────────────────────────────────────────────────────────
// ROUTES WEBHOOK (publiques — appelées par les opérateurs)
// Doivent être déclarées AVANT le middleware requireAuth global
// ─────────────────────────────────────────────────────────────

// US4.4 — Orange Money callback asynchrone
router.post('/webhook/orange', PaymentController.orangeWebhook);

// ─────────────────────────────────────────────────────────────
// ROUTES AUTHENTIFIÉES
// ─────────────────────────────────────────────────────────────

// US4.3 + US4.4 — Initiation paiement (STUDENT_PREMIUM/OWNER/ADMIN/STUDENT)
router.post('/initiate', requireAuth, PaymentController.initiate);

// US4.3 + US4.4 — Vérification statut (polling pour MTN, état BDD pour Orange)
router.get('/:referenceId/status', requireAuth, PaymentController.checkStatus);

// Historique des paiements de l'utilisateur connecté
router.get('/my', requireAuth, PaymentController.myPayments);

export default router;
