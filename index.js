// ========================================
// index.js (ESM - Node 20.18.0)
// ========================================
import { Client, GatewayIntentBits, Collection } from "discord.js";
import config from "./core/config.js";
import { loadFiles } from "./core/loadFiles.js";
import WebServer from "./core/server.js";
import logger from "./utils/logger.js";

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
      await this.initializeWebServer(this.client, logger);
      await this.connectBot();

      logger.success("✨ soundSHINE Bot démarré avec succès !");
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

  async initializeWebServer(client, logger) {
    this.server = new WebServer(client, logger);
    await this.server.start();
  }

  async connectBot() {
    await this.client.login(config.BOT_TOKEN);
    logger.success("Bot Discord connecté avec succès");
  }

  async shutdown() {
    logger.info("Arrêt du bot en cours...");

    if (this.client) {
      await this.client.destroy();
      logger.success("Client Discord déconnecté");
    }

    logger.success("soundSHINE Bot arrêté proprement");
    process.exit(0);
  }
}

const bot = new SoundShineBot();

process.on("SIGINT", () => bot.shutdown());
process.on("SIGTERM", () => bot.shutdown());

process.on("unhandledRejection", (error) => {
  logger.error(`Promesse rejetée non gérée : ${error.message}`);
});

process.on("uncaughtException", (error) => {
  logger.error(`Exception non capturée : ${error.message}`);
  bot.shutdown();
});

bot.initialize();
