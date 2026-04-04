/**
 * @file listing.routes.ts
 * @description Définition des points d'accès (endpoints) pour le module Logements.
 *
 * US1.3 — GET / avec filtres basiques (ville, type, prix) — route publique
 * US1.4 — POST / ouvert aux rôles STUDENT, STUDENT_PREMIUM, OWNER, ADMIN
 * US2.1 — GET / avec filtres avancés (équipements, distance campus) — route publique
 */
import { Router } from 'express';
import * as ListingController from './listing.controller';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';
import { upload } from '../../middlewares/upload.middleware';

const router = Router();

// ─────────────────────────────────────────────────────────────
// ROUTES PUBLIQUES
// Tout le monde (étudiant non connecté ou visiteur) peut lire.
// ─────────────────────────────────────────────────────────────

// US1.3 + US2.1 — Liste avec filtres (ville, type, prix, équipements, campus...)
router.get('/', ListingController.getAll);
router.get('/:id', ListingController.getById);

// ─────────────────────────────────────────────────────────────
// ROUTES PROTÉGÉES
// ─────────────────────────────────────────────────────────────

// US1.4 — Publication annonce :
//   - STUDENT/STUDENT_PREMIUM : 1 annonce gratuite (limite vérifiée dans le service)
//   - OWNER/ADMIN : annonces illimitées
router.post(
  '/',
  requireAuth,
  requireRole(['STUDENT', 'STUDENT_PREMIUM', 'OWNER', 'ADMIN']),
  upload.array('photos', 5),
  ListingController.create
);

// Mise à jour : vérification de propriété dans le service
router.patch(
  '/:id',
  requireAuth,
  requireRole(['STUDENT', 'STUDENT_PREMIUM', 'OWNER', 'ADMIN']),
  upload.none(),
  ListingController.update
);

// Suppression
router.delete('/:id', requireAuth, ListingController.remove);

export default router;
