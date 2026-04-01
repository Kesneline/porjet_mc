/**
 * @file listing.validator.ts
 * @description Schémas de validation Zod pour les annonces de logements.
 */
import { z } from 'zod';
import { ListingType } from '@prisma/client';

/**
 * Schéma pour la création d'un logement.
 * On utilise z.nativeEnum pour s'assurer que le type correspond à Prisma.
 */
export const CreateListingSchema = z.object({
  title: z.string().min(5, "Le titre doit faire au moins 5 caractères").max(100),
  description: z.string().min(20, "La description doit faire au moins 20 caractères"),
  price: z.number().positive("Le prix doit être un nombre positif"),
  address: z.string().min(5, "L'adresse est requise"),
  city: z.string().min(2, "La ville est requise"),
  latitude: z.number(),
  longitude: z.number(),
  rooms: z.number().int().min(1).optional().default(1),
  type: z.nativeEnum(ListingType, {
    errorMap: () => ({ message: "Type de logement invalide (STUDIO, CHAMBRE, APPARTEMENT, COLOCATION)" })
  }),
  amenities: z.array(z.string()).optional().default([]),
});

/**
 * Schéma pour la mise à jour d'un logement.
 * Tous les champs sont optionnels (.partial()).
 */
export const UpdateListingSchema = CreateListingSchema.partial();
