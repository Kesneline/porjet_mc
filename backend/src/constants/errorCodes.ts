/**
 * @file errorCodes.ts
 * @description Codes d'erreur standardisés pour toute l'application.
 *
 * Permet aux clients de:
 * - Identifier l'erreur par CODE (pas seulement message)
 * - Afficher un message i18n (internationalisé) basé sur le code
 * - Afficher une action recommandée
 *
 * Exemple client:
 * if (response.code === 'ERR_EMAIL_TAKEN') {
 *   showError("Cet email est déjà utilisé. Essayez de vous connecter.")
 * }
 */

export const ERROR_CODES = {
  // Auth errors
  AUTH_EMAIL_TAKEN: 'ERR_EMAIL_TAKEN',
  AUTH_INVALID_CREDENTIALS: 'ERR_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'ERR_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'ERR_TOKEN_INVALID',
  AUTH_UNAUTHORIZED: 'ERR_UNAUTHORIZED',
  AUTH_FORBIDDEN: 'ERR_FORBIDDEN',

  // Listing errors
  LISTING_NOT_FOUND: 'ERR_LISTING_NOT_FOUND',
  LISTING_UNAUTHORIZED: 'ERR_LISTING_UNAUTHORIZED',
  LISTING_INVALID_DATA: 'ERR_LISTING_INVALID_DATA',

  // File upload errors
  FILE_INVALID_TYPE: 'ERR_FILE_INVALID_TYPE',
  FILE_TOO_LARGE: 'ERR_FILE_TOO_LARGE',
  FILE_UPLOAD_FAILED: 'ERR_FILE_UPLOAD_FAILED',

  // Rate limiting
  RATE_LIMITED: 'ERR_RATE_LIMITED',

  // Validation errors
  VALIDATION_ERROR: 'ERR_VALIDATION_ERROR',

  // User errors
  USER_NOT_FOUND: 'ERR_USER_NOT_FOUND',
  USER_INACTIVE: 'ERR_USER_INACTIVE',
  USER_BANNED: 'ERR_USER_BANNED',

  // Server errors
  INTERNAL_SERVER_ERROR: 'ERR_INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'ERR_DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'ERR_EXTERNAL_API_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * Messages amicaux pour chaque code d'erreur
 * À utiliser pour les réponses API
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.AUTH_EMAIL_TAKEN]: 'Cet email est déjà utilisé. Connectez-vous ou utilisez un autre email.',
  [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: 'Email ou mot de passe incorrect.',
  [ERROR_CODES.AUTH_TOKEN_EXPIRED]: 'Votre session a expiré. Veuillez vous reconnecter.',
  [ERROR_CODES.AUTH_TOKEN_INVALID]: 'Token invalide ou expiré.',
  [ERROR_CODES.AUTH_UNAUTHORIZED]: 'Authentification requise.',
  [ERROR_CODES.AUTH_FORBIDDEN]: 'Vous n\'avez pas accès à cette ressource.',

  [ERROR_CODES.LISTING_NOT_FOUND]: 'Annonce non trouvée.',
  [ERROR_CODES.LISTING_UNAUTHORIZED]: 'Vous n\'êtes pas autorisé à modifier cette annonce.',
  [ERROR_CODES.LISTING_INVALID_DATA]: 'Données d\'annonce invalides.',

  [ERROR_CODES.FILE_INVALID_TYPE]: 'Type de fichier non autorisé. Les images seulement (JPEG, PNG, WebP).',
  [ERROR_CODES.FILE_TOO_LARGE]: 'Fichier trop volumineux (max 5 MB).',
  [ERROR_CODES.FILE_UPLOAD_FAILED]: 'Erreur lors du chargement du fichier.',

  [ERROR_CODES.RATE_LIMITED]: 'Trop de requêtes. Veuillez réessayer dans quelques instants.',

  [ERROR_CODES.VALIDATION_ERROR]: 'Données invalides. Vérifiez vos entrées.',

  [ERROR_CODES.USER_NOT_FOUND]: 'Utilisateur non trouvé.',
  [ERROR_CODES.USER_INACTIVE]: 'Votre compte n\'est pas encore activé.',
  [ERROR_CODES.USER_BANNED]: 'Votre compte a été suspendu.',

  [ERROR_CODES.INTERNAL_SERVER_ERROR]: 'Erreur serveur. Réessayez plus tard.',
  [ERROR_CODES.DATABASE_ERROR]: 'Erreur base de données. Réessayez plus tard.',
  [ERROR_CODES.EXTERNAL_API_ERROR]: 'Service externe indisponible. Réessayez plus tard.',
} as const;
