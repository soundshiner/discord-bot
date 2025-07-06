// ========================================
// index.js (ESM) - Point d'entrée principal optimisé
// ========================================

import "dotenv/config";
import { startBot, stopBot } from "./bot/startup.js";
import { registerProcessHandlers } from "./core/lifecycle.js";
import WebServer from "./api/index.js";
import logger from "./bot/logger.js";
import { getGlobalConfig } from "./bot/utils/globalConfig.js";
import { disconnectDatabase } from "./bot/utils/database.js";

// Configuration globale avec validation
let config;
try {
  config = getGlobalConfig();
  logger.info(`Configuration chargée pour l'environnement: ${config.NODE_ENV}`);
} catch (error) {
  logger.error(
    "Erreur critique lors du chargement de la configuration:",
    error
  );
  process.exit(1);
}

// Variables globales pour la gestion du cycle de vie
let botClient = null;
let apiServer = null;
let isShuttingDown = false;

// Fonction de fermeture gracieuse
async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    logger.warn("Fermeture déjà en cours, ignoré");
    return;
  }

  isShuttingDown = true;
  logger.warn(`Signal ${signal} reçu. Fermeture gracieuse en cours...`);

  try {
    // Arrêter le serveur API
    if (apiServer) {
      logger.info("Arrêt du serveur API...");
      await apiServer.stop();
      logger.success("Serveur API arrêté");
    }

    // Arrêter le bot Discord
    if (botClient) {
      logger.info("Arrêt du bot Discord...");
      await stopBot();
      logger.success("Bot Discord arrêté");
    }

    // Fermer la base de données
    logger.info("Fermeture de la base de données...");
    await disconnectDatabase();
    logger.success("Base de données fermée");

    logger.success("Fermeture gracieuse terminée");
    process.exit(0);
  } catch (error) {
    logger.error("Erreur lors de la fermeture gracieuse:", error);
    process.exit(1);
  }
}

// Fonction de démarrage principale
async function startApplication() {
  try {
    logger.sectionStart("Démarrage de soundSHINE Bot");
    logger.info(`Version: ${process.env.npm_package_version || "2.0.0"}`);
    logger.info(`Node.js: ${process.version}`);
    logger.info(`Environnement: ${config.NODE_ENV}`);

    // 🚀 Lancement du bot Discord
    logger.info("Initialisation du bot Discord...");
    botClient = await startBot();
    logger.success("Bot Discord démarré avec succès");

    // 🌐 Lancement du serveur API
    logger.info("Initialisation du serveur API...");
    apiServer = new WebServer(botClient, logger);
    apiServer.start(config.apiPort);
    logger.success(`Serveur API démarré sur le port ${config.apiPort}`);

    // 🧼 Gestion du cycle de vie
    registerProcessHandlers();

    // Enregistrer les gestionnaires de fermeture
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

    logger.section("Démarrage terminé avec succès");
    logger.info("📊 Métriques disponibles sur /v1/metrics");
    logger.info("🏥 Health check sur /v1/health");
    logger.info("📝 Logs centralisés disponibles sur /v1/logs");
    logger.info("🚨 Alertes disponibles sur /v1/alerts");

    // Log des informations de performance
    const memUsage = process.memoryUsage();
    logger.info(
      `Mémoire utilisée: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`
    );
  } catch (error) {
    logger.error("Erreur critique lors du démarrage de l'application:", error);

    // Tentative de nettoyage en cas d'erreur
    try {
      if (botClient) await stopBot();
      if (apiServer) await apiServer.stop();
      await disconnectDatabase();
    } catch (cleanupError) {
      logger.error(
        "Erreur lors du nettoyage après erreur de démarrage:",
        cleanupError
      );
    }

    process.exit(1);
  }
}

// Gestion des erreurs non capturées
process.on("uncaughtException", async (error) => {
  logger.error("Exception non capturée:", error);
  await gracefulShutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Promesse rejetée non gérée:", reason);
  // Ne pas arrêter l'application pour les promesses rejetées
  // mais les logger pour le debugging
});

// Démarrage de l'application
startApplication().catch((error) => {
  logger.error("Erreur fatale lors du démarrage:", error);
  process.exit(1);
});

