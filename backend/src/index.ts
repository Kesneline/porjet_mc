/**
 * @file index.ts
 * @description Point d'entrée principal du serveur Node.js.
 *
 * Ce fichier a une responsabilité unique et minimale : démarrer le serveur
 * HTTP en appelant app.listen() sur le port configuré.
 *
 * Il importe 'app' depuis app.ts (qui contient toute la configuration Express)
 * et 'config' depuis env.config.ts (qui lit le port depuis .env).
 *
 * Pattern de démarrage sécurisé :
 * - Si app.listen() échoue (port déjà utilisé, permissions, etc.),
 *   l'erreur est capturée et process.exit(1) est appelé pour stopper
 *   proprement le processus et alerter le gestionnaire de processus (PM2, Docker).
 */
import './config/env.config'; // Doit être importé en premier pour charger .env
import app from './app';
import { config } from './config/env.config';

/**
 * Démarre le serveur Express et écoute sur le port configuré.
 * En cas d'erreur critique au démarrage, le processus s'arrête avec un code d'erreur (1).
 */
const startServer = () => {
  try {
    app.listen(config.port, () => {
      console.log(`✅ [${config.nodeEnv}] Serveur Stud'Housing Trust démarré sur le port ${config.port}`);
      console.log(`📋 Architecture : MVC 3-Tiers | ORM : Prisma | DB : PostgreSQL (Supabase)`);
      console.log(`🌐 Healthcheck : http://localhost:${config.port}/api/health`);
    });
  } catch (error) {
    console.error('❌ Erreur critique au démarrage du serveur:', error);
    // Code de sortie 1 signale une erreur au système d'exploitation
    process.exit(1);
  }
};

startServer();
