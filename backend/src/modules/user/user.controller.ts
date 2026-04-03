import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { UpdateProfileSchema } from './user.validator';
import { successResponse } from '../../utils/response.formatter';
import { AppError } from '../../middlewares/error.middleware';

/**
 * Récupère le profil de l'utilisateur actuellement connecté.
 */
export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const profile = await UserService.getUserProfile(userId);
    res.status(200).json(successResponse("Profil récupéré avec succès", profile));
  } catch (err) {
    next(err);
  }
};

/**
 * Met à jour le profil de l'utilisateur (nom, téléphone, université, avatar).
 */
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const validatedData = UpdateProfileSchema.parse(req.body);
    const file = req.file; // Récupéré par upload.single('avatar')

    const updatedUser = await UserService.updateProfile(userId, validatedData, file);
    res.status(200).json(successResponse("Profil mis à jour avec succès", updatedUser));
  } catch (err) {
    next(err);
  }
};
