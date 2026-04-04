/**
 * @file payment.validator.ts
 * @description Schémas de validation Zod pour le module paiement.
 *
 * US4.3 — Validation initiation paiement MTN MoMo (abonnement Premium)
 * US4.4 — Validation initiation paiement Orange Money (boost annonce)
 */
import { z } from 'zod';

/**
 * Schéma de validation pour l'initiation d'un paiement.
 * Commun à MTN MoMo et Orange Money.
 */
export const InitiatePaymentSchema = z.object({
  offerType: z.enum(
    ['PREMIUM_MONTHLY', 'PREMIUM_3MONTHS', 'LISTING_BOOST_7DAYS', 'LISTING_BOOST_30DAYS'],
    {
      errorMap: () => ({
        message:
          "Type d'offre invalide. Valeurs acceptées : PREMIUM_MONTHLY, PREMIUM_3MONTHS, LISTING_BOOST_7DAYS, LISTING_BOOST_30DAYS",
      }),
    }
  ),
  operator: z.enum(['MTN_MOMO', 'ORANGE_MONEY'], {
    errorMap: () => ({
      message: "Opérateur invalide. Valeurs acceptées : MTN_MOMO, ORANGE_MONEY",
    }),
  }),
  // Numéro MoMo : format camerounais 237XXXXXXXXX (12 chiffres)
  phone: z
    .string()
    .regex(/^237[0-9]{9}$/, "Numéro de téléphone invalide. Format attendu : 237XXXXXXXXX (12 chiffres)"),
  // listingId requis uniquement pour les offres de boost
  listingId: z.string().uuid('listingId doit être un UUID valide').optional(),
});

export type InitiatePaymentInput = z.infer<typeof InitiatePaymentSchema>;
