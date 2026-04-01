/**
 * @file listing.routes.ts
 * @description Définition des points d'accès (endpoints) pour le module Logements.
 */
import { Router } from 'express';
import * as ListingController from './listing.controller';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';
import { upload } from '../../middlewares/upload.middleware';

const router = Router();

/**
 * --- ROUTES PUBLIQUES ---
 * Tout le monde (étudiants ou visiteurs) peut voir les annonces.
 */
router.get('/', ListingController.getAll);
router.get('/:id', ListingController.getById);

/**
 * --- ROUTES PROTÉGÉES (Owner / Admin) ---
 */

// Création : Authentification requise + Rôle OWNER ou ADMIN
// On utilise upload.array('photos', 5) pour limiter à 5 photos
router.post(
  '/', 
  requireAuth, 
  requireRole(['OWNER', 'ADMIN']), 
  upload.array('photos', 5), 
  ListingController.create
);

// Mise à jour : Filtré par propriété du logement à l'intérieur du controller
router.patch(
  '/:id', 
  requireAuth, 
  requireRole(['OWNER', 'ADMIN']), 
  upload.none(), // Pas de nouvelles photos gérées via patch pour l'instant (JSON ou simple Text)
  ListingController.update
);

// Suppression
router.delete(
  '/:id', 
  requireAuth, 
  ListingController.remove
);

export default router;
