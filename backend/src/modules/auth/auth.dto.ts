/**
 * @file auth.dto.ts
 * @description DTOs (Data Transfer Objects) pour le module Authentification.
 *
 * Un DTO est un type TypeScript qui décrit la forme exacte des données
 * qui entrent dans notre système depuis le client (req.body).
 *
 * Avantages :
 * - Supprime tous les `any` dans les services et controllers → typage strict
 * - Sert de contrat lisible entre le client et le serveur
 * - Réutilisable dans les validateurs Zod et les Services
 */

/**
 * DTO pour l'inscription d'un utilisateur.
 * Correspond au body attendu sur POST /api/auth/register
 */
export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  university?: string; // Optionnel : l'université de l'étudiant
  phone?: string;      // Optionnel : numéro de téléphone
}

/**
 * DTO pour la connexion d'un utilisateur.
 * Correspond au body attendu sur POST /api/auth/login
 */
export interface LoginDto {
  email: string;
  password: string;
}
