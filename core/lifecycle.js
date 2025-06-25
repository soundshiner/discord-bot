// core/lifecycle.js (ESM)
import { stop } from './startup.js';
import logger from '../utils/logger.js';
import errorHandler from '../utils/errorHandler.js';
import alertManager from '../utils/alerts.js';

async function handleShutdown(signal) {
  logger.warn(`Signal ${signal} reçu, arrêt demandé...`);
  await stop();
}

function registerProcessHandlers() {
  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);

  process.on('unhandledRejection', (reason) => {
    if (reason?.message?.includes('Shard 0 not found')) {
      logger.warn('Shard non trouvé à la fermeture, c’est probablement normal.');
    } else {
      errorHandler.handleCriticalError(reason, 'UNHANDLED_REJECTION');
      alertManager.createAlert('unhandled_rejection', 'error', `Promesse rejetée non gérée: ${reason.message}`, { context: 'process' });
      logger.error(`Promesse rejetée non gérée : ${reason.message}`);
    }
  });

  process.on('uncaughtException', async error => {
    errorHandler.handleCriticalError(error, 'UNCAUGHT_EXCEPTION');
    alertManager.createAlert('uncaught_exception', 'critical', `Exception non capturée: ${error.message}`, { context: 'process' });
    logger.error(`Exception non capturée : ${error.message}`);
    await stop();
  });
}

export { registerProcessHandlers };
