/**
 * @file payment.controller.ts
 * @description Handlers HTTP pour le module de paiement Mobile Money.
 *
 * US4.3 — POST /api/payments/initiate (MTN MoMo → abonnement Premium)
 * US4.4 — POST /api/payments/initiate (Orange Money → boost annonce)
 *
 * Endpoints :
 *   POST  /api/payments/initiate           → Initier un paiement (MTN ou Orange)
 *   GET   /api/payments/:referenceId/status → Vérifier le statut (polling MTN)
 *   POST  /api/payments/webhook/orange     → Webhook Orange Money (callback async)
 *   GET   /api/payments/my                 → Historique des paiements de l'utilisateur
 */
import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service';
import { InitiatePaymentSchema } from './payment.validator';
import { successResponse } from '../../utils/response.formatter';
import { AppError } from '../../middlewares/error.middleware';
import { OfferType } from './payment.dto';

/**
 * POST /api/payments/initiate
 * US4.3 — MTN MoMo : initier le paiement d'un abonnement Premium.
 * US4.4 — Orange Money : initier le boost d'une annonce.
 *
 * Body : { offerType, operator, phone, listingId? }
 */
export const initiate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = InitiatePaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(' | '),
        400
      );
    }

    const { offerType, operator, phone, listingId } = parsed.data;
    const userId = req.user!.userId;

    let result;
    if (operator === 'MTN_MOMO') {
      result = await PaymentService.initiateMoMoPayment(
        userId,
        offerType as OfferType,
        phone,
        listingId
      );
    } else {
      result = await PaymentService.initiateOrangePayment(
        userId,
        offerType as OfferType,
        phone,
        listingId
      );
    }

    res.status(202).json(successResponse('Paiement initié avec succès', result));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/payments/:referenceId/status
 * US4.3 — Vérification du statut d'un paiement MTN MoMo (polling).
 * Fonctionne aussi pour Orange Money (statut en base).
 */
export const checkStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { referenceId } = req.params;
    const userId = req.user!.userId;

    // Pour MTN MoMo, on interroge l'API MTN + met à jour la base
    // Pour Orange Money, on retourne juste le statut en base (mis à jour par webhook)
    const payment = await PaymentService.getPaymentStatus(referenceId, userId);

    if (payment.operator === 'MTN_MOMO' && payment.status === 'PENDING') {
      const liveStatus = await PaymentService.checkMoMoStatus(referenceId, userId);
      res.status(200).json(successResponse('Statut du paiement', liveStatus));
      return;
    }

    res.status(200).json(successResponse('Statut du paiement', payment));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/payments/webhook/orange
 * US4.4 — Réception du callback asynchrone Orange Money.
 * Orange Money appelle cette URL après confirmation du paiement.
 *
 * Note : Pas d'authentification JWT ici (Orange appelle directement).
 *        La sécurité est assurée par la validation du payload.
 */
export const orangeWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await PaymentService.processOrangeWebhook(req.body);
    // Orange Money attend un HTTP 200 pour confirmer la réception
    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/payments/my
 * Historique des paiements de l'utilisateur connecté.
 */
export const myPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { prisma } = await import('../../config/prisma.config');

    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.status(200).json(successResponse('Historique des paiements', { payments }));
  } catch (err) {
    next(err);
  }
};
