/**
 * @file listing.service.ts
 * @description Logique métier pour la gestion des annonces de logements.
 *
 * US1.3 — Consultation liste avec filtres basiques (ville, type, prix)
 * US1.4 — Publication annonce avec photos + localisation (incl. rôle STUDENT)
 * US2.1 — Filtres avancés (budget, équipements, distance campus)
 * US2.4 — Synchronisation Algolia à chaque création/suppression d'annonce
 */
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.config';
import cloudinary from '../../config/cloudinary.config';
import { listingsIndex } from '../../config/algolia.config';
import { CreateListingInput, UpdateListingInput, ListingFilters } from './listing.dto';
import { AppError } from '../../middlewares/error.middleware';

export class ListingService {

  /**
   * Création d'une nouvelle annonce de logement.
   * US1.4 — Propriétaire ET étudiant sortant peuvent publier.
   * Règle métier : les étudiants (STUDENT) sont limités à 1 annonce gratuite.
   *
   * @param data      - Données du logement (sans les photos)
   * @param ownerId   - ID de l'utilisateur créateur
   * @param ownerRole - Rôle de l'utilisateur (pour vérifier la limite STUDENT)
   * @param files     - Liste des fichiers images bufferisés (Multer MemoryStorage)
   * @returns Le logement créé avec ses URLs Cloudinary
   */
  static async createListing(
    data: CreateListingInput,
    ownerId: string,
    ownerRole: string,
    files: Express.Multer.File[]
  ) {
    // US1.4 — Limite : 1 annonce gratuite pour les étudiants non-premium
    if (ownerRole === 'STUDENT') {
      const existingCount = await prisma.listing.count({
        where: { ownerId, status: { not: 'ARCHIVED' } },
      });
      if (existingCount >= 1) {
        throw new AppError(
          "Les étudiants peuvent publier 1 annonce gratuite. Passez en Premium pour en publier davantage.",
          403
        );
      }
    }

    // 1. Upload des images sur Cloudinary en parallèle
    const photoUrls = await this.uploadImagesToCloudinary(files);

    // 2. Création de l'annonce en base via Prisma
    const listing = await prisma.listing.create({
      data: {
        ...data,
        ownerId,
        photos: photoUrls,
      },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    // 3. Synchronisation Algolia (US2.4) — non-bloquant
    this.syncToAlgolia(listing).catch((err: Error) => {
      console.warn('[Algolia] Échec de synchronisation pour listing', listing.id, err.message);
    });

    return listing;
  }

  /**
   * Récupération filtrée des annonces avec pagination.
   * US1.3 — Filtres basiques : ville, type, prix
   * US2.1 — Filtres avancés : budget, équipements, distance campus, tri
   *
   * @param filters - Paramètres de filtrage et pagination
   */
  static async getAllListings(filters: ListingFilters) {
    const {
      page = 1,
      limit = 20,
      city,
      type,
      minPrice,
      maxPrice,
      rooms,
      amenities,
      maxCampusDistance,
      sortBy = 'newest',
    } = filters;

    const skip = (page - 1) * limit;

    // Construction dynamique du filtre Prisma
    const where: Prisma.ListingWhereInput = { status: 'ACTIVE' };

    // US1.3 — Filtre par ville
    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }
    // US1.3 — Filtre par type de logement
    if (type) {
      where.type = type;
    }
    // US1.3 / US2.1 — Filtre par fourchette de prix
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {
        ...(minPrice !== undefined && { gte: minPrice }),
        ...(maxPrice !== undefined && { lte: maxPrice }),
      };
    }
    // US2.1 — Filtre par nombre de pièces minimum
    if (rooms !== undefined) {
      where.rooms = { gte: rooms };
    }
    // US2.1 — Filtre par équipements (hasSome = au moins un des équipements demandés)
    if (amenities && amenities.length > 0) {
      where.amenities = { hasSome: amenities };
    }
    // US2.1 — Filtre par distance campus max (en km)
    if (maxCampusDistance !== undefined) {
      where.campusDist = { lte: maxCampusDistance };
    }

    // Construction de l'ordre de tri
    let orderBy: Prisma.ListingOrderByWithRelationInput | Prisma.ListingOrderByWithRelationInput[];
    switch (sortBy) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'trust_score':
        orderBy = { trustScore: 'desc' };
        break;
      case 'campus_distance':
        orderBy = { campusDist: 'asc' };
        break;
      default:
        // Les annonces boostées remontent en premier (US4.4), puis les plus récentes
        orderBy = [{ isBoosted: 'desc' }, { createdAt: 'desc' }];
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          owner: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    return {
      listings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      activeFilters: { city, type, minPrice, maxPrice, rooms, amenities, maxCampusDistance, sortBy },
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
        reviews: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!listing) throw new AppError('Logement introuvable.', 404);
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

    if (listing.ownerId !== userId && userRole !== 'ADMIN') {
      throw new AppError("Vous n'êtes pas autorisé à modifier ce logement.", 403);
    }

    const updated = await prisma.listing.update({ where: { id }, data });

    // Mise à jour Algolia (US2.4)
    this.syncToAlgolia(updated).catch((err: Error) => {
      console.warn('[Algolia] Échec de mise à jour pour listing', id, err.message);
    });

    return updated;
  }

