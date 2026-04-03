/**
 * @file upload.middleware.ts
 * @description Middleware Multer pour intercepter les fichiers images dans les requêtes multipart.
 *
 * Ce middleware configure le stockage temporaire en mémoire (MemoryStorage)
 * avant que les fichiers ne soient envoyés vers Cloudinary par le service.
 *
 * Limites de sécurité :
 * - Poids max : 5 Mo par image
 * - Formats autorisés : JPEG, JPG, PNG, WEBP
 */
import multer from 'multer';
import { AppError } from './error.middleware';

// On utilise memoryStorage pour ne pas encombrer le disque du serveur
// Les fichiers seront disponibles dans req.file (pour un seul) ou req.files (pour plusieurs)
const storage = multer.memoryStorage();

/**
 * Filtre de validation du format de fichier.
 * Rejette tout ce qui n'est pas une image standard.
 */
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError("Seuls les fichiers de type image (JPEG, PNG, WebP) sont autorisés.", 400), false);
  }
};

/**
 * Instance Multer configurée.
 * .array('photos', 10) → Autorise jusqu'à 10 photos par logement.
 */
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 Mo maximum par fichier
  },
  fileFilter: fileFilter,
});
