/**
 * @file admin.dto.ts
 * @description Définitions des types de données pour les entrées du module Admin.
 */
import { Role, UserStatus, ListingStatus, ReportStatus } from '@prisma/client';

/**
 * Mise à jour du rôle d'un utilisateur.
 */
export interface UpdateRoleInput {
  role: Role;
}

/**
 * Mise à jour du statut d'un compte utilisateur.
 */
export interface UpdateUserStatusInput {
  status: UserStatus;
}

/**
 * Modération d'une annonce.
 */
export interface UpdateListingStatusInput {
  status: ListingStatus;
}

/**
 * Résolution d'un signalement.
 */
export interface ResolveReportInput {
  status: ReportStatus;
  adminNote?: string;
}
