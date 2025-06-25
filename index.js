// ========================================
// index.js (ESM - Node 20+)
// ========================================

import { Client, GatewayIntentBits, Collection } from 'discord.js';
import config from './core/config.js';
import { loadFiles } from './core/loadFiles.js';
import logger from './utils/logger.js';
import errorHandler from './utils/errorHandler.js';
import metricsCollector from './utils/metrics.js';
import alertManager from './utils/alerts.js';
import centralizedLogger from './utils/centralizedLogger.js';
import updateStatus from './tasks/updateStatus.js';
import WebServer from './api/server.js';

class SoundShineBot {
  constructor() {
    this.client = null;
    this.server = null;
    this.monitoringInterval = null;
    this.updateStatusInterval = null;
  }

  async initialize() {
    try {
      logger.custom('BOOT', 'soundSHINE Bot v1.0', 'magenta');
      logger.custom('ENV', `Environnement : ${config.NODE_ENV}`, 'blue');

      await this.initializeDiscordClient();
      await this.connectBot();
      await loadFiles('tasks', 'task', this.client);

      this.startUpdateStatus();
      this.initializeMonitoring();

      logger.success(`✨ soundSHINE Bot démarré avec le username ${this.client.user.tag}`);
      logger.section('API');

      this.startWebServer();
    } catch (error) {
      errorHandler.handleCriticalError(error, 'BOT_INITIALIZATION');
      logger.error(`Erreur critique lors de l'initialisation : ${error.message}`);
      process.exit(1);
    }
  }

