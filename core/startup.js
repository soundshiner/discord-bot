// core/startup.js
import client from './bot.js';
import WebServer from '../api/server.js';
import logger from '../utils/logger.js';

const port = Number(process.env.API_PORT) || 3894;

let serverInstance = null;

export async function start() {
  try {
    // Connexion du bot Discord
    await client.login(process.env.DISCORD_TOKEN);

    // Démarrage serveur Express API
    const webServer = new WebServer(client, logger);
    serverInstance = webServer.start(port);

    logger.info(`🚀 Serveur Express démarré sur le port ${port}`);

    // TODO: lancer ici tâches planifiées, loader commandes, etc.

  } catch (error) {
    logger.error(`Erreur au démarrage : ${error.message}`);
    process.exit(1);
  }
}

export async function stop() {
  if (serverInstance) {
    await serverInstance.close();
    logger.success('Serveur Express arrêté.');
  }
  await client.destroy();
  logger.success('Bot Discord déconnecté.');
}
