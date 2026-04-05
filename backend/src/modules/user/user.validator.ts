import { z } from 'zod';
import { sanitizeString } from '../../utils/sanitize.utils';

/**
 * Schéma de validation pour la mise à jour du profil utilisateur.
 * Tous les champs sont optionnels car l'utilisateur peut n'en mettre à jour qu'un seul.
 *
 * Inclut :
 * - Limites de longueur pour prévenir DoS
 * - Sanitization des champs de texte libre contre XSS
 * - Type validation
 */
export const UpdateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères.")
    .max(25, "Le nom ne peut pas dépasser 20 caractères.")
    .transform(sanitizeString) // Sanitize contre XSS
    .optional(),

  university: z
    .string()
    .max(50, "L'université ne peut pas dépasser 50 caractères.")
    .transform(sanitizeString) // Sanitize contre XSS
    .optional(),

  phone: z
    .string()
    .max(12, "Le téléphone ne peut pas dépasser 12 caractères.")
    .regex(/^[0-9+\s()-]+$/, "Le téléphone doit contenir uniquement des chiffres et caractères spéciaux (+, -, parentheses)")
    .transform(sanitizeString) // Sanitize contre XSS
    .optional(),

  // L'avatar passe par Multer (file upload), pas validé ici
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

