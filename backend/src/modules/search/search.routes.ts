/**
 * @file search.routes.ts
 * @description Routes pour la recherche full-text Algolia (US2.4).
 *
 * GET /api/search — Recherche publique dans l'index Algolia des annonces.
 */
import { Router } from 'express';
import { search } from './search.controller';

const router = Router();

// Route publique — pas d'authentification requise pour la recherche
router.get('/', search);

export default router;
