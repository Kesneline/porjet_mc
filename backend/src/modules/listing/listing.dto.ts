/**
 * @file listing.dto.ts
 * @description Types de données pour les entrées utilisateur relatives aux logements.
 */
import { ListingType } from '@prisma/client';

/**
 * Interface pour la création d'un logement.
 * Les champs optionnels (amenities, etc.) ont des valeurs par défaut en base.
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
  // Les photos seront gérées à part via req.files avant d'être ajoutées à l'input
}

/**
 * Interface pour la mise à jour partielle d'un logement.
 */
export interface UpdateListingInput extends Partial<CreateListingInput> {
  // Optionnellement, on peut vouloir mettre à jour le statut
  status?: 'ACTIVE' | 'RENTED' | 'ARCHIVED';
}
