// ========================================
// core/startup.js (ESM)
// ========================================

import { Client, GatewayIntentBits, Collection } from "discord.js";
import config from "./config.js";
import loadFiles from "./loadFiles.js";
import logger from "../utils/logger.js";
import errorHandler from "../utils/errorHandler.js";
// import metricsCollector from '../utils/metrics.js';
// import alertManager from '../utils/alerts.js';
// import centralizedLogger from '../utils/centralizedLogger.js';
import updateStatus from "../tasks/updateStatus.js";
import WebServer from "../api/server.js";

let client = null;
let serverInstance = null;
const monitoringInterval = null;
let updateStatusInterval = null;

export async function start() {
  try {
    logger.custom("BOOT", "soundSHINE Bot v1.0", "magenta");
    logger.custom("ENV", `Environnement : ${config.NODE_ENV}`, "blue");

    await initializeDiscordClient();
    await connectBot();

    await loadFiles("tasks", "task", client);
    startUpdateStatus();

    logger.sectionStart("API");
    startWebServer();

    logger.sectionStart("Finale");
    logger.logInfo(
      `📡 Tâche updateStatus lancée toutes les ${updateStatus.interval} ms`
    );
    logger.logInfo("📊 Système de monitoring initialisé");
    logger.logInfo("📝 Système de logging centralisé initialisé");
    logger.success(
      `✨ soundSHINE Bot démarré avec le username ${client.user.tag}`
    );
    logger.sectionStart("Start logging now...");
  } catch (error) {
    errorHandler.handleCriticalError(error, "BOT_STARTUP");
    logger.error(`Erreur critique lors du démarrage : ${error.message}`);
    process.exit(1);
  }
}

async function initializeDiscordClient() {
  try {
    client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
      ],
    });

    client.commands = new Collection();

    // Charger chaque section + stocker les résultats
    const commandsResult = await loadFiles("commands", "command", client);
    const eventsResult = await loadFiles("events", "event", client);
    const utilsResult = await loadFiles("utils", "util", client);

    logger.sectionStart("RÉSUMÉ DU CHARGEMENT");
    summarizeLoad(client, [
      { type: "commands", folder: "commands", result: commandsResult },
      { type: "events", folder: "events", result: eventsResult },
      { type: "utils", folder: "utils", result: utilsResult },
    ]);
  } catch (error) {
    errorHandler.handleCriticalError(error, "DISCORD_CLIENT_INIT");
    throw error;
  }
}

async function connectBot() {
  try {
    await client.login(config.BOT_TOKEN);
  } catch (error) {
    errorHandler.handleCriticalError(error, "BOT_LOGIN");
    throw error;
  }
}

function startUpdateStatus() {
  if (!updateStatus || typeof updateStatus.execute !== "function") {
    logger.error(
      "updateStatus.execute est introuvable ou n'est pas une fonction, status update skipped"
    );
    return;
  }

  (async () => {
    try {
      await updateStatus.execute(client);
    } catch (error) {
      logger.error("Erreur dans updateStatus (appel initial) :", error);
      errorHandler.handleTaskError(error, "UPDATE_STATUS");
    }
  })();

  updateStatusInterval = setInterval(() => {
    if (typeof updateStatus.execute === "function") {
      updateStatus.execute(client).catch((error) => {
        logger.error("Erreur dans updateStatus :", error);
        errorHandler.handleTaskError(error, "UPDATE_STATUS");
      });
    } else {
      logger.error(
        "updateStatus.execute est undefined pendant l'intervalle, arrêt du setInterval"
      );
      clearInterval(updateStatusInterval);
    }
  }, updateStatus.interval);
}

function startWebServer() {
  try {
    serverInstance = new WebServer(client, logger);
    serverInstance.start(config.API_PORT);

    logger.logInfo("📊 Métriques disponibles sur /v1/metrics");
    logger.logInfo("🏥 Health check sur /v1/health");
    logger.logInfo("📝 Logs centralisés disponibles sur /v1/logs");
    logger.logInfo("🚨 Alertes disponibles sur /v1/alerts");
  } catch (error) {
    errorHandler.handleCriticalError(error, "WEB_SERVER_START");
    throw error;
  }
}

function summarizeLoad(client, results) {
  results.forEach(({ type, folder, result }) => {
    const count = client?.[type]?.size ?? result?.loaded?.length ?? "non suivi";
    logger.custom(
      type.toUpperCase(),
      `${count} chargés depuis ${folder}`,
      "green"
    );
  });
}

export async function stop() {
  logger.logInfo("Arrêt du bot en cours...");

  try {
    if (monitoringInterval) clearInterval(monitoringInterval);
    if (updateStatusInterval) clearInterval(updateStatusInterval);

    if (client) {
      await client.destroy();
      logger.logInfo("Client Discord déconnecté");
    }

    if (serverInstance) {
      await serverInstance.stop();
      logger.success("Serveur Express arrêté.");
    }

    logger.success("soundSHINE Bot arrêté proprement");
    process.exit(0);
  } catch (error) {
    errorHandler.handleCriticalError(error, "BOT_SHUTDOWN");
    logger.error("Erreur lors de l'arrêt du bot:", error);
    process.exit(1);
  }
}

