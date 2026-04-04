/**
 * @file rateLimit.middleware.ts
 * @description Rate limiting middleware pour prévenir les attaques brute-force et les DoS.
 *
 * Utilise express-rate-limit pour limiter le nombre de requêtes par endpoint :
 * - POST /api/auth/register → 3 requêtes par heure par IP
 * - POST /api/auth/login    → 5 requêtes par 15 minutes par IP
 * - GET /api/listings       → 60 requêtes par minute par IP
 * - POST /api/listings      → 10 requêtes par heure par IP (authentifiés)
 *
 * Les limites sont stockées en mémoire pour le MVP.
 * Pour la scalabilité, on pourrait utiliser Redis à l'avenir.
 */
import rateLimit from 'express-rate-limit';
import { errorResponse } from '../utils/response.formatter';

/**
 * Limiteur global pour routes sensibles (authentification).
 * 5 tentatives par 15 minutes = bon équilibre entre sécurité et UX.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requêtes max
  message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
  statusCode: 429,
  skip: (req) => req.method !== 'POST',
  handler: (req, res) => {
    res.status(429).json(
      errorResponse('Trop de tentatives de connexion. Veuillez réessayer plus tard.', [])
    );
    res.setHeader('Retry-After', '900'); // 15 min en secondes
  },
  // Identifier les clients par IP réelle (important sur Railway avec trusted proxy)
  keyGenerator: (req) => req.ip || 'unknown',
});

/**
 * Limiteur pour l'enregistrement.
 * 3 tentatives par heure = régulation des créations de compte massives.
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  max: 3,
  message: 'Trop de tentatives d\'enregistrement. Veuillez réessayer dans une heure.',
  statusCode: 429,
  skip: (req) => req.method !== 'POST',
  handler: (req, res) => {
    res.status(429).json(
      errorResponse('Trop de tentatives d\'enregistrement. Veuillez réessayer plus tard.'),
    );
    res.setHeader('Retry-After', '3600'); // 60 min en secondes
  },
  keyGenerator: (req) => req.ip || 'unknown',
});

/**
 * Limiteur pour la lecture de listings (endpoint public très utilisé).
 * 60 requêtes par minute = ~1 par seconde = juste pour les clients normaux.
 */
export const listingsReadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: 'Trop de requêtes. Veuillez ralentir.',
  statusCode: 429,
  skip: (req) => req.method !== 'GET',
  handler: (req, res) => {
    res.status(429).json(errorResponse('Trop de requêtes. Veuillez réessayer dans quelques secondes.'));
    res.setHeader('Retry-After', '60');
  },
  keyGenerator: (req) => req.ip || 'unknown',
});

/**
 * Limiteur pour la création de listings (action protégée, moins restrictive).
 * 10 requêtes par heure par utilisateur authentifié = ~1 listing par 6 minutes max.
 */
export const listingsWriteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  max: 10,
  message: 'Vous avez créé trop de listings. Veuillez réessayer dans une heure.',
  statusCode: 429,
  skip: (req) => req.method !== 'POST',
  handler: (req, res) => {
    res.status(429).json(
      errorResponse('Trop de créations de listings. Veuillez réessayer plus tard.'),
    );
    res.setHeader('Retry-After', '3600');
  },
  // Pour les utilisateurs authentifiés, limiter par userId plutôt que par IP
  // Sinon, limiter par IP
  keyGenerator: (req) => req.user?.userId || req.ip || 'unknown',
});

/**
 * Limiteur global pour toute l'API /api/*.
 * Sert de filet de sécurité général (moins restrictif que les limiteurs spécifiques).
 * 100 requêtes par minute par IP = ~1.67 par seconde.
 */
export const globalApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'Trop de requêtes. Veuillez ralentir.',
  statusCode: 429,
  handler: (req, res) => {
    res.status(429).json(
      errorResponse('Trop de requêtes. Veuillez réessayer dans quelques secondes.'),
    );
    res.setHeader('Retry-After', '60');
  },
  keyGenerator: (req) => req.ip || 'unknown',
});
