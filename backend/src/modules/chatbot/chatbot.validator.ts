/**
 * @file chatbot.validator.ts
 * @description Validation Zod pour le module chatbot IA (US4.2).
 *
 * En tant qu'étudiant, je veux discuter avec un assistant IA
 * pour obtenir des conseils logement 24/7.
 */
import { z } from 'zod';

/**
 * Schéma d'un message dans l'historique de conversation.
 * role: 'user' pour l'étudiant, 'assistant' pour le chatbot IA.
 */
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
});

/**
 * Schéma pour envoyer un message au chatbot.
 * POST /api/chatbot
 *
 * - message : le nouveau message de l'utilisateur
 * - conversationHistory : les messages précédents (optionnel, pour le contexte)
 */
export const ChatbotMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'Le message ne peut pas être vide.')
    .max(2000, 'Le message ne doit pas dépasser 2000 caractères.'),
  conversationHistory: z
    .array(ChatMessageSchema)
    .max(50, "L'historique ne peut pas dépasser 50 messages.")
    .optional()
    .default([]),
});

export type ChatbotMessageInput = z.infer<typeof ChatbotMessageSchema>;
