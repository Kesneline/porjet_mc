/**
 * @file matching.controller.ts
 * @description Handler HTTP pour le matching IA personnalisé (US4.1).
 *
 * POST /api/matching
 *   Body : { budget, campusName, campusLat, campusLng, maxDistance?, preferredType?,
 *            requiredAmenities?, roommates?, additionalNotes?, limit? }
 *   Réponse : annonces classées par score de compatibilité IA
 */
import { Request, Response, NextFunction } from 'express';
import { MatchingService } from './matching.service';
import { MatchingProfileSchema } from './matching.validator';
import { successResponse } from '../../utils/response.formatter';
import { AppError } from '../../middlewares/error.middleware';

export const match = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = MatchingProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(' | '),
        400
      );
    }

    const result = await MatchingService.matchListings(parsed.data);

    res.status(200).json(
      successResponse('Matching IA terminé', result)
    );
  } catch (err) {
    next(err);
  }
};
