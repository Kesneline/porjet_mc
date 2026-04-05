/**
 * @file messaging.routes.ts
 * @description Routes du module messagerie sécurisée (US2.3).
 *
 * Toutes les routes sont authentifiées — les numéros de téléphone
 * ne sont jamais exposés dans les réponses.
 *
 * POST /api/conversations              → Démarrer/reprendre une conversation
 * GET  /api/conversations              → Lister ses conversations
 * GET  /api/conversations/:id/messages → Lire les messages
 * POST /api/conversations/:id/messages → Envoyer un message
 */
import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import * as MessagingController from './messaging.controller';

const router = Router();

// Toutes les routes de messagerie nécessitent une authentification
router.use(requireAuth);

router.post('/', MessagingController.startConversation);
router.get('/', MessagingController.listConversations);
router.get('/:id/messages', MessagingController.getMessages);
router.post('/:id/messages', MessagingController.sendMessage);

export default router;
