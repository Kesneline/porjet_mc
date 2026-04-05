/**
 * @file listing.controller.ts
 * @description Handlers pour les requêtes HTTP liées aux logements.
 */
import { Request, Response, NextFunction } from 'express';
import { ListingService } from './listing.service';
import { CreateListingSchema, UpdateListingSchema, CreateListingInput } from './listing.validator';
import { successResponse } from '../../utils/response.formatter';
import { AppError } from '../../middlewares/error.middleware';

/**
 * GET /api/listings
 * Récupère la liste des logements avec pagination.
 */
export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await ListingService.getAllListings(page, limit);
    res.status(200).json(successResponse("Liste des logements récupérée", result));
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
    res.status(200).json(successResponse("Détails du logement récupérés", listing));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/listings
 * Création d'une annonce (nécessite d'être OWNER ou ADMIN).
 * Gère l'upload de fichiers via Multer.
 */
export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Nettoyage des clés (trim) au cas où il y a des espaces invisibles (ex: "title ")
    const cleanBody = Object.fromEntries(
      Object.entries(req.body).map(([key, value]) => [key.trim(), value])
    );

    // 1. Validation des données textuelles du body (via Zod)
    // Note : On doit parser les nombres car Multer (multipart/form-data) envoie tout en string
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
        throw new AppError("Le format du champ 'amenities' est invalide. Il doit s'agir d'un tableau JSON, ex: [\"Wifi\", \"Eau\"].", 400);
      }
    } else {
      rawData.amenities = cleanBody.amenities;
    }

    const validatedData = CreateListingSchema.parse(rawData) as CreateListingInput;

    // 2. Vérification de la présence de photos
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      throw new AppError("Au moins une photo du logement est requise.", 400);
    }

    // 3. Appel au service avec l'ID de l'utilisateur (issu du JWT)
    const ownerId = req.user!.userId;
    const listing = await ListingService.createListing(validatedData, ownerId, files);

    res.status(201).json(successResponse("Annonce créée avec succès", listing));
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

    // Conversion des types si présents dans le body (venant de form-data)
    const rawData = { ...req.body };
    if (rawData.price) rawData.price = parseFloat(rawData.price);
    if (rawData.latitude) rawData.latitude = parseFloat(rawData.latitude);
    if (rawData.longitude) rawData.longitude = parseFloat(rawData.longitude);
    if (rawData.rooms) rawData.rooms = parseInt(rawData.rooms);

    const validatedData = UpdateListingSchema.parse(rawData);

    const updatedListing = await ListingService.updateListing(id, userId, userRole, validatedData);
    res.status(200).json(successResponse("Annonce mise à jour avec succès", updatedListing));
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
    res.status(200).json(successResponse("Annonce supprimée avec succès"));
  } catch (err) {
    next(err);
  }
};
