/**
 * @file admin.validator.ts
 * @description Schémas de validation Zod pour les actions administratives.
 */
import { z } from 'zod';
import { Role, UserStatus, ListingStatus, ReportStatus } from '@prisma/client';

/**
 * Schéma pour changer le rôle d'un utilisateur.
 */
export const UpdateRoleSchema = z.object({
  role: z.nativeEnum(Role, {
    errorMap: () => ({ message: "Rôle invalide (STUDENT, OWNER, ADMIN, etc.)" })
  })
});

/**
 * Schéma pour changer le statut d'un utilisateur (suspension/bannissement).
 */
export const UpdateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus, {
    errorMap: () => ({ message: "Statut utilisateur invalide (PENDING, ACTIVE, SUSPENDED, BANNED)" })
  })
});

/**
 * Schéma pour modérer un listing (valider/rejeter).
 */
export const UpdateListingStatusSchema = z.object({
  status: z.nativeEnum(ListingStatus, {
    errorMap: () => ({ message: "Statut d'annonce invalide (PENDING, ACTIVE, REJECTED, etc.)" })
  })
});

/**
 * Schéma pour résoudre un signalement.
 */
export const ResolveReportSchema = z.object({
  status: z.nativeEnum(ReportStatus, {
    errorMap: () => ({ message: "Statut de signalement invalide (RESOLVED, DISMISSED, etc.)" })
  }),
  adminNote: z.string().max(500, "La note est trop longue").optional()
});
