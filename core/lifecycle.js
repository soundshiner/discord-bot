// core/lifecycle.js
import { stop } from './startup.js';
import logger from '../utils/logger.js';

export function registerProcessHandlers() {
  process.on('SIGINT', async () => {
    logger.info('SIGINT reçu, arrêt du bot...');
    await gracefulShutdown();
  });

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM reçu, arrêt du bot...');
    await gracefulShutdown();
  });

  process.on('uncaughtException', async (error) => {
    logger.error(`Exception non capturée: ${error.message}`);
    logger.error(error.stack);
    await gracefulShutdown(1);
  });

  process.on('unhandledRejection', async (reason) => {
    logger.error(`Rejet non géré: ${reason}`);
    await gracefulShutdown(1);
  });
}

async function gracefulShutdown(exitCode = 0) {
  try {
    await stop();
    logger.success('Arrêt gracieux terminé.');
    process.exit(exitCode);
  } catch (error) {
    logger.error(`Erreur lors de l'arrêt gracieux: ${error.message}`);
    process.exit(1);
  }
}
