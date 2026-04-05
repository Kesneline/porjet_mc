/**
 * @file messaging.validator.ts
 * @description Validation Zod pour le module messagerie sécurisée (US2.3).
 */
import { z } from 'zod';

/**
 * Schéma pour démarrer une conversation avec un propriétaire.
 * POST /api/conversations
 */
export const StartConversationSchema = z.object({
  recipientId: z.string().uuid("L'ID du destinataire doit être un UUID valide"),
  message: z.string().min(1, 'Le message ne peut pas être vide').max(2000),
});

/**
 * Schéma pour envoyer un message dans une conversation existante.
 * POST /api/conversations/:id/messages
 */
export const SendMessageSchema = z.object({
  content: z.string().min(1, 'Le message ne peut pas être vide').max(2000),
});

export type StartConversationInput = z.infer<typeof StartConversationSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
