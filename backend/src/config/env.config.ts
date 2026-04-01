/**
 * @file env.config.ts
 * @description Chargement et validation des variables d'environnement.
 *
 * Ce fichier est le point d'entrée de toute la configuration dynamique.
 * Il utilise Zod pour valider TOUTES les variables critiques au démarrage.
 * Si une variable est manquante ou invalide, le serveur refuse de démarrer
 * et affiche un message d'erreur clair → plus de bugs silencieux en production.
 *
 * AVANTAGE : Tous les modules importent 'config' depuis ici, jamais process.env directement.
 * Cela garantit un typage strict et une configuration centralisée.
 */
import dotenv from 'dotenv';
import { z } from 'zod';

// Charge les variables depuis le fichier .env à la racine du projet
dotenv.config();

/**
 * Schéma de validation Zod pour toutes les variables d'environnement.
 * Ajout de nouvelles variables ici au fur et à mesure des étapes.
 */
const EnvSchema = z.object({
  // Serveur
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Base de données Supabase (Obligatoires en production)
  DATABASE_URL: z.string({ required_error: 'DATABASE_URL est manquante dans le fichier .env !' }),
  DIRECT_URL: z.string({ required_error: 'DIRECT_URL est manquante dans le fichier .env !' }),

  // JWT (Optionnels : un fallback est utilisé en développement si absent)
  JWT_PRIVATE_KEY: z.string().optional(),
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),

  // Cloudinary (Obligatoires pour l'étape 4)
  CLOUD_NAME: z.string({ required_error: 'CLOUD_NAME est manquante dans le .env' }),
  API_KEY: z.string({ required_error: 'API_KEY Cloudinary est manquante dans le .env' }),
  API_SECRET: z.string({ required_error: 'API_SECRET Cloudinary est manquante dans le .env' }),
});

// Validation au démarrage : si une variable obligatoire est absente, on crash proprement
const parsedEnv = EnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Configuration invalide des variables d\'environnement :');
  console.error(parsedEnv.error.flatten().fieldErrors);
  // On arrête le processus proprement pour signaler l'erreur de config
  process.exit(1);
}

const env = parsedEnv.data;

/** Objet de configuration typé et validé, exporté pour toute l'application. */
export const config = {
  /** Port d'écoute du serveur Express. Défaut : 3000 */
  port: parseInt(env.PORT, 10),

  /** Environnement d'exécution : 'development', 'production' ou 'test'. */
  nodeEnv: env.NODE_ENV,

  /** Durée de validité des Access Tokens JWT. Défaut : 15 minutes. */
  jwtAccessExpires: env.JWT_ACCESS_EXPIRES,

  /** Configuration Cloudinary */
  cloudinary: {
    cloudName: env.CLOUD_NAME,
    apiKey: env.API_KEY,
    apiSecret: env.API_SECRET,
  }
};
