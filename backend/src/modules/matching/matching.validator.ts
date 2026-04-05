/**
 * @file matching.validator.ts
 * @description Validation Zod du profil étudiant pour le matching IA (US4.1).
 */
import { z } from 'zod';
import { ListingType } from '@prisma/client';

/**
 * Schéma du profil étudiant envoyé pour le matching.
 * Le endpoint POST /api/matching attend ce body.
 */
export const MatchingProfileSchema = z.object({
  budget: z.number().positive('Le budget doit être positif'),
  campusName: z.string().min(2, 'Le nom du campus est requis'),
  campusLat: z.number(),
  campusLng: z.number(),
  maxDistance: z.number().positive().optional().default(5),       // km
  preferredType: z.nativeEnum(ListingType).optional(),
  requiredAmenities: z.array(z.string()).optional().default([]),
  roommates: z.boolean().optional().default(false),               // accepte colocation ?
  additionalNotes: z.string().max(500).optional().default(''),    // infos libres
  limit: z.number().int().min(1).max(20).optional().default(10),
});

export type MatchingProfile = z.infer<typeof MatchingProfileSchema>;
