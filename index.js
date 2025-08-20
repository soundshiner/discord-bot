// ========================================
// index.js - Point d'entrée principal
// ========================================

import "dotenv/config";
import { startBot, stopBot } from "./bot/startup.js";
import WebServer from "./api/index.js";
import logger from "./bot/logger.js";
import { getGlobalConfig } from "./utils/bot/globalConfig.js";
import { database } from "./utils/database/database.js";
import appState from "./core/services/AppState.js";
import { retryDiscord, retry } from "./utils/core/retry.js";
import { registerProcessHandlers } from "./core/lifecycle.js";
import pkg from "./package.json" with { type: "json" };
import logMemory from './bot/tasks/logMemory.js';
let config;
let botClient = null;
let apiServer = null;
let isShuttingDown = false;

try {
  config = getGlobalConfig();
  appState.initialize();
  appState.setConfigLoaded(config);
} catch (error) {
  logger.error("Erreur de configuration:", error);
  process.exit(1);
}

async function gracefulShutdown(signal = "UNKNOWN") {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.warn(`Fermeture demandée (signal: ${signal})`);

  try {
    if (apiServer) {
      await apiServer.stop();
      appState.setApiRunning(false);
    }

    if (botClient) {

      await stopBot();
      appState.setBotConnected(false);
      appState.setBotReady(false);

    }


    await database.disconnect();
    appState.setDatabaseConnected(false);
    appState.setDatabaseHealthy(false);

    process.exit(0);
  } catch (error) {
    logger.error("Erreur durant la fermeture:", error);
    process.exit(1);
  }
}

async function startApplication() {
  try {
    console.log("");
    logger.info(`Version: ${pkg.version}`);
    logger.info(`Node.js: ${process.version}`);
    logger.info(`Environnement: ${config.NODE_ENV}`);

    botClient = await retryDiscord(
      async () => {
        const client = await startBot();
        appState.setBotConnected(true);
        appState.setBotReady(true);
        return client;
      },
      {
        onRetry: (error, attempt) =>
          logger.warn(`Retry Discord ${attempt}: ${error.message}`),
      }
    );

    apiServer = new WebServer(botClient, logger);
    logger.banner("Initialisation du serveur API...");
    await retry(
      async () => {
        await apiServer.start(config.api.port);
        appState.setApiRunning(true, config.api.port);
      },
      {
        onRetry: (error, attempt) =>
          logger.warn(`Retry API ${attempt}: ${error.message}`),
      }
    );

    logger.success(`API en ligne sur le port ${config.api.port}`);
    registerProcessHandlers({ gracefulShutdown });

    logger.api("Routes API disponibles : /v1/metrics, /v1/health, /v1/logs, /v1/alerts, v1/send-playlist");
    logMemory.execute();
    logger.banner("Bot prêt. Logging en cours...");
  } catch (error) {
    logger.error("Erreur critique au démarrage:", error);

    try {
      if (botClient) await stopBot();
      if (apiServer) await apiServer.stop();
      await database.disconnect();
    } catch (cleanupError) {
      logger.error("Erreur lors du cleanup:", cleanupError);
    }

    process.exit(1);
  }
}

startApplication();
