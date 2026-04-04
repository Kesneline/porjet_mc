/**
 * @file payment.dto.ts
 * @description Types et constantes pour le module de paiement Mobile Money.
 *
 * US4.3 — Paiement abonnement Premium via MTN MoMo
 * US4.4 — Boost annonce via Orange Money
 */
import { PaymentOperator } from '@prisma/client';

/**
 * Types d'offres disponibles à l'achat.
 */
export type OfferType =
  | 'PREMIUM_MONTHLY'
  | 'PREMIUM_3MONTHS'
  | 'LISTING_BOOST_7DAYS'
  | 'LISTING_BOOST_30DAYS';

/**
 * Configuration de chaque offre : montant, durée, label.
 * Montants en XAF (Franc CFA).
 */
export const OFFER_CONFIG: Record<
  OfferType,
  { amount: number; currency: string; durationDays: number; label: string }
> = {
  PREMIUM_MONTHLY: {
    amount: 2000,
    currency: 'XAF',
    durationDays: 30,
    label: 'Abonnement Premium 1 Mois',
  },
  PREMIUM_3MONTHS: {
    amount: 5000,
    currency: 'XAF',
    durationDays: 90,
    label: 'Abonnement Premium 3 Mois',
  },
  LISTING_BOOST_7DAYS: {
    amount: 1000,
    currency: 'XAF',
    durationDays: 7,
    label: 'Boost Annonce 7 Jours',
  },
  LISTING_BOOST_30DAYS: {
    amount: 3000,
    currency: 'XAF',
    durationDays: 30,
    label: 'Boost Annonce 30 Jours',
  },
};

/**
 * Offres qui activent le Premium utilisateur.
 */
export const PREMIUM_OFFERS: OfferType[] = ['PREMIUM_MONTHLY', 'PREMIUM_3MONTHS'];

/**
 * Offres qui boostent une annonce.
 */
export const BOOST_OFFERS: OfferType[] = ['LISTING_BOOST_7DAYS', 'LISTING_BOOST_30DAYS'];

/**
 * Payload pour l'initiation d'un paiement.
 */
export interface InitiatePaymentInput {
  offerType: OfferType;
  operator: PaymentOperator;
  phone: string;       // Numéro MoMo du payeur (format : 237XXXXXXXXX)
  listingId?: string;  // Requis uniquement pour les offres BOOST
}

/**
 * Résultat retourné après initiation d'un paiement MTN MoMo.
 */
export interface MoMoInitResult {
  referenceId: string;
  status: 'PENDING';
  operator: 'MTN_MOMO';
  amount: number;
  currency: string;
  offerType: OfferType;
  message: string;
}

/**
 * Résultat retourné après initiation d'un paiement Orange Money.
 */
export interface OrangeInitResult {
  referenceId: string;
  status: 'PENDING';
  operator: 'ORANGE_MONEY';
  amount: number;
  currency: string;
  offerType: OfferType;
  paymentUrl: string;  // URL WebView Orange Money
  message: string;
}
