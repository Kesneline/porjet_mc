/**
 * @file prisma.config.ts
 * @description Singleton du client Prisma ORM.
 *
 * PROBLÈME résolu par ce pattern :
 * En développement, ts-node-dev (ou nodemon) rechargent les modules à
 * chaque sauvegarde de fichier. Sans ce Singleton, une nouvelle instance
 * PrismaClient serait créée à chaque rechargement, ce qui épuiserait
 * rapidement le "connection pool" de Supabase (PgBouncer).
 *
 * SOLUTION :
 * On stocke l'instance unique sur l'objet global de Node.js. Ainsi,
 * même si les modules sont rechargés, la même instance Prisma est réutilisée.
 * En production, ce problème n'existe pas car le serveur ne recharge pas.
 */
import { PrismaClient } from '@prisma/client';

// Astuce TypeScript : On étend le type de 'global' pour y ajouter notre prisma
const globalForPrisma = global as unknown as { prisma: PrismaClient };

/**
 * Instance unique (Singleton) du client Prisma.
 * Réutilise l'instance globale si elle existe, sinon en crée une nouvelle.
 */
export const prisma = globalForPrisma.prisma || new PrismaClient();

// On n'attache à global QUE si on n'est pas en production
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
