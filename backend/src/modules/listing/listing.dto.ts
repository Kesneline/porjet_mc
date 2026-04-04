/**
 * @file listing.dto.ts
 * @description Types de données pour les entrées utilisateur relatives aux logements.
 *
 * US1.3 — Ajout de ListingFilters pour les filtres basiques (ville, type, prix)
 * US2.1 — Extension de ListingFilters avec les filtres avancés
 */
import { ListingType } from '@prisma/client';

/**
 * Interface pour la création d'un logement (US1.4).
 * Les photos sont gérées séparément via req.files.
 */
export interface CreateListingInput {
  title: string;
  description: string;
  price: number;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  rooms?: number;
  type: ListingType;
  amenities?: string[];
}

/**
 * Interface pour la mise à jour partielle d'un logement.
 */
export interface UpdateListingInput extends Partial<CreateListingInput> {
  status?: 'ACTIVE' | 'RENTED' | 'ARCHIVED';
}

/**
 * Paramètres de filtrage et pagination pour la liste des annonces.
 * US1.3 — city, type, minPrice, maxPrice
 * US2.1 — rooms, amenities, maxCampusDistance, sortBy
 */
export interface ListingFilters {
  page?: number;
  limit?: number;
  // Filtres basiques (US1.3)
  city?: string;
  type?: ListingType;
  minPrice?: number;
  maxPrice?: number;
  // Filtres avancés (US2.1)
  rooms?: number;
  amenities?: string[];
  maxCampusDistance?: number;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'trust_score' | 'campus_distance';
}
