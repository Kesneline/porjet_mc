import { Router } from 'express';
import * as UserController from './user.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { upload } from '../../middlewares/upload.middleware';

const router = Router();

// Toutes les routes de ce module nécessitent d'être authentifié
router.use(requireAuth);

/**
 * GET /api/users/me
 * @desc Récupère le profil de l'utilisateur connecté
 */
router.get('/me', UserController.getMe);

/**
 * PATCH /api/users/profile
 * @desc Met à jour les infos de profil et/ou l'avatar
 */
router.patch('/profile', upload.single('avatar'), UserController.updateProfile);

export default router;
