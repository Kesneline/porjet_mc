/**
 * @file payment.service.ts
 * @description Service de paiement Mobile Money pour Stud'Housing Trust.
 *
 * US4.3 — Intégration MTN MoMo : initiation paiement + vérification statut + activation Premium
 * US4.4 — Intégration Orange Money WebPay : initiation + webhook + boost annonce
 *
 * SÉCURITÉ : Les clés API MTN et Orange ne transitent JAMAIS côté client.
 *            Toute la logique de paiement est orchestrée côté serveur.
 *
 * FLOW MTN MoMo :
 *   1. initiateMoMoPayment() → Appel API requesttopay → Retourne referenceId
 *   2. checkPaymentStatus()  → Polling statut → Si SUCCESSFUL : activePremium ou activateBoost
 *
 * FLOW Orange Money :
 *   1. initiateOrangePayment() → OAuth token → Initiation WebPay → Retourne paymentUrl
 *   2. processOrangeWebhook()  → Réception callback → Mise à jour base de données
 */
import { prisma } from '../../config/prisma.config';
import { config } from '../../config/env.config';
import { AppError } from '../../middlewares/error.middleware';
import { ListingService } from '../listing/listing.service';
import {
  OFFER_CONFIG,
  PREMIUM_OFFERS,
  BOOST_OFFERS,
  OfferType,
  MoMoInitResult,
  OrangeInitResult,
} from './payment.dto';

export class PaymentService {

  // ─────────────────────────────────────────────────────────────
  // MTN MOBILE MONEY — US4.3
  // ─────────────────────────────────────────────────────────────