  async initializeDiscordClient() {
    try {
      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
          GatewayIntentBits.GuildVoiceStates
        ]
      });

      this.client.commands = new Collection();
      this.client.config = { PREFIX: config.PREFIX };

      const results = {
        commands: await loadFiles('commands', 'command', this.client),
        events: await loadFiles('events', 'event', this.client),
        utils: await loadFiles('utils', 'util', this.client)
      };

      logger.section('RÉSUMÉ DU CHARGEMENT');

      Object.entries(results).forEach(([type, result]) => {
        if (result && result.total > 0) {
          logger.custom(
            type.toUpperCase(),
            `${result.loaded.length}/${result.total} chargés`,
            result.failed.length === 0 ? 'green' : 'yellow'
          );
        }
      });
    } catch (error) {
      errorHandler.handleCriticalError(error, 'DISCORD_CLIENT_INIT');
      throw error;
    }
  }

  async connectBot() {
    try {
      await this.client.login(config.BOT_TOKEN);
    } catch (error) {
      errorHandler.handleCriticalError(error, 'BOT_LOGIN');
      throw error;
    }
  }

  startUpdateStatus() {
    if (!updateStatus || typeof updateStatus.execute !== 'function') {
      logger.error('updateStatus.execute est introuvable ou n’est pas une fonction, status update skipped');
      return;
    }

    // Premier appel
    (async () => {
      try {
        await updateStatus.execute(this.client);
        logger.info(`📡 Tâche updateStatus lancée toutes les ${updateStatus.interval} ms`);
      } catch (error) {
        logger.error('Erreur dans updateStatus (appel initial) :', error);
        errorHandler.handleTaskError(error, 'UPDATE_STATUS');
      }
    })();

    this.updateStatusInterval = setInterval(() => {
      if (updateStatus && typeof updateStatus.execute === 'function') {
        updateStatus.execute(this.client).catch(error => {
          logger.error('Erreur dans updateStatus :', error);
          errorHandler.handleTaskError(error, 'UPDATE_STATUS');
        });
      } else {
        logger.error('updateStatus.execute est undefined pendant l’intervalle, arrêt du setInterval');
        clearInterval(this.updateStatusInterval);
      }
    }, updateStatus.interval);
  }

  initializeMonitoring() {
    try {
      this.startMetricsCollection();
      this.startAlertMonitoring();

      centralizedLogger.info('Bot soundSHINE démarré', {
        version: '1.0',
        environment: config.NODE_ENV,
        timestamp: new Date().toISOString()
      });

      logger.info('📊 Système de monitoring initialisé');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation du monitoring:', error);
    }
  }

  startMetricsCollection() {
    this.monitoringInterval = setInterval(async () => {
      try {
        metricsCollector.updateDiscordMetrics(this.client);
        metricsCollector.updateSystemMetrics();

        await centralizedLogger.info('Métriques mises à jour', {
          guilds: this.client.guilds.cache.size || 0,
          users: this.client.users.cache.size || 0,
          ping: this.client.ws.ping || 0
        });
      } catch (error) {
        logger.error('Erreur lors de la collecte de métriques:', error);
        alertManager.createAlert('metrics_collection_error', 'error', `Erreur lors de la collecte de métriques: ${error.message}`, { context: 'monitoring' });
      }
    }, 30000);
  }

  startAlertMonitoring() {
    setInterval(async () => {
      try {
        await alertManager.checkMetrics(this.client);
        alertManager.checkErrorRate();
        alertManager.cleanupOldAlerts();
      } catch (error) {
        logger.error('Erreur lors de la surveillance des alertes:', error);
      }
    }, 60000);
  }

  startWebServer() {
    try {
      this.server = new WebServer(this.client, logger);
      this.server.start(config.API_PORT);
      logger.info('📊 Métriques disponibles sur /v1/metrics');
      logger.info('🏥 Health check sur /v1/health');
      logger.info('📝 Logs centralisés disponibles sur /v1/logs');
      logger.info('🚨 Alertes disponibles sur /v1/alerts');
      logger.section('Start logging now...');
    } catch (error) {
      errorHandler.handleCriticalError(error, 'WEB_SERVER_START');
      throw error;
    }
  }

  async shutdown() {
    logger.info('Arrêt du bot en cours...');

    try {
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        logger.info('Monitoring arrêté');
      }

      if (this.updateStatusInterval) {
        clearInterval(this.updateStatusInterval);
        logger.info('updateStatus arrêté');
      }

      await centralizedLogger.info('Bot soundSHINE arrêté', {
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });

      if (this.client) {
        await this.client.destroy();
        logger.info('Client Discord déconnecté');
      }

      if (this.server) {
        await this.server.stop();
      }

      logger.success('soundSHINE Bot arrêté proprement');
      process.exit(0);
    } catch (error) {
      errorHandler.handleCriticalError(error, 'BOT_SHUTDOWN');
      logger.error('Erreur lors de l\'arrêt du bot:', error);
      process.exit(1);
    }
  }
}

const bot = new SoundShineBot();

async function handleShutdown(signal) {
  logger.warn(`Signal ${signal} reçu, arrêt demandé...`);
  await bot.shutdown();
}

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

// Rejet de promesse non gérée
process.on('unhandledRejection', async (reason) => {
  const isShardError = reason?.message?.includes('Shard 0 not found');
  if (isShardError) {
    logger.warn('⚠️ Shard non trouvé à la fermeture, c’est probablement normal.');
  } else {
    errorHandler.handleCriticalError(reason, 'UNHANDLED_REJECTION');
    alertManager.createAlert('unhandled_rejection', 'error', `Promesse rejetée non gérée: ${reason.message}`, { context: 'process' });
    logger.error(`Promesse rejetée non gérée : ${reason.message}`);
  }

  await bot.shutdown();
});

// Exception non capturée
process.on('uncaughtException', async error => {
  errorHandler.handleCriticalError(error, 'UNCAUGHT_EXCEPTION');
  alertManager.createAlert('uncaught_exception', 'critical', `Exception non capturée: ${error.message}`, { context: 'process' });
  logger.error(`Exception non capturée : ${error.message}`);
  await bot.shutdown();
});

// Let's roll
bot.initialize();
