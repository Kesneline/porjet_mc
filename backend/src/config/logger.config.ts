/**
 * @file logger.config.ts
 * @description Configuration du logger Pino pour structured logging.
 *
 * Pino produit des logs en JSON structuré, parfaitpour:
 * - Parsing automatique par ELK, DataDog, Splunk, etc.
 * - Recherche par fields (userId, method, statusCode, etc.)
 * - Agrégation et alertes sur patterns
 *
 * En développement: Pretty-printed (lisible)
 * En production: JSON (machine-readable)
 */
import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Logger Pino singleton - utilisé partout dans l'app
 * Exemple: logger.info({ userId: '123', action: 'login' })
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'warn'),
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      }
    : undefined,
});

// Types helpers pour logging type-safe
export interface RequestLog {
  method: string;
  path: string;
  status?: number;
  duration_ms?: number;
  userId?: string;
  ip?: string;
  error?: string;
}

export interface BusinessLog {
  action: string; // 'USER_REGISTERED', 'LISTING_CREATED', 'LOGIN_FAILED', etc.
  userId?: string;
  email?: string;
  listingId?: string;
  details?: Record<string, any>;
}
