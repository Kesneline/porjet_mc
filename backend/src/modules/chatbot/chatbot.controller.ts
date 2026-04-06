/**
 * @file chatbot.controller.ts
 * @description Controller pour le chatbot IA conseils logement (US4.2).
 *
 * POST /api/chatbot — Envoyer un message au chatbot IA et recevoir une réponse.
 */
import { Request, Response, NextFunction } from 'express';
import { ChatbotService } from './chatbot.service';
import { ChatbotMessageSchema } from './chatbot.validator';
import { successResponse } from '../../utils/response.formatter';
import { AppError } from '../../middlewares/error.middleware';

/**
 * POST /api/chatbot
 * US4.2 — Dialogue avec l'assistant IA pour conseils logement 24/7.
 *
 * Body : { message: string, conversationHistory?: Array<{role, content}> }
 */
export const chat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = ChatbotMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(' | '),
        400
      );
    }

    const result = await ChatbotService.chat(parsed.data);

    res.status(200).json(
      successResponse("Réponse de l'assistant IA", {
        reply: result.reply,
        usage: result.tokensUsed,
      })
    );
  } catch (err) {
    next(err);
  }
};
