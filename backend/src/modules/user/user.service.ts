/**
 * @file user.service.ts
 * @description Logique métier pour la gestion des utilisateurs et profils.
 */
import { prisma } from '../../config/prisma.config';
import cloudinary from '../../config/cloudinary.config';
import { AppError } from '../../middlewares/error.middleware';
import { UpdateProfileInput } from './user.validator';

export class UserService {
  /**
   * Récupère les informations complètes du profil d'un utilisateur.
   * @param userId - ID UUID de l'utilisateur.
   */
  static async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        university: true,
        phone: true,
        avatar: true,
        trustScore: true,
        isVerified: true,
        isPremium: true,
        createdAt: true,
      },
    });

    if (!user) throw new AppError('Utilisateur introuvable.', 404);
    return user;
  }

  /**
   * Met à jour les informations de profil d'un utilisateur.
   * Gère également l'upload de l'avatar sur Cloudinary si présent.
   */
  static async updateProfile(userId: string, data: UpdateProfileInput, file?: Express.Multer.File) {
    const updateData: any = { ...data };

    // Si un fichier (image) est fourni, on l'uploade sur Cloudinary
    if (file) {
      try {
        const avatarUrl = await new Promise<string>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'studhousing/avatars', public_id: `avatar_${userId}`, overwrite: true },
            (error, result) => {
              if (error) return reject(new AppError("Échec de l'upload de l'avatar.", 500));
              resolve(result!.secure_url);
            },
          );
          uploadStream.end(file.buffer);
        });
        updateData.avatar = avatarUrl;
      } catch (error) {
        throw new AppError('Erreur lors de la mise à jour de la photo de profil.', 500);
      }
    }

    // Mise à jour en base de données
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        university: true,
        phone: true,
        avatar: true,
      },
    });

    return updatedUser;
  }

  /**
   * Récupère le profil public d'un utilisateur.
   * @param userId - ID UUID de l'utilisateur.
   */
  static async getPublicProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        university: true,
        avatar: true,
        trustScore: true,
        isVerified: true,
        createdAt: true,
        listings: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            title: true,
            city: true,
            price: true,
            photos: true,
            type: true,
          },
        },
        reviews: {
          where: { listing: { status: 'ACTIVE' } },
          select: {
            id: true,
            rating: true,
            comment: true,
          },
        },
      },
    });

    if (!user) throw new AppError('Utilisateur introuvable.', 404);
    return user;
  }

  /**
   * Supprime le compte de l'utilisateur (soft delete).
   * Définit le status à BANNED, efface l'email et définit deletedAt.
   * @param userId - ID UUID de l'utilisateur.
   */
  static async deleteAccount(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('Utilisateur introuvable.', 404);

    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'BANNED',
        email: `deleted_${userId}@deleted.local`,
        deletedAt: new Date(),
      },
    });

    return { message: 'Compte supprimé avec succès.' };
  }
}
