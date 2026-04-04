/**
 * @file messaging.controller.ts
 * @description Handlers HTTP pour la messagerie sécurisée (US2.3).
 *
 * POST /api/conversations              → Démarrer une conversation
 * GET  /api/conversations              → Lister ses conversations
 * GET  /api/conversations/:id/messages → Messages d'une conversation
 * POST /api/conversations/:id/messages → Envoyer un message
 */
import { Request, Response, NextFunction } from 'express';
import { MessagingService } from './messaging.service';
import { StartConversationSchema, SendMessageSchema } from './messaging.validator';
import { successResponse } from '../../utils/response.formatter';
import { AppError } from '../../middlewares/error.middleware';

/**
 * POST /api/conversations
 * Démarre une conversation avec un propriétaire (ou retourne l'existante).
 */
export const startConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = StartConversationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(' | '),
        400
      );
    }

    const senderId = req.user!.userId;
    const { recipientId, message } = parsed.data;

    const result = await MessagingService.startConversation(senderId, recipientId, message);

    const status = result.isNew ? 201 : 200;
    const msg = result.isNew ? 'Conversation créée' : 'Message envoyé dans la conversation existante';
    res.status(status).json(successResponse(msg, result));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/conversations
 * Liste toutes les conversations de l'utilisateur connecté.
 */
export const listConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const conversations = await MessagingService.getUserConversations(userId);
    res.status(200).json(successResponse('Conversations récupérées', { conversations }));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/conversations/:id/messages
 * Récupère les messages d'une conversation (avec pagination).
 */
export const getMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;

    const result = await MessagingService.getMessages(id, userId, page, limit);
    res.status(200).json(successResponse('Messages récupérés', result));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/conversations/:id/messages
 * Envoie un message dans une conversation existante.
 */
export const sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = SendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(' | '),
        400
      );
    }

    const { id } = req.params;
    const senderId = req.user!.userId;

    const message = await MessagingService.sendMessage(id, senderId, parsed.data.content);
    res.status(201).json(successResponse('Message envoyé', message));
  } catch (err) {
    next(err);
  }
};
