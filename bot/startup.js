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
import stageMonitor from '../core/services/StageMonitor.js';

let client = null;
let updateStatusInterval = null;

export async function startBot () {
  try {
    // Initialiser le client Discord
    client = createClient();

    // Charger les commandes et événements
    await loadCommands(client);
    await loadEvents(client);

    // Connecter le bot
    await connectBot();

    // Démarrer les tâches
    startUpdateStatus();

    // 🎭 Démarrer la surveillance des stages
    stageMonitor.startMonitoring();

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
  try {
    if (updateStatusInterval) {
      clearInterval(updateStatusInterval);
    }

    // 🎭 Arrêter la surveillance des stages
    stageMonitor.stopMonitoring();

    if (client) {
      await client.destroy();
    }

    logger.success('soundSHINE Bot arrêté proprement');
  } catch (error) {
    errorHandler.handleCriticalError(error, 'BOT_SHUTDOWN');
    logger.error('Erreur lors de l\'arrêt du bot:', error);
    throw error;
  }
}

