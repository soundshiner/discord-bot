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
  }

  async initialize() {
    try {
      logger.custom('BOOT', 'soundSHINE Bot v1.0', 'magenta');
      logger.custom('ENV', `Environnement : ${config.NODE_ENV}`, 'blue');

      await this.initializeDiscordClient();
      await this.connectBot();

      // Charger les tâches APRÈS la connexion du bot
      await loadFiles('tasks', 'task', this.client);

      // Initialiser le monitoring
      this.initializeMonitoring();

      logger.success(`✨ soundSHINE Bot démarré avec le username ${this.client.user.tag}`);
      logger.section('API');

      // Démarrer le serveur Express
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

  /**
   * Initialiser le système de monitoring
   */
  initializeMonitoring() {
    try {
      // Démarrer la collecte de métriques périodique
      this.startMetricsCollection();

      // Démarrer la vérification des alertes
      this.startAlertMonitoring();

      // Enregistrer le démarrage dans les logs centralisés
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

  /**
   * Démarrer la collecte de métriques
   */
  startMetricsCollection() {
    this.monitoringInterval = setInterval(async () => {
      try {
        // Mettre à jour les métriques Discord
        metricsCollector.updateDiscordMetrics(this.client);

        // Mettre à jour les métriques système
        metricsCollector.updateSystemMetrics();

        // Enregistrer dans les logs centralisés
        await centralizedLogger.info('Métriques mises à jour', {
          guilds: this.client.guilds?.cache?.size || 0,
          users: this.client.users?.cache?.size || 0,
          ping: this.client.ws?.ping || 0
        });
      } catch (error) {
        logger.error('Erreur lors de la collecte de métriques:', error);
        alertManager.createAlert('metrics_collection_error', 'error', `Erreur lors de la collecte de métriques: ${error.message}`, { context: 'monitoring' });
      }
    }, 30000); // Toutes les 30 secondes
  }

  /**
   * Démarrer la surveillance des alertes
   */
  startAlertMonitoring() {
    setInterval(async () => {
      try {
        // Vérifier les métriques et créer des alertes si nécessaire
        await alertManager.checkMetrics(this.client);

        // Vérifier le taux d'erreurs
        alertManager.checkErrorRate();

        // Nettoyer les anciennes alertes
        alertManager.cleanupOldAlerts();
      } catch (error) {
        logger.error('Erreur lors de la surveillance des alertes:', error);
      }
    }, 60000); // Toutes les minutes
  }

  startWebServer() {
    try {
      this.server = new WebServer(this.client, logger);
      this.server.start(config.API_PORT);
      logger.info('📊 Métriques disponibles sur /v1/metrics');
      logger.info('🏥 Health check sur /health');
      logger.info('📝 Logs centralisés disponibles sur /v1/logs');
      logger.info('🚨 Alertes disponibles sur /v1/alerts');
      logger.sectionStart('Start logging now...');
    } catch (error) {
      errorHandler.handleCriticalError(error, 'WEB_SERVER_START');
      throw error;
    }
  }

  async shutdown() {
    logger.info('Arrêt du bot en cours...');

    try {
      // Arrêter le monitoring
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        logger.info('Monitoring arrêté');
      }

      // Enregistrer l'arrêt dans les logs centralisés
      await centralizedLogger.info('Bot soundSHINE arrêté', {
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });

      if (this.client) {
        await this.client.destroy();
        logger.info('Client Discord déconnecté');
      }

      // Arrêter le serveur Express
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
const statusInterval = updateStatus.start(client, logger, config.JSON_URL);

process.on("SIGINT", async () => {
  logger.warn("Arrêt demandé, fermeture propre...");

  updateStatus.stop(); // ⛔️ On stoppe l’interval

  await client.destroy();
  process.exit(0);
});

process.on('SIGINT', () => bot.shutdown()); // Arrêter avec Ctrl+C
process.on('SIGTERM', () => bot.shutdown()); // Arrêter depuis le système

process.on('unhandledRejection', error => {
  errorHandler.handleCriticalError(error, 'UNHANDLED_REJECTION');
  alertManager.createAlert('unhandled_rejection', 'error', `Promesse rejetée non gérée: ${error.message}`, { context: 'process' });
  logger.error(`Promesse rejetée non gérée : ${error.message}`);
});

// Exception non-capturée
process.on('uncaughtException', error => {
  errorHandler.handleCriticalError(error, 'UNCAUGHT_EXCEPTION');
  alertManager.createAlert('uncaught_exception', 'critical', `Exception non capturée: ${error.message}`, { context: 'process' });
  logger.error(`Exception non capturée : ${error.message}`);
  bot.shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  if (reason?.message?.includes("Shard 0 not found")) {
    logger.warn("Shard non trouvé à la fermeture, c’est probablement normal.");
  } else {
    logger.error(`[UNHANDLED_REJECTION]: ${reason}`);
  }
});
// Démarrer
bot.initialize();
