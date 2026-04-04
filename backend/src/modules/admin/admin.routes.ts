import { Router } from 'express';
import * as AdminController from './admin.controller';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

const router = Router();

// PROTECTION GLOBALE DU MODULE : Auth + Role ADMIN ou MODERATOR (selon UC16/UC18)
router.use(requireAuth);
router.use(requireRole(['ADMIN', 'MODERATOR']));

// --- GESTION DES UTILISATEURS ---

/**
 * GET /api/admin/users
 * @desc Liste tous les inscrits (audit)
 */
router.get('/users', AdminController.listUsers);

/**
 * PATCH /api/admin/users/:id/verify
 * @desc Valide officiellement l'identité d'un utilisateur
 */
router.patch('/users/:id/verify', AdminController.verifyUser);

/**
 * PATCH /api/admin/users/:id/role
 * @desc Change le rôle d'un utilisateur (Admin seulement)
 */
router.patch('/users/:id/role', AdminController.changeRole);

/**
 * PATCH /api/admin/users/:id/status
 * @desc Suspendre ou bannir un utilisateur (UC18)
 */
router.patch('/users/:id/status', AdminController.changeUserStatus);

// --- MODÉRATION DES LOGEMENTS (P8) ---

/**
 * GET /api/admin/listings/pending
 * @desc Liste les annonces en attente de validation
 */
router.get('/listings/pending', AdminController.listPendingListings);

/**
 * PATCH /api/admin/listings/:id/status
 * @desc Valide ou rejette une annonce (ACTIVE, REJECTED, etc.)
 */
router.patch('/listings/:id/status', AdminController.moderateListing);

// --- GESTION DES SIGNALEMENTS (UC16) ---

/**
 * GET /api/admin/reports
 * @desc Liste les signalements
 */
router.get('/reports', AdminController.listReports);

/**
 * PATCH /api/admin/reports/:id/resolve
 * @desc Résout un signalement avec une note administrative
 */
router.patch('/reports/:id/resolve', AdminController.resolveReport);

// --- ANALYTICS (UC17/P9) ---

/**
 * GET /api/admin/stats
 * @desc Récupère les KPIs globaux du système
 */
router.get('/stats', AdminController.getStats);

export default router;
