// ========================================
// index.js (ESM - Node 20+)
// ========================================

import { Client, GatewayIntentBits, Collection } from "discord.js";
import config from "./core/config.js";
import { loadFiles } from "./core/loadFiles.js";
import logger from "./utils/logger.js";

import WebServer from "./api/server.js";

class SoundShineBot {
  constructor() {
    this.client = null;
    this.server = null;
  }

  async initialize() {
    try {
      logger.custom("BOOT", `soundSHINE Bot v1.0`, "magenta");

      logger.custom("ENV", `Environnement : ${config.NODE_ENV}`, "blue");

      await this.initializeDiscordClient();

      await this.connectBot();

      logger.success(
        `✨ soundSHINE Bot démarré avec le username ${this.client.user.tag}`
      );

      // Démarrer le serveur Express
      this.startWebServer();
    } catch (error) {
      logger.error(
        `Erreur critique lors de l'initialisation : ${error.message}`
      );
      process.exit(1);
    }
  }

  async initializeDiscordClient() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
      ],
    });

    this.client.commands = new Collection();
    this.client.config = { PREFIX: config.PREFIX };

    const results = {
      commands: await loadFiles("commands", "command", this.client),
      events: await loadFiles("events", "event", this.client),
      tasks: await loadFiles("tasks", "task", this.client),
      utils: await loadFiles("utils", "util", this.client),
    };

    logger.section("RÉSUMÉ DU CHARGEMENT");

    Object.entries(results).forEach(([type, result]) => {
      if (result && result.total > 0) {
        logger.custom(
          type.toUpperCase(),
          `${result.loaded.length}/${result.total} chargés`,
          result.failed.length === 0 ? "green" : "yellow"
        );
      }
    });
  }

  async connectBot() {
    await this.client.login(config.BOT_TOKEN);
  }

  startWebServer() {
    this.server = new WebServer(this.client, logger);
    this.server.start(config.API_PORT);
    logger.success(`Serveur Express démarré sur le port ${config.API_PORT}`);
  }

  async shutdown() {
    logger.info("Arrêt du bot en cours...");

    if (this.client) {
      await this.client.destroy();
      logger.success("Client Discord déconnecté");

      // Arrêter le serveur Express
      if (this.server) {
        // La fonction server.start retourne une Promise
        // que l'on garde.
        // Express server est lancé depuis server.start()
        logger.success("Serveur Express arrêté proprement.");
      }
    }

    logger.success("soundSHINE Bot arrêté proprement");

    process.exit(0);
  }
}

const bot = new SoundShineBot();

process.on("SIGINT", () => bot.shutdown()); // Arrêter avec Ctrl+C
process.on("SIGTERM", () => bot.shutdown()); // Arrêter depuis le système

process.on("unhandledRejection", (error) => {
  logger.error(`Promesse rejetée non gérée : ${error.message}`);
});

// Exception non-capturée
process.on("uncaughtException", (error) => {
  logger.error(`Exception non capturée : ${error.message}`);
  bot.shutdown();
});

// Démarrer
bot.initialize();
