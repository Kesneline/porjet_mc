/**
 * @file auth.validator.ts
 * @description Schémas de validation Zod pour les données d'authentification.
 *
 * Zod est une librairie de validation par schéma "TypeScript-first".
 * Son avantage majeur : elle valide les données EN RUNTIME (au moment de l'exécution)
 * ET génère automatiquement les types TypeScript correspondants.
 *
 * STRATÉGIE :
 * 1. On définit un schéma Zod (règles métier : format, longueur, etc.)
 * 2. On en extrait le type TypeScript (z.infer) — c'est la source de vérité unique
 * 3. On valide les données dans le controller AVANT de les passer au service
 * 4. On sanitize les champs de texte libre (name, university, phone) via .transform()
 *
 * Cela remplace complètement les if(!email) manuels dans les controllers.
 */
import { z } from 'zod';
import { sanitizeString } from '../../utils/sanitize.utils';

/**
 * Schéma de validation Zod pour l'inscription.
 * Chaque règle génère un message d'erreur clair pour le client mobile.
 */
export const RegisterSchema = z.object({
  email: z
    .string({ required_error: "L'email est obligatoire." })
    .email("Le format de l'email est invalide (ex: user@domain.com)."),

  password: z
    .string({ required_error: "Le mot de passe est obligatoire." })
    .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule.")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre."),

  name: z
    .string({ required_error: "Le nom est obligatoire." })
    .min(2, "Le nom doit contenir au moins 2 caractères.")
    .max(100, "Le nom ne peut pas dépasser 100 caractères.")
    .transform(sanitizeString), // Sanitize contre XSS

  university: z
    .string()
    .max(150, "L'université ne peut pas dépasser 150 caractères.")
    .transform(sanitizeString) // Sanitize contre XSS
    .optional(),

  phone: z
    .string()
    .max(20, "Le téléphone ne peut pas dépasser 20 caractères.")
    .transform(sanitizeString) // Sanitize contre XSS
    .optional(),
});

/**
 * Schéma de validation Zod pour la connexion.
 */
export const LoginSchema = z.object({
  email: z
    .string({ required_error: "L'email est obligatoire." })
    .email("Le format de l'email est invalide."),

  password: z
    .string({ required_error: "Le mot de passe est obligatoire." })
    .min(1, "Le mot de passe est obligatoire."),
});

// Types inférés directement depuis les schémas Zod (source de vérité unique)
// Ces types remplacent nos RegisterDto et LoginDto manuels
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;

/**
 * Schéma de validation pour les routes /refresh et /logout.
 * Le client doit envoyer son Refresh Token opaque (UUID) dans le body.
 */
export const RefreshSchema = z.object({
  refreshToken: z
    .string({ required_error: "Le refreshToken est obligatoire." })
    .uuid("Le refreshToken doit être un UUID valide."),
});

export type RefreshInput = z.infer<typeof RefreshSchema>;
