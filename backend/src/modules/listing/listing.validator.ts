/**
 * @file listing.validator.ts
 * @description Schémas de validation Zod pour les annonces de logements.
 *
 * Inclut :
 * - Validationdes types (enum, numbers, strings)
 * - Limites de longueur pour prévenir DoS et abus
 * - Sanitization des champs de texte libre(title, description, address, city)
 * US1.3 — Ajout de ListingQuerySchema pour les filtres basiques
 * US2.1 — Extension avec les filtres avancés (amenities, campusDist, sortBy)
 */
import { z } from 'zod';
import { ListingType } from '@prisma/client';
import { sanitizeString, sanitizeDescription } from '../../utils/sanitize.utils';

/**
 * Schéma pour la création d'un logement (US1.4).
 */
export const CreateListingSchema = z.object({
  title: z
    .string({ required_error: "Le titre est obligatoire." })
    .min(5, "Le titre doit faire au moins 5 caractères")
    .max(200, "Le titre ne peut pas dépasser 200 caractères")
    .transform(sanitizeString), // Sanitize contre XSS

  description: z
    .string({ required_error: "La description est obligatoire." })
    .min(20, "La description doit faire au moins 20 caractères")
    .max(5000, "La description ne peut pas dépasser 5000 caractères")
    .transform(sanitizeDescription), // Sanitize longs textes

  price: z.number().positive("Le prix doit être un nombre positif"),

  address: z
    .string({ required_error: "L'adresse est obligatoire." })
    .min(5, "L'adresse est requise")
    .max(200, "L'adresse ne peut pas dépasser 200 caractères")
    .transform(sanitizeString),

  city: z
    .string({ required_error: "La ville est obligatoire." })
    .min(2, "La ville est requise")
    .max(100, "La ville ne peut pas dépasser 100 caractères")
    .transform(sanitizeString),

  latitude: z.number(),
  longitude: z.number(),

  rooms: z.number().int().min(1).optional().default(1),

  type: z.nativeEnum(ListingType, {
    errorMap: () => ({ message: 'Type de logement invalide (STUDIO, CHAMBRE, APPARTEMENT, COLOCATION)' }),
  }),

  amenities: z
    .array(
      z
        .string()
        .max(50, "Chaque commodité ne peut pas dépasser 50 caractères")
        .transform(sanitizeString)
    )
    .max(15, "Maximum 15 commodités autorisées")
    .optional()
    .default([]),
});

/**
 * Schéma pour la mise à jour d'un logement.
 */
export const UpdateListingSchema = CreateListingSchema.partial();

// Types exportés
export type CreateListingInput = z.infer<typeof CreateListingSchema>;
export type UpdateListingInput = z.infer<typeof UpdateListingSchema>;

/**
 * Schéma de validation des paramètres de requête GET /api/listings.
 * US1.3 — city, type, minPrice, maxPrice, page, limit
 * US2.1 — rooms, amenities, maxCampusDistance, sortBy
 */
export const ListingQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 20))
    .pipe(z.number().int().min(1).max(100)),

  // US1.3 — Filtres basiques
  city: z.string().optional(),
  type: z.nativeEnum(ListingType).optional(),
  minPrice: z
    .string()
    .optional()
    .transform((v) => (v ? parseFloat(v) : undefined)),
  maxPrice: z
    .string()
    .optional()
    .transform((v) => (v ? parseFloat(v) : undefined)),

  // US2.1 — Filtres avancés
  rooms: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined)),
  amenities: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => {
      if (!v) return undefined;
      return Array.isArray(v) ? v : v.split(',').map((s) => s.trim()).filter(Boolean);
    }),
  maxCampusDistance: z
    .string()
    .optional()
    .transform((v) => (v ? parseFloat(v) : undefined)),
  sortBy: z
    .enum(['newest', 'price_asc', 'price_desc', 'trust_score', 'campus_distance'])
    .optional()
    .default('newest'),
});

export type ListingQueryParams = z.infer<typeof ListingQuerySchema>;
