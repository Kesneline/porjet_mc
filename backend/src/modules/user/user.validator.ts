import { z } from 'zod';

/**
 * Schéma de validation pour la mise à jour du profil utilisateur.
 * Tous les champs sont optionnels car l'utilisateur peut n'en mettre à jour qu'un seul.
 */
export const UpdateProfileSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères.").optional(),
  university: z.string().optional(),
  phone: z.string().optional(),
  // On ne valide pas l'avatar ici car il passe par Multer (file upload)
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
