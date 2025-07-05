// ========================================
// bot/startup.js (ESM)
// ========================================

import { createClient } from './client.js';
import config from './config.js';
import { loadCommands } from './handlers/loadCommands.js';
import { loadEvents } from './handlers/loadEvents.js';
import logger from './logger.js';
import errorHandler from '../core/monitor.js';
import updateStatus from '../bot/tasks/updateStatus.js';

let client = null;
let updateStatusInterval = null;

export async function startBot () {
  try {
    logger.custom('BOOT', 'soundSHINE Bot v1.0', 'magenta');
    logger.custom('ENV', `Environnement : ${config.NODE_ENV}`, 'blue');

    // Initialiser le client Discord
    client = createClient();

    // Charger les commandes et événements
    await loadCommands(client);
    await loadEvents(client);

    // Connecter le bot
    await connectBot();

    // Démarrer les tâches
    startUpdateStatus();

    logger.section('Finale');
    logger.info(
      `📡 Tâche updateStatus lancée toutes les ${updateStatus.interval} ms`
    );
    logger.success(
      `✨ soundSHINE Bot démarré avec le username ${client.user.tag}`
    );
    logger.section('Start logging now...');

    return client;
  } catch (error) {
    errorHandler.handleCriticalError(error, 'BOT_STARTUP');
    logger.error(`Erreur critique lors du démarrage : ${error.message}`);
    throw error;
  }
}

async function connectBot () {
  try {
    await client.login(config.DISCORD_TOKEN);
    logger.success('Bot Discord connecté avec succès');
  } catch (error) {
    errorHandler.handleCriticalError(error, 'BOT_LOGIN');
    throw error;
  }
}

function startUpdateStatus () {
  if (!updateStatus || typeof updateStatus.execute !== 'function') {
    logger.error(
      'updateStatus.execute est introuvable ou n\'est pas une fonction, status update skipped'
    );
    return;
  }

  // Exécution initiale
  (async () => {
    try {
      await updateStatus.execute(client);
    } catch (error) {
      logger.error('Erreur dans updateStatus (appel initial) :', error);
      errorHandler.handleTaskError(error, 'UPDATE_STATUS');
    }
  })();

  // Configuration de l'intervalle
  updateStatusInterval = setInterval(() => {
    if (typeof updateStatus.execute === 'function') {
      updateStatus.execute(client).catch((error) => {
        logger.error('Erreur dans updateStatus :', error);
        errorHandler.handleTaskError(error, 'UPDATE_STATUS');
      });
    } else {
      logger.error(
        'updateStatus.execute est undefined pendant l\'intervalle, arrêt du setInterval'
      );
      clearInterval(updateStatusInterval);
    }
  }, updateStatus.interval);
}

export async function stopBot () {
  logger.info('Arrêt du bot en cours...');

  try {
    if (updateStatusInterval) {
      clearInterval(updateStatusInterval);
      logger.info('Tâche updateStatus arrêtée');
    }

    if (client) {
      await client.destroy();
      logger.success('Client Discord déconnecté');
    }

    logger.success('soundSHINE Bot arrêté proprement');
  } catch (error) {
    errorHandler.handleCriticalError(error, 'BOT_SHUTDOWN');
    logger.error('Erreur lors de l\'arrêt du bot:', error);
    throw error;
  }
}
