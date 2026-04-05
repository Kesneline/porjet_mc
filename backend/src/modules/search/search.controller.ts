/**
 * @file search.controller.ts
 * @description Handler pour la recherche full-text Algolia (US2.4).
 *
 * US2.4 — En tant qu'étudiant, je veux utiliser la recherche full-text Algolia
 *          pour trouver rapidement une annonce.
 *
 * GET /api/search?q=chambre+Bastos&city=Yaoundé&minPrice=20000&maxPrice=60000
 *                &type=CHAMBRE&amenities=Wifi,Eau&lat=3.848&lng=11.502&radius=5000
 *                &page=1&hitsPerPage=20
 */
import { Request, Response, NextFunction } from 'express';
import { listingsIndex } from '../../config/algolia.config';
import { successResponse } from '../../utils/response.formatter';
import { AppError } from '../../middlewares/error.middleware';

export const search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!listingsIndex) {
      throw new AppError(
        'La recherche Algolia n\'est pas configurée. Vérifiez les variables ALGOLIA_APP_ID et ALGOLIA_WRITE_API_KEY dans le .env.',
        503
      );
    }

    const {
      q = '',
      city,
      type,
      minPrice,
      maxPrice,
      amenities,
      lat,
      lng,
      radius = '5000',
      page = '1',
      hitsPerPage = '20',
    } = req.query as Record<string, string>;

    // Construction des filtres Algolia (syntaxe Algolia filter string)
    const filterParts: string[] = [];

    filterParts.push('status:ACTIVE');

    if (city) {
      filterParts.push(`city:"${city}"`);
    }
    if (type) {
      filterParts.push(`type:"${type}"`);
    }
    if (minPrice || maxPrice) {
      const min = minPrice ? parseFloat(minPrice) : 0;
      const max = maxPrice ? parseFloat(maxPrice) : 99999999;
      filterParts.push(`price:${min} TO ${max}`);
    }
    if (amenities) {
      const list = amenities.split(',').map((a) => a.trim()).filter(Boolean);
      list.forEach((a) => filterParts.push(`amenities:"${a}"`));
    }

    const filtersString = filterParts.join(' AND ');

    // Options de recherche Algolia
    const searchOptions: Record<string, any> = {
      filters: filtersString,
      hitsPerPage: Math.min(parseInt(hitsPerPage, 10) || 20, 100),
      page: Math.max((parseInt(page, 10) || 1) - 1, 0), // Algolia est 0-indexé
    };

    // Recherche géographique si lat/lng fournis (US2.1 — distance campus)
    if (lat && lng) {
      searchOptions.aroundLatLng = `${parseFloat(lat)},${parseFloat(lng)}`;
      searchOptions.aroundRadius = parseInt(radius, 10) || 5000;
    }

    const result = await listingsIndex.search(q, searchOptions);

    res.status(200).json(
      successResponse('Résultats de recherche Algolia', {
        hits: result.hits,
        pagination: {
          page: (result.page ?? 0) + 1, // Retour en 1-indexé
          hitsPerPage: result.hitsPerPage,
          nbHits: result.nbHits,
          nbPages: result.nbPages,
        },
        query: q,
        processingTimeMS: result.processingTimeMS,
      })
    );
  } catch (err) {
    next(err);
  }
};
