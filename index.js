// ========================================
// index.js (ESM - Node 20+)
// ========================================

import { Client, GatewayIntentBits, Collection } from 'discord.js';
import config from './core/config.js';
import { loadFiles } from './core/loadFiles.js';
import logger from './utils/logger.js';
import errorHandler from './utils/errorHandler.js';

import WebServer from './api/server.js';

class SoundShineBot {
  constructor() {
    this.client = null;
    this.server = null;
  }

  async initialize() {
    try {
      logger.custom('BOOT', 'soundSHINE Bot v1.0', 'magenta');
      logger.custom('ENV', `Environnement : ${config.NODE_ENV}`, 'blue');

      await this.initializeDiscordClient();
      await this.connectBot();

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
        tasks: await loadFiles('tasks', 'task', this.client),
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

  startWebServer() {
    try {
      this.server = new WebServer(this.client, logger);
      this.server.start(config.API_PORT);
      logger.info('📊 Métriques disponibles sur /v1/metrics');
      logger.info('🏥 Health check sur /health');
      logger.sectionStart('Start logging now...');
    } catch (error) {
      errorHandler.handleCriticalError(error, 'WEB_SERVER_START');
      throw error;
    }
  }

  async shutdown() {
    logger.info('Arrêt du bot en cours...');

    try {
      if (this.client) {
        await this.client.destroy();
        logger.success('Client Discord déconnecté');

        // Arrêter le serveur Express
        if (this.server) {
          await this.server.stop();
          logger.success('Serveur Express arrêté proprement.');
        }
      }

      logger.success('soundSHINE Bot arrêté proprement');
      process.exit(0);
    } catch (error) {
      errorHandler.handleCriticalError(error, 'BOT_SHUTDOWN');
      logger.error("Erreur lors de l'arrêt du bot:", error);
      process.exit(1);
    }
  }
}

const bot = new SoundShineBot();

process.on('SIGINT', () => bot.shutdown()); // Arrêter avec Ctrl+C
process.on('SIGTERM', () => bot.shutdown()); // Arrêter depuis le système

process.on('unhandledRejection', error => {
  errorHandler.handleCriticalError(error, 'UNHANDLED_REJECTION');
  logger.error(`Promesse rejetée non gérée : ${error.message}`);
});

// Exception non-capturée
process.on('uncaughtException', error => {
  errorHandler.handleCriticalError(error, 'UNCAUGHT_EXCEPTION');
  logger.error(`Exception non capturée : ${error.message}`);
  bot.shutdown();
});

// Démarrer
bot.initialize();
