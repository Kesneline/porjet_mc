import app from './app';
import { config } from './config/env.config';

const startServer = () => {
  try {
    app.listen(config.port, () => {
      console.log(`✅ [${config.nodeEnv}] Serveur démarré (API REST) sur le port ${config.port}`);
      console.log(`📁 Structure 3-Tiers & Modèle MVC en place.`);
    });
  } catch (error) {
    console.error('❌ Erreur critique au démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();
