import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';
import { successResponse } from '../../utils/response.formatter';
import { 
  UpdateRoleSchema, 
  UpdateUserStatusSchema, 
  UpdateListingStatusSchema, 
  ResolveReportSchema 
} from './admin.validator';

/**
 * Valide l'identité d'un utilisateur.
 * PATCH /api/admin/users/:id/verify
 */
export const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await AdminService.verifyUser(id);
    res.status(200).json(successResponse("Utilisateur vérifié avec succès", user));
  } catch (err) {
    next(err);
  }
};

/**
 * Liste tous les utilisateurs du système.
 * GET /api/admin/users
 */
export const listUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await AdminService.getAllUsers();
    res.status(200).json(successResponse("Liste des utilisateurs récupérée", users));
  } catch (err) {
    next(err);
  }
};

/**
 * Change le rôle d'un utilisateur.
 * PATCH /api/admin/users/:id/role
 */
export const changeRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    // Validation Zod au lieu d'un cast direct
    const validatedData = UpdateRoleSchema.parse(req.body);
    
    const user = await AdminService.updateUserRole(id, validatedData.role);
    res.status(200).json(successResponse("Rôle mis à jour avec succès", user));
  } catch (err) {
    next(err);
  }
};

/**
 * Change le statut d'un compte (Suspension/Bannissement).
 * PATCH /api/admin/users/:id/status
 */
export const changeUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    // Validation systémique UC18
    const validatedData = UpdateUserStatusSchema.parse(req.body);
    
    const user = await AdminService.updateUserStatus(id, validatedData.status);
    res.status(200).json(successResponse("Statut utilisateur mis à jour", user));
  } catch (err) {
    next(err);
  }
};

// ===================================================================
// MODÉRATION DES ANNONCES
// ===================================================================

/**
 * Liste les annonces en attente de validation.
 * GET /api/admin/listings/pending
 */
export const listPendingListings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const listings = await AdminService.getPendingListings();
    res.status(200).json(successResponse("Annonces en attente récupérées", listings));
  } catch (err) {
    next(err);
  }
};

/**
 * Valide ou rejette une annonce.
 * PATCH /api/admin/listings/:id/status
 */
export const moderateListing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    // Validation P8
    const validatedData = UpdateListingStatusSchema.parse(req.body);
    
    const listing = await AdminService.updateListingStatus(id, validatedData.status);
    res.status(200).json(successResponse(`Statut de l'annonce mis à jour (${validatedData.status})`, listing));
  } catch (err) {
    next(err);
  }
};

// ===================================================================
// GESTION DES SIGNALEMENTS
// ===================================================================

/**
 * Liste les signalements.
 * GET /api/admin/reports
 */
export const listReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reports = await AdminService.getReports();
    res.status(200).json(successResponse("Signalements récupérés", reports));
  } catch (err) {
    next(err);
  }
};

/**
 * Résout un signalement.
 * PATCH /api/admin/reports/:id/resolve
 */
export const resolveReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    // Validation UC16
    const validatedData = ResolveReportSchema.parse(req.body);
    
    const report = await AdminService.resolveReport(id, validatedData.status, validatedData.adminNote);
    res.status(200).json(successResponse("Signalement traité avec succès", report));
  } catch (err) {
    next(err);
  }
};

// ===================================================================
// ANALYTICS
// ===================================================================

/**
 * Récupère les statistiques globales.
 * GET /api/admin/stats
 */
export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await AdminService.getSystemStats();
    res.status(200).json(successResponse("Statistiques système récupérées", stats));
  } catch (err) {
    next(err);
  }
};
