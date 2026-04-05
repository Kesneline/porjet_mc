/**
 * @file algolia.config.ts
 * @description Configuration du client Algolia Search pour la recherche full-text (US2.4).
 *
 * Dégradation gracieuse : si ALGOLIA_APP_ID ou ALGOLIA_WRITE_API_KEY sont absents
 * du .env, le module retourne null et la recherche Algolia est désactivée.
 * Le serveur continue de fonctionner sans planter.
 */
import algoliasearch, { SearchIndex } from 'algoliasearch';

let listingsIndex: SearchIndex | null = null;

if (process.env.ALGOLIA_APP_ID && process.env.ALGOLIA_WRITE_API_KEY) {
  const client = algoliasearch(
    process.env.ALGOLIA_APP_ID,
    process.env.ALGOLIA_WRITE_API_KEY
  );
  listingsIndex = client.initIndex('listings');

  // Configuration de l'index : attributs de recherche et de filtrage
  listingsIndex.setSettings({
    searchableAttributes: ['title', 'description', 'city', 'address', 'amenities'],
    attributesForFaceting: [
      'filterOnly(type)',
      'filterOnly(city)',
      'filterOnly(amenities)',
      'numericMenu(price)',
      'numericMenu(campusDist)',
      'filterOnly(status)',
    ],
    customRanking: ['desc(trustScore)', 'desc(isBoosted)', 'desc(createdAt)'],
  }).catch((err: Error) => {
    console.warn('[Algolia] Impossible de configurer les settings:', err.message);
  });
}

export { listingsIndex };
