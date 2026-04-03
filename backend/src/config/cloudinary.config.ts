/**
 * @file cloudinary.config.ts
 * @description Configuration du SDK Cloudinary pour l'upload d'images.
 *
 * Cloudinary est utilisé pour stocker les photos des logements.
 * On utilise les identifiants validés depuis env.config.ts.
 */
import { v2 as cloudinary } from 'cloudinary';
import { config } from './env.config';

// Configuration du SDK
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: true, // Utilise HTTPS pour toutes les URLs générées
});

export default cloudinary;
