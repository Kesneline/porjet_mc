/**
 * @file listing.validator.ts
 * @description Schémas de validation Zod pour les annonces de logements.
 *
 * US1.3 — Ajout de ListingQuerySchema pour les filtres basiques
 * US2.1 — Extension avec les filtres avancés (amenities, campusDist, sortBy)
 */
import { z } from 'zod';
import { ListingType } from '@prisma/client';

/**
 * Schéma pour la création d'un logement (US1.4).
 */
export const CreateListingSchema = z.object({
  title: z.string().min(5, 'Le titre doit faire au moins 5 caractères').max(100),
  description: z.string().min(20, 'La description doit faire au moins 20 caractères'),
  price: z.number().positive('Le prix doit être un nombre positif'),
  address: z.string().min(5, "L'adresse est requise"),
  city: z.string().min(2, 'La ville est requise'),
  latitude: z.number(),
  longitude: z.number(),
  rooms: z.number().int().min(1).optional().default(1),
  type: z.nativeEnum(ListingType, {
    errorMap: () => ({ message: 'Type de logement invalide (STUDIO, CHAMBRE, APPARTEMENT, COLOCATION)' }),
  }),
  amenities: z.array(z.string()).optional().default([]),
});

/**
 * Schéma pour la mise à jour d'un logement.
 */
export const UpdateListingSchema = CreateListingSchema.partial();

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