  /**
   * Suppression d'un logement (avec vérification de propriété).
   */
  static async deleteListing(id: string, userId: string, userRole: string) {
    const listing = await this.getListingById(id);

    if (listing.ownerId !== userId && userRole !== 'ADMIN') {
      throw new AppError("Vous n'êtes pas autorisé à supprimer ce logement.", 403);
    }

    await prisma.listing.delete({ where: { id } });

    // Suppression dans Algolia (US2.4)
    if (listingsIndex) {
      listingsIndex.deleteObject(id).catch((err: Error) => {
        console.warn('[Algolia] Échec de suppression pour listing', id, err.message);
      });
    }
  }

  /**
   * Active le boost d'une annonce après paiement réussi (US4.4).
   * Appelé par le PaymentService après confirmation du paiement Orange Money.
   *
   * @param listingId    - ID de l'annonce à booster
   * @param durationDays - Durée du boost en jours
   */
  static async activateBoost(listingId: string, durationDays: number) {
    const boostedUntil = new Date();
    boostedUntil.setDate(boostedUntil.getDate() + durationDays);

    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: { isBoosted: true, boostedUntil },
    });

    // Mise à jour Algolia pour que l'annonce boostée remonte dans les résultats
    this.syncToAlgolia(updated).catch((err: Error) => {
      console.warn('[Algolia] Échec sync boost listing', listingId, err.message);
    });

    return updated;
  }

  /**
   * US2.2 — Récupère les données géographiques de toutes les annonces actives
   * pour l'affichage sur la carte interactive avec markers colorés.
   *
   * Retourne un payload léger (pas de description ni photos complètes)
   * optimisé pour le rendu carte sur mobile (faible bande passante).
   *
   * Couleur des markers :
   *   - green  : trustScore >= 3.5
   *   - orange : trustScore >= 2.0
   *   - red    : trustScore < 2.0
   *   - gold   : annonce boostée (isBoosted)
   */
  static async getMapListings(city?: string) {
    const where: Prisma.ListingWhereInput = {
      status: 'ACTIVE',
      latitude: { not: 0 },
      longitude: { not: 0 },
    };
    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    const listings = await prisma.listing.findMany({
      where,
      select: {
        id: true,
        title: true,
        price: true,
        city: true,
        latitude: true,
        longitude: true,
        type: true,
        rooms: true,
        trustScore: true,
        isBoosted: true,
        photos: true,
        status: true,
      },
    });

    // Ajout de la couleur du marker côté serveur pour simplifier le client
    const markers = listings.map((l) => {
      let markerColor: string;
      if (l.isBoosted) markerColor = 'gold';
      else if (l.trustScore >= 3.5) markerColor = 'green';
      else if (l.trustScore >= 2.0) markerColor = 'orange';
      else markerColor = 'red';

      return {
        id: l.id,
        title: l.title,
        price: l.price,
        city: l.city,
        latitude: l.latitude,
        longitude: l.longitude,
        type: l.type,
        rooms: l.rooms,
        trustScore: l.trustScore,
        isBoosted: l.isBoosted,
        thumbnail: l.photos[0] || null,
        markerColor,
      };
    });

    return { markers, total: markers.length };
  }

  // ─────────────────────────────────────────────────────────────
  // HELPERS PRIVÉS
  // ─────────────────────────────────────────────────────────────

  /**
   * US2.4 — Synchronise un logement avec l'index Algolia.
   * Non-bloquant : appelé en fire-and-forget depuis createListing / updateListing.
   */
  private static async syncToAlgolia(listing: any) {
    if (!listingsIndex) return;

    await listingsIndex.saveObject({
      objectID: listing.id,
      title: listing.title,
      description: listing.description,
      city: listing.city,
      address: listing.address,
      type: listing.type,
      price: listing.price,
      rooms: listing.rooms,
      amenities: listing.amenities,
      photos: listing.photos,
      trustScore: listing.trustScore,
      campusDist: listing.campusDist,
      campusName: listing.campusName,
      isBoosted: listing.isBoosted,
      status: listing.status,
      ownerId: listing.ownerId,
      createdAt: listing.createdAt ? Math.floor(new Date(listing.createdAt).getTime() / 1000) : null,
      // Géolocalisation pour la recherche aroundLatLng (US2.1)
      _geoloc:
        listing.latitude != null && listing.longitude != null
          ? { lat: listing.latitude, lng: listing.longitude }
          : undefined,
    });
  }

  /**
   * HELPER : Upload multiple fichiers sur Cloudinary.
   * Convertit les buffers en flux pour Cloudinary.
   */
  private static async uploadImagesToCloudinary(files: Express.Multer.File[]): Promise<string[]> {
    if (!files || files.length === 0) return [];

    const uploadPromises = files.map((file) => {
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
