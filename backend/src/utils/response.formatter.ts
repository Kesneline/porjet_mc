/**
 * @file response.formatter.ts
 * @description Couche "Vue" du modèle MVC pour les réponses JSON de l'API.
 *
 * Toutes les réponses de l'API doivent passer par ces deux fonctions.
 * Cela garantit un format de réponse standardisé et prévisible pour le client
 * (application mobile), quelle que soit la route appelée.
 *
 * Format de succès : { success: true, message: string, data?: any }
 * Format d'erreur  : { success: false, message: string, errors?: any }
 */

/**
 * Formate une réponse de succès.
 * @param message - Message lisible par l'humain décrivant le résultat.
 * @param data - La donnée utile à retourner au client (optionnel).
 * @returns Un objet JSON standardisé pour les réponses réussies.
 */
export const successResponse = (message: string, data?: any) => {
  return { success: true, message, data };
};

/**
 * Formate une réponse d'erreur.
 * @param message - Message d'erreur principal lisible par l'humain.
 * @param errors - Détails supplémentaires sur l'erreur, ex: erreurs de validation (optionnel).
 * @returns Un objet JSON standardisé pour les réponses en erreur.
 */
export const errorResponse = (message: string, errors?: any) => {
  return { success: false, message, errors };
};
