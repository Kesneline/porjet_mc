/**
 * @file matching.routes.ts
 * @description Routes du module matching IA (US4.1).
 *
 * POST /api/matching — Classement personnalisé des annonces via Claude API.
 * Requiert une authentification (le matching utilise le profil de l'étudiant).
 */
import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { match } from './matching.controller';

const router = Router();

router.post('/', requireAuth, match);

export default router;
