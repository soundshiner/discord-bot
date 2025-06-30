// ========================================
// core/startup.js (ESM)
// ========================================

import { Client, GatewayIntentBits, Collection } from 'discord.js';
import config from './config.js';
import loadFiles from './loadFiles.js';
import logger from '../utils/logger.js';
import errorHandler from '../utils/errorHandler.js';
// import metricsCollector from "../utils/metrics.js";
// import alertManager from "../utils/alerts.js";
// import centralizedLogger from "../utils/centralizedLogger.js";
import updateStatus from '../tasks/updateStatus.js';
import WebServer from '../api/server.js';

let client = null;
let serverInstance = null;
const monitoringInterval = null;
let updateStatusInterval = null;

export async function start () {
  try {
    logger.custom('BOOT', 'soundSHINE Bot v1.0', 'magenta');
    logger.custom('ENV', `Environnement : ${config.NODE_ENV}`, 'blue');

    await initializeDiscordClient();
    await connectBot();

    await loadSection('tasks', 'task');
    startUpdateStatus();

    logger.section('API');
    startWebServer();

    logger.section('Finale');
    logger.info(
      `📡 Tâche updateStatus lancée toutes les ${updateStatus.interval} ms`
    );
    logger.info('📊 Système de monitoring initialisé');
    logger.info('📝 Système de logging centralisé initialisé');

    // Juste avant la dernière ligne
    logger.sectionStart('Start logging now...');
    logger.success(
      `✨ soundSHINE Bot démarré avec le username ${client.user.tag}`
    );
  } catch (error) {
    errorHandler.handleCriticalError(error, 'BOT_STARTUP');
    logger.error(`Erreur critique lors du démarrage : ${error.message}`);
    process.exit(1);
  }
}

async function initializeDiscordClient () {
  try {
    client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
      ]
    });

    client.commands = new Collection();
    client.config = { PREFIX: config.PREFIX };

    await loadSection('commands', 'command');
    await loadSection('events', 'event');
    await loadSection('utils', 'util');

    logger.section('RÉSUMÉ DU CHARGEMENT');
    summarizeLoad([
      { type: 'commands', folder: 'commands' },
      { type: 'events', folder: 'events' },
      { type: 'utils', folder: 'utils' }
    ]);
  } catch (error) {
    errorHandler.handleCriticalError(error, 'DISCORD_CLIENT_INIT');
    throw error;
  }
}

async function connectBot () {
  try {
    await client.login(config.BOT_TOKEN);
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

  (async () => {
    try {
      await updateStatus.execute(client);
    } catch (error) {
      logger.error('Erreur dans updateStatus (appel initial) :', error);
      errorHandler.handleTaskError(error, 'UPDATE_STATUS');
    }
  })();

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

function startWebServer () {
  try {
    serverInstance = new WebServer(client, logger);
    serverInstance.start(config.API_PORT);

    logger.info('📊 Métriques disponibles sur /v1/metrics');
    logger.info('🏥 Health check sur /v1/health');
    logger.info('📝 Logs centralisés disponibles sur /v1/logs');
    logger.info('🚨 Alertes disponibles sur /v1/alerts');
  } catch (error) {
    errorHandler.handleCriticalError(error, 'WEB_SERVER_START');
    throw error;
  }
}

function summarizeLoad (results) {
  results.forEach(({ type, folder }) => {
    logger.custom(
      type.toUpperCase(),
      `${client?.[type]?.size || 'n/a'} chargés depuis ${folder}`,
      'green'
    );
  });
}

async function loadSection (folder, type) {
  const result = await loadFiles(folder, type, client);
  if (result?.total > 0) {
    logger.custom(
      'RÉSUMÉ',
      `${type} - Chargés: ${result.loaded.length}, Échecs: ${result.failed.length}`
    );
  }
}

export async function stop () {
  logger.info('Arrêt du bot en cours...');

  try {
    if (monitoringInterval) clearInterval(monitoringInterval);
    if (updateStatusInterval) clearInterval(updateStatusInterval);

    if (client) {
      await client.destroy();
      logger.info('Client Discord déconnecté');
    }

    if (serverInstance) {
      await serverInstance.stop();
      logger.success('Serveur Express arrêté.');
    }

    logger.success('soundSHINE Bot arrêté proprement');
    process.exit(0);
  } catch (error) {
    errorHandler.handleCriticalError(error, 'BOT_SHUTDOWN');
    logger.error('Erreur lors de l\'arrêt du bot:', error);
    process.exit(1);
  }
}