  /**
   * Initie un paiement MTN MoMo (Collection API).
   * Crée un enregistrement Payment en base et envoie la demande à l'API MTN.
   *
   * @param userId    - ID de l'utilisateur qui paie
   * @param offerType - Type d'offre (PREMIUM_MONTHLY, etc.)
   * @param phone     - Numéro MoMo du payeur (237XXXXXXXXX)
   * @param listingId - ID de l'annonce (requis pour BOOST)
   */
  static async initiateMoMoPayment(
    userId: string,
    offerType: OfferType,
    phone: string,
    listingId?: string
  ): Promise<MoMoInitResult> {
    this.checkMoMoConfig();
    this.validateBoostOffer(offerType, listingId);

    const offer = OFFER_CONFIG[offerType];
    const referenceId = crypto.randomUUID();

    // 1. Persistance du paiement en base AVANT l'appel API (idempotence)
    await prisma.payment.create({
      data: {
        id: referenceId,
        referenceId,
        userId,
        amount: offer.amount,
        currency: offer.currency,
        operator: 'MTN_MOMO',
        offerType,
        status: 'PENDING',
      },
    });

    // 2. Obtention du token OAuth MTN MoMo
    const accessToken = await this.getMoMoToken();

    // 3. Initiation de la demande de paiement (requesttopay)
    const response = await fetch(
      `${config.mtnMomo.baseUrl}/collection/v1_0/requesttopay`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Reference-Id': referenceId,
          'X-Target-Environment': config.mtnMomo.environment,
          'Ocp-Apim-Subscription-Key': config.mtnMomo.subscriptionKey!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: offer.amount.toString(),
          currency: offer.currency,
          externalId: referenceId,
          payer: {
            partyIdType: 'MSISDN',
            partyId: phone,
          },
          payerMessage: offer.label,
          payeeNote: `Stud'Housing Trust - ${offer.label}`,
        }),
      }
    );

    // HTTP 202 = demande acceptée, l'utilisateur recevra l'invitation USSD
    if (response.status !== 202) {
      const errorBody = await response.text();
      await prisma.payment.update({
        where: { referenceId },
        data: { status: 'FAILED' },
      });
      throw new AppError(`Erreur MTN MoMo : ${errorBody}`, 502);
    }

    return {
      referenceId,
      status: 'PENDING',
      operator: 'MTN_MOMO',
      amount: offer.amount,
      currency: offer.currency,
      offerType,
      message:
        "Demande envoyée. Validez le paiement sur votre téléphone (invitation USSD MTN MoMo).",
    };
  }

  /**
   * Vérifie le statut d'un paiement MTN MoMo et active l'offre si succès.
   * Méthode de polling appelée par le client (GET /api/payments/:referenceId/status).
   *
   * @param referenceId - UUID de la transaction MTN MoMo
   * @param requesterId - ID de l'utilisateur qui vérifie (sécurité)
   */
  static async checkMoMoStatus(referenceId: string, requesterId: string) {
    this.checkMoMoConfig();

    const payment = await prisma.payment.findUnique({ where: { referenceId } });
    if (!payment) throw new AppError('Transaction introuvable.', 404);
    if (payment.userId !== requesterId) throw new AppError('Accès refusé.', 403);

    // Si déjà traité, retourner le statut en base
    if (payment.status !== 'PENDING') {
      return { referenceId, status: payment.status, offerType: payment.offerType };
    }

    // Vérification auprès de l'API MTN
    const accessToken = await this.getMoMoToken();
    const response = await fetch(
      `${config.mtnMomo.baseUrl}/collection/v1_0/requesttopay/${referenceId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Target-Environment': config.mtnMomo.environment,
          'Ocp-Apim-Subscription-Key': config.mtnMomo.subscriptionKey!,
        },
      }
    );

    if (!response.ok) {
      throw new AppError('Impossible de vérifier le statut MTN MoMo.', 502);
    }

    const data: any = await response.json();
    const momoStatus: string = data.status; // PENDING | SUCCESSFUL | FAILED

    if (momoStatus === 'SUCCESSFUL') {
      await this.activateOffer(payment.userId, payment.offerType as OfferType, referenceId);
    } else if (momoStatus === 'FAILED') {
      await prisma.payment.update({ where: { referenceId }, data: { status: 'FAILED' } });
    }

    return {
      referenceId,
      status: momoStatus,
      offerType: payment.offerType,
      message: this.getStatusMessage(momoStatus),
    };
  }

  // ─────────────────────────────────────────────────────────────
  // ORANGE MONEY — US4.4
  // ─────────────────────────────────────────────────────────────

  /**
   * Initie un paiement Orange Money (WebPay).
   * Retourne une URL de paiement à ouvrir dans une WebView côté client.
   *
   * @param userId    - ID de l'utilisateur qui paie
   * @param offerType - Type d'offre
   * @param phone     - Numéro Orange Money du payeur
   * @param listingId - ID de l'annonce (requis pour BOOST)
   */
  static async initiateOrangePayment(
    userId: string,
    offerType: OfferType,
    phone: string,
    listingId?: string
  ): Promise<OrangeInitResult> {
    this.checkOrangeConfig();
    this.validateBoostOffer(offerType, listingId);

    const offer = OFFER_CONFIG[offerType];
    const referenceId = crypto.randomUUID();

    // 1. Persistance en base
    await prisma.payment.create({
      data: {
        id: referenceId,
        referenceId,
        userId,
        amount: offer.amount,
        currency: offer.currency,
        operator: 'ORANGE_MONEY',
        offerType,
        status: 'PENDING',
      },
    });

    // 2. Obtention du token OAuth Orange
    const accessToken = await this.getOrangeToken();

    // 3. Initiation du paiement WebPay Orange Money Cameroun
    const notifyUrl = `${config.appBaseUrl}/api/payments/webhook/orange`;
    const returnUrl = `${config.appBaseUrl}/api/payments/orange/return/${referenceId}`;

    const response = await fetch(
      `${config.orangeMoney.baseUrl}/orange-money-webpay/cm/v1/webpayment`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchant_key: config.orangeMoney.clientId,
          currency: 'OUV',
          order_id: referenceId,
          amount: offer.amount,
          return_url: returnUrl,
          cancel_url: returnUrl,
          notif_url: notifyUrl,
          lang: 'fr',
          reference: referenceId,
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      await prisma.payment.update({ where: { referenceId }, data: { status: 'FAILED' } });
      throw new AppError(`Erreur Orange Money : ${errorBody}`, 502);
    }

    const data: any = await response.json();
    const paymentUrl: string = data.payment_url;

    return {
      referenceId,
      status: 'PENDING',
      operator: 'ORANGE_MONEY',
      amount: offer.amount,
      currency: offer.currency,
      offerType,
      paymentUrl,
      message: 'Paiement initié. Ouvrez l\'URL de paiement Orange Money pour finaliser.',
    };
  }

  /**
   * Traitement du webhook Orange Money.
   * Appelé par Orange Money en POST sur /api/payments/webhook/orange.
   * Active l'offre si le paiement est confirmé.
   *
   * @param body - Payload brut du webhook Orange Money
   */
  static async processOrangeWebhook(body: any) {
    const { order_id: referenceId, status } = body;

    if (!referenceId) return;

    const payment = await prisma.payment.findUnique({ where: { referenceId } });
    if (!payment || payment.status !== 'PENDING') return;

    if (status === 'SUCCESS' || status === 'SUCCESSFULL') {
      await this.activateOffer(payment.userId, payment.offerType as OfferType, referenceId);
    } else if (status === 'FAILED' || status === 'CANCELLED') {
      await prisma.payment.update({ where: { referenceId }, data: { status: 'FAILED' } });
    }
  }

  /**
   * Vérifie le statut d'un paiement en base (Orange ou MTN).
   */
  static async getPaymentStatus(referenceId: string, requesterId: string) {
    const payment = await prisma.payment.findUnique({ where: { referenceId } });
    if (!payment) throw new AppError('Transaction introuvable.', 404);
    if (payment.userId !== requesterId) throw new AppError('Accès refusé.', 403);

    return {
      referenceId: payment.referenceId,
      status: payment.status,
      operator: payment.operator,
      offerType: payment.offerType,
      amount: payment.amount,
      currency: payment.currency,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // HELPERS PRIVÉS
  // ─────────────────────────────────────────────────────────────

  /**
   * Active l'offre après confirmation du paiement (commun MTN et Orange).
   * - PREMIUM_MONTHLY / PREMIUM_3MONTHS → User.isPremium = true, User.premiumUntil
   * - LISTING_BOOST_7DAYS / LISTING_BOOST_30DAYS → Listing.isBoosted = true
   */
  private static async activateOffer(userId: string, offerType: OfferType, referenceId: string) {
    const offer = OFFER_CONFIG[offerType];

    if (PREMIUM_OFFERS.includes(offerType)) {
      // Calcul de la date de fin premium en tenant compte d'un éventuel premium existant
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const baseDate =
        user?.premiumUntil && user.premiumUntil > new Date() ? user.premiumUntil : new Date();
      const premiumUntil = new Date(baseDate);
      premiumUntil.setDate(premiumUntil.getDate() + offer.durationDays);

      await Promise.all([
        prisma.user.update({
          where: { id: userId },
          data: { isPremium: true, premiumUntil, role: 'STUDENT_PREMIUM' },
        }),
        prisma.payment.update({
          where: { referenceId },
          data: { status: 'SUCCESSFUL' },
        }),
      ]);
    } else if (BOOST_OFFERS.includes(offerType)) {
      // Récupération du listingId depuis la référence de paiement
      const payment = await prisma.payment.findUnique({ where: { referenceId } });
      // Le listingId est stocké dans le champ offerType sous forme "LISTING_BOOST_7DAYS:listingId"
      // Convention : on stocke listingId dans une metadata
      const meta = (payment as any)?.metadata;
      const listingId = meta?.listingId;

      if (listingId) {
        await ListingService.activateBoost(listingId, offer.durationDays);
      }

      await prisma.payment.update({
        where: { referenceId },
        data: { status: 'SUCCESSFUL' },
      });
    }
  }

  /** Obtient un token OAuth2 MTN MoMo Collection. */
  private static async getMoMoToken(): Promise<string> {
    const credentials = Buffer.from(
      `${config.mtnMomo.apiUser}:${config.mtnMomo.apiKey}`
    ).toString('base64');

    const response = await fetch(
      `${config.mtnMomo.baseUrl}/collection/token/`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Ocp-Apim-Subscription-Key': config.mtnMomo.subscriptionKey!,
        },
      }
    );

    if (!response.ok) {
      throw new AppError('Impossible d\'obtenir le token MTN MoMo.', 502);
    }

    const data: any = await response.json();
    return data.access_token;
  }

  /** Obtient un token OAuth2 Orange Money. */
  private static async getOrangeToken(): Promise<string> {
    const credentials = Buffer.from(
      `${config.orangeMoney.clientId}:${config.orangeMoney.clientSecret}`
    ).toString('base64');

    const response = await fetch(
      `${config.orangeMoney.baseUrl}/oauth/v3/token`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      }
    );

    if (!response.ok) {
      throw new AppError('Impossible d\'obtenir le token Orange Money.', 502);
    }

    const data: any = await response.json();
    return data.access_token;
  }

  /** Valide que listingId est fourni pour les offres de boost. */
  private static validateBoostOffer(offerType: OfferType, listingId?: string) {
    if (BOOST_OFFERS.includes(offerType) && !listingId) {
      throw new AppError(
        "Le champ 'listingId' est requis pour les offres de boost d'annonce.",
        400
      );
    }
  }

  /** Lève une erreur si la config MTN MoMo est incomplète. */
  private static checkMoMoConfig() {
    if (!config.mtnMomo.subscriptionKey || !config.mtnMomo.apiUser || !config.mtnMomo.apiKey) {
      throw new AppError(
        'MTN MoMo n\'est pas configuré. Vérifiez MTN_MOMO_SUBSCRIPTION_KEY, MTN_MOMO_API_USER, MTN_MOMO_API_KEY dans le .env.',
        503
      );
    }
  }

  /** Lève une erreur si la config Orange Money est incomplète. */
  private static checkOrangeConfig() {
    if (!config.orangeMoney.clientId || !config.orangeMoney.clientSecret) {
      throw new AppError(
        'Orange Money n\'est pas configuré. Vérifiez ORANGE_CLIENT_ID et ORANGE_CLIENT_SECRET dans le .env.',
        503
      );
    }
  }

  /** Retourne un message lisible en fonction du statut de paiement. */
  private static getStatusMessage(status: string): string {
    switch (status) {
      case 'SUCCESSFUL': return 'Paiement réussi. Votre offre est activée.';
      case 'FAILED': return 'Paiement échoué. Veuillez réessayer.';
      case 'PENDING': return 'En attente de confirmation. Validez sur votre téléphone.';
      default: return 'Statut inconnu.';
    }
  }
}
