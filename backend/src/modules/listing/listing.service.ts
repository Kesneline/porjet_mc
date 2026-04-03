/**
 * @file listing.service.ts
 * @description Logique métier pour la gestion des annonces de logements.
 */
import { prisma } from '../../config/prisma.config';
import cloudinary from '../../config/cloudinary.config';
import { CreateListingInput, UpdateListingInput } from './listing.dto';
import { AppError } from '../../middlewares/error.middleware';

export class ListingService {

  /**
   * Création d'une nouvelle annonce de logement.
   * 
   * @param data - Données du logement (sans les photos)
   * @param ownerId - ID de l'utilisateur créateur (doit être OWNER ou ADMIN)
   * @param files - Liste des fichiers images bufferisés (Multer MemoryStorage)
   * @returns Le logement créé avec ses URLs Cloudinary
   */
  static async createListing(
    data: CreateListingInput,
    ownerId: string,
    files: Express.Multer.File[]
  ) {
    // 1. Upload des images sur Cloudinary en parallèle
    const photoUrls = await this.uploadImagesToCloudinary(files);

    // 2. Création de l'annonce en base via Prisma
    const listing = await prisma.listing.create({
      data: {
        ...data,
        ownerId,
        photos: photoUrls,
      }
    });

    return listing;
  }

  /**
   * Récupération de toutes les annonces (pagination simple).
   * 
   * @param page - Numéro de page (défaut : 1)
   * @param limit - Nombre d'annonces par page (défaut : 20)
   */
  static async getAllListings(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where: { status: 'ACTIVE' },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: { id: true, name: true, email: true, phone: true }
          }
        }
      }),
      prisma.listing.count({ where: { status: 'ACTIVE' } })
    ]);

    return {
      listings,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Récupère un logement par son ID.
   */
  static async getListingById(id: string) {
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        reviews: { take: 5, orderBy: { createdAt: 'desc' } }
      }
    });

    if (!listing) throw new AppError("Logement introuvable.", 404);
    return listing;
  }

  /**
   * Mise à jour d'un logement (avec vérification de propriété).
   */
  static async updateListing(
    id: string,
    userId: string,
    userRole: string,
    data: UpdateListingInput
  ) {
    const listing = await this.getListingById(id);

    // Seul le propriétaire ou un ADMIN peut modifier
    if (listing.ownerId !== userId && userRole !== 'ADMIN') {
      throw new AppError("Vous n'êtes pas autorisé à modifier ce logement.", 403);
    }

    return await prisma.listing.update({
      where: { id },
      data
    });
  }

  /**
   * Suppression logic ou physique d'un logement (vérification propriété).
   */
  static async deleteListing(id: string, userId: string, userRole: string) {
    const listing = await this.getListingById(id);

    if (listing.ownerId !== userId && userRole !== 'ADMIN') {
      throw new AppError("Vous n'êtes pas autorisé à supprimer ce logement.", 403);
    }

    // On peut faire un delete physique ou passer le status à ARCHIVED
    return await prisma.listing.delete({ where: { id } });
  }

  /**
   * HELPER : Upload multiple fichiers sur Cloudinary.
   * Convertit les buffers en flux pour Cloudinary.
   */
  private static async uploadImagesToCloudinary(files: Express.Multer.File[]): Promise<string[]> {
    if (!files || files.length === 0) return [];

    const uploadPromises = files.map(file => {
      return new Promise<string>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'studhousing/listings' },
          (error, result) => {
            if (error) {
              return reject(new AppError("Erreur lors de l'upload d'image.", 500));
            }
            resolve(result!.secure_url);
          }
        );
        uploadStream.end(file.buffer);
      });
    });

    return Promise.all(uploadPromises);
  }
}
