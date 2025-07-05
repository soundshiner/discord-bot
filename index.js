// ========================================
// index.js (ESM) - Point d'entrée principal
// ========================================

import "dotenv/config";
import { startBot } from "./bot/startup.js";
import { registerProcessHandlers } from "./core/lifecycle.js";
import WebServer from "./api/index.js";
import logger from "./bot/logger.js";
import { getGlobalConfig } from "./utils/globalConfig.js";

// Configuration globale
const config = getGlobalConfig();

// 🚀 Lancement du bot Discord
let botClient = null;
try {
  botClient = await startBot();
  logger.success("Bot Discord démarré avec succès");
} catch (error) {
  logger.error("Erreur lors du démarrage du bot:", error);
  process.exit(1);
}

// 🌐 Lancement du serveur API
let apiServer = null;
try {
  apiServer = new WebServer(botClient, logger);
  apiServer.start(config.apiPort);
  logger.success(`Serveur API démarré sur le port ${config.apiPort}`);
} catch (error) {
  logger.error("Erreur lors du démarrage de l'API:", error);
  process.exit(1);
}

// 🧼 Gestion du cycle de vie
registerProcessHandlers();

logger.section("Démarrage terminé");
logger.info("📊 Métriques disponibles sur /v1/metrics");
logger.info("🏥 Health check sur /v1/health");
logger.info("📝 Logs centralisés disponibles sur /v1/logs");
logger.info("🚨 Alertes disponibles sur /v1/alerts");

