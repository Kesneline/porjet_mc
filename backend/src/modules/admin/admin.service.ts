/**
 * @file admin.service.ts
 * @description Logique métier réservée aux administrateurs.
 */
import { prisma } from '../../config/prisma.config';
import { AppError } from '../../middlewares/error.middleware';
import { ReportStatus } from '@prisma/client';
import { ResolveReportInput, UpdateListingStatusInput, UpdateRoleInput, UpdateUserStatusInput } from './admin.dto';

export class AdminService {
  /**
   * Valide officiellement l'identité d'un utilisateur.
   * @param userId - ID de l'utilisateur à vérifier.
   */
  static async verifyUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError("Utilisateur introuvable.", 404);

    return await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true, status: 'ACTIVE' },
      select: {
        id: true,
        email: true,
        name: true,
        isVerified: true,
        status: true
      }
    });
  }

  /**
   * Change le rôle d'un utilisateur (ex: passage à OWNER ou ADMIN).
   * @param userId - ID de l'utilisateur.
   * @param role - Le nouveau rôle à attribuer.
   */
  static async updateUserRole(userId: string, role: UpdateRoleInput['role']) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError("Utilisateur introuvable.", 404);

    return await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    });
  }

  /**
   * Change le statut d'un compte utilisateur (ACTIVE, SUSPENDED, BANNED).
   * @param userId - ID de l'utilisateur.
   * @param status - Le nouveau statut de compte (UC18).
   */
  static async updateUserStatus(userId: string, status: UpdateUserStatusInput['status']) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError("Utilisateur introuvable.", 404);

    return await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
      }
    });
  }

  /**
   * Récupère la liste de tous les utilisateurs (pour administration).
   */
  static async getAllUsers() {
    return await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // ===================================================================
  // MODÉRATION DES ANNONCES (LISTINGS - P8)
  // ===================================================================

  /**
   * Récupère tous les listings en attente de modération.
   */
  static async getPendingListings() {
    return await prisma.listing.findMany({
      where: { status: 'PENDING' },
      include: {
        owner: { select: { id: true, name: true, phone: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  /**
   * Valide ou modifie le statut d'une annonce.
   * @param listingId - ID de l'annonce.
   * @param status - Nouveau statut (ACTIVE, REJECTED, etc.).
   */
  static async updateListingStatus(listingId: string, status: UpdateListingStatusInput['status']) {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new AppError("Logement introuvable.", 404);

    return await prisma.listing.update({
      where: { id: listingId },
      data: { status },
      include: {
        owner: { select: { id: true, email: true, name: true } }
      }
    });
  }

  // ===================================================================
  // GESTION DES SIGNALEMENTS (REPORTS - UC16)
  // ===================================================================

  /**
   * Récupère tous les rapports (signalements) de la plateforme.
   */
  static async getReports(status?: ReportStatus) {
    return await prisma.report.findMany({
      where: status ? { status } : {},
      include: {
        reporter: { select: { id: true, name: true } },
        listing: { select: { id: true, title: true, status: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Résout un signalement avec une note administrative.
   */
  static async resolveReport(reportId: string, status: ResolveReportInput['status'], adminNote?: ResolveReportInput['adminNote']) {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new AppError("Signalement introuvable.", 404);

    return await prisma.report.update({
      where: { id: reportId },
      data: { status, adminNote },
      include: {
        reporter: { select: { name: true } },
        listing: { select: { title: true } }
      }
    });
  }

  // ===================================================================
  // ANALYTICS & DASHBOARD (UC17)
  // ===================================================================

  /**
   * Récupère les indicateurs clés de performance du système.
   */
  static async getSystemStats() {
    const [userCount, listingCount, reportCount, activeListings] = await Promise.all([
      prisma.user.count(),
      prisma.listing.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.listing.count({ where: { status: 'ACTIVE' } })
    ]);

    // Prix moyen simple par ville
    const avgPrice = await prisma.listing.aggregate({
      _avg: { price: true },
      where: { status: 'ACTIVE' }
    });

    return {
      users: userCount,
      listings: {
        total: listingCount,
        active: activeListings
      },
      pendingReports: reportCount,
      averageSystemPrice: avgPrice._avg.price || 0
    };
  }

  // ===================================================================
  // Filter users by ID (UC17)
  // ===================================================================

  /**
   * Accède au détail d'un utilisateur par son ID.
   * @param userId - ID de l'utilisateur.
   */
  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        university:true,
        phone: true,
        avatar: true,
        trustScore: true,
        isVerified: true,
        status: true,
        createdAt: true,
      }
    });
    if (!user) throw new AppError("Utilisateur introuvable.", 404);
    return user;
  }
}


