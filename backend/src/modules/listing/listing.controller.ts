/**
 * @file listing.controller.ts
 * @description Handlers pour les requêtes HTTP liées aux logements.
 *
 * US1.3 — getAll supporte les filtres basiques via query params (ville, type, prix)
 * US1.4 — create autorise les rôles STUDENT et OWNER (avec limite pour STUDENT)
 * US2.1 — getAll supporte les filtres avancés (équipements, distance campus, tri)
 * US2.2 — getMapData retourne les données géographiques pour la carte interactive
 */
import { Request, Response, NextFunction } from 'express';
import { ListingService } from './listing.service';
import { CreateListingSchema, UpdateListingSchema, ListingQuerySchema } from './listing.validator';
import { successResponse } from '../../utils/response.formatter';
import { AppError } from '../../middlewares/error.middleware';

/**
 * GET /api/listings
 * US1.3 — Filtres basiques : ?city=Yaoundé&type=CHAMBRE&minPrice=15000&maxPrice=50000
 * US2.1 — Filtres avancés : &rooms=2&amenities=Wifi,Eau&maxCampusDistance=2&sortBy=price_asc
 */
export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = ListingQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(
        parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(' | '),
        400
      );
    }

    const result = await ListingService.getAllListings(parsed.data);
    res.status(200).json(successResponse('Liste des logements récupérée', result));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/listings/:id
 * Récupère les détails d'un logement spécifique.
 */
export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const listing = await ListingService.getListingById(id);
    res.status(200).json(successResponse('Détails du logement récupérés', listing));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/listings
 * US1.4 — Création d'une annonce (STUDENT, STUDENT_PREMIUM, OWNER, ADMIN).
 * Gère l'upload de fichiers via Multer.
 */
export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Nettoyage des clés (trim) au cas où il y a des espaces invisibles
    const cleanBody = Object.fromEntries(
      Object.entries(req.body).map(([key, value]) => [key.trim(), value])
    );

    // Conversion des types (Multer multipart/form-data envoie tout en string)
    const rawData: any = {
      ...cleanBody,
      price: cleanBody.price ? parseFloat(cleanBody.price as string) : undefined,
      latitude: cleanBody.latitude ? parseFloat(cleanBody.latitude as string) : undefined,
      longitude: cleanBody.longitude ? parseFloat(cleanBody.longitude as string) : undefined,
      rooms: cleanBody.rooms ? parseInt(cleanBody.rooms as string) : undefined,
    };

    // Parsing sécurisé des amenities (envoyés en JSON string via form-data)
    if (typeof cleanBody.amenities === 'string') {
      try {
        rawData.amenities = JSON.parse(cleanBody.amenities);
      } catch (e) {
        throw new AppError(
          "Le format du champ 'amenities' est invalide. Il doit s'agir d'un tableau JSON, ex: [\"Wifi\", \"Eau\"].",
          400
        );
      }
    } else {
      rawData.amenities = cleanBody.amenities;
    }

    const validatedData = CreateListingSchema.parse(rawData);

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      throw new AppError('Au moins une photo du logement est requise.', 400);
    }

    const ownerId = req.user!.userId;
    const ownerRole = req.user!.role;

    const listing = await ListingService.createListing(validatedData, ownerId, ownerRole, files);
    res.status(201).json(successResponse('Annonce créée avec succès', listing));
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/listings/:id
 * Mise à jour d'une annonce.
 */
export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const rawData = { ...req.body };
    if (rawData.price) rawData.price = parseFloat(rawData.price);
    if (rawData.latitude) rawData.latitude = parseFloat(rawData.latitude);
    if (rawData.longitude) rawData.longitude = parseFloat(rawData.longitude);
    if (rawData.rooms) rawData.rooms = parseInt(rawData.rooms);

    const validatedData = UpdateListingSchema.parse(rawData);
    const updatedListing = await ListingService.updateListing(id, userId, userRole, validatedData);
    res.status(200).json(successResponse('Annonce mise à jour avec succès', updatedListing));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/listings/map
 * US2.2 — Données géographiques pour la carte interactive.
 * Retourne un payload léger avec coordonnées, prix et couleur du marker.
 * Query optionnel : ?city=Yaoundé
 */
export const getMapData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const city = req.query.city as string | undefined;
    const result = await ListingService.getMapListings(city);
    res.status(200).json(successResponse('Données carte récupérées', result));
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/listings/:id
 * Suppression d'une annonce.
 */
export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    await ListingService.deleteListing(id, userId, userRole);
    res.status(200).json(successResponse('Annonce supprimée avec succès'));
  } catch (err) {
    next(err);
  }
};
