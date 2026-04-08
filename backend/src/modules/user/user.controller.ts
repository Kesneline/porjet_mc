import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { UpdateProfileSchema } from './user.validator';
import { successResponse } from '../../utils/response.formatter';

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const profile = await UserService.getUserProfile(userId);
    res.status(200).json(successResponse('Profil récupéré avec succès', profile));
  } catch (err) {
    next(err);
  }
};

export const getPublicProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const profile = await UserService.getPublicProfile(id);
    res.status(200).json(successResponse('Profil public récupéré avec succès', profile));
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const validatedData = UpdateProfileSchema.parse(req.body);
    const file = req.file;

    const updatedUser = await UserService.updateProfile(userId, validatedData, file);
    res.status(200).json(successResponse('Profil mis à jour avec succès', updatedUser));
  } catch (err) {
    next(err);
  }
};

export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const result = await UserService.deleteAccount(userId);
    res.status(200).json(successResponse('Compte supprimé avec succès', result));
  } catch (err) {
    next(err);
  }
};
