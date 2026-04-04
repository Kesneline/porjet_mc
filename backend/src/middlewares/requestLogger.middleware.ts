/**
 * @file requestLogger.middleware.ts
 * @description Middleware pour logger chaque requête HTTP (method, path, status, duration, user).
 *
 * LOG EXAMPLE:
 * {
 *   "method": "POST",
 *   "path": "/api/auth/login",
 *   "status": 401,
 *   "duration_ms": 125,
 *   "userId": "uuid-123",
 *   "ip": "127.0.0.1",
 *   "requestId": "req-uuid-456"
 * }
 */
import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.config';

declare global {
  namespace Express {
    interface Request {
      id?: string; // Correlation ID (défini par correlationId middleware)
    }
  }
}

/**
 * Log chaque requête HTTP avec timing, status, et user info
 * IMPORTANT: Ajouter APRÈS helmet/cors, AVANT les routes
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Hook sur la fin de la réponse (quand res.end() est appelé)
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    logger.info({
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration_ms: duration,
      userId: (req as any).user?.userId,
      ip: req.ip,
    });
  });

  next();
};
