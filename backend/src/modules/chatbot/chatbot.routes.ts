/**
 * @file chatbot.routes.ts
 * @description Routes du module chatbot IA conseils logement (US4.2).
 *
 * POST /api/chatbot — Envoyer un message et recevoir une réponse de l'assistant IA.
 *
 * Route authentifiée : seuls les utilisateurs connectés peuvent discuter avec le chatbot.
 * Cela permet de limiter l'abus et potentiellement de tracer les conversations.
 */
import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import * as ChatbotController from './chatbot.controller';

const router = Router();

// Authentification requise pour utiliser le chatbot
router.use(requireAuth);

/**
 * POST /api/chatbot
 * Body : { message: string, conversationHistory?: [{role: 'user'|'assistant', content: string}] }
 */
router.post('/', ChatbotController.chat);

export default router;
