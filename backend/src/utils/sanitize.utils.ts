/**
 * @file sanitize.utils.ts
 * @description Utilitaires de sanitization pour prévenir les attaques XSS.
 *
 * Utilise la bibliothèque `xss` pour échapper les caractères HTML dangereux
 * dans les strings user-input (names, descriptions, titles, etc).
 *
 * IMPORTANT : Ne sanitizer que les champs de texte libre (description, comments).
 * Ne PAS sanitizer les IDs, emails, URLs structurées (Zod les valide déjà).
 *
 * Exemple :
 *   const malicious = '<script>alert("xss")</script>'
 *   const safe = sanitizeString(malicious)
 *   // Result: "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
 */
import xss from 'xss';

/**
 * Sanitize une string en supprimant les balises HTML dangereuses.
 * Utilise une whitelist vide = supprime TOUS les tags HTML.
 *
 * @param input - String potentiellement malveillante
 * @returns String sûre avec caractères HTML échappés
 */
export const sanitizeString = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return xss(input, {
    whiteList: {}, // Aucun tag HTML autorisé
    stripIgnoreTag: true, // Supprimer les tags non reconnus
  }).trim();
};

/**
 * Sanitize une description longue avec support de sauts de ligne.
 * Permet les sauts de ligne (\n) mais pas les balises HTML.
 *
 * @param input - Texte long potentiellement malveillant
 * @returns Texte sûr avec sauts de ligne préservés
 */
export const sanitizeDescription = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return xss(input, {
    whiteList: {}, // Pas de HTML
    stripIgnoreTag: true,
    onIgnoreTag: (tag, html, options) => {
      // Détecte les sauts de ligne (représentés comme \n ou <br>)
      if (tag === 'br') {
        return '\n';
      }
      return '';
    },
  }).trim();
};

/**
 * Sanitize et normalise une string (trim + sanitize).
 * Utile pour les champs comme name, email, city, etc.
 *
 * @param input - String à normaliser
 * @returns String nettoyée, trimée et sans HTML
 */
export const sanitizeAndTrim = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  return sanitizeString(input).trim();
};
