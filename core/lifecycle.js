// ========================================
// core/lifecycle.js (ESM)
// ========================================

import logger from "../bot/logger.js";
import alertManager from "../utils/alerts.js";
import errorHandler from "../core/monitor.js";
import { stopBot } from "../bot/startup.js";

export function registerProcessHandlers() {
  process.on("SIGINT", async () => {
    logger.warn("Signal SIGINT reçu. Arrêt du bot...");
    await stopBot();
  });

  process.on("SIGTERM", async () => {
    logger.warn("Signal SIGTERM reçu. Arrêt du bot...");
    await stopBot();
  });

  process.on("unhandledRejection", (reason) => {
    if (reason?.message?.includes("Shard 0 not found")) {
      logger.warn(
        "Shard non trouvé à la fermeture, c'est probablement normal."
      );
    } else {
      errorHandler.handleCriticalError(reason, "UNHANDLED_REJECTION");
      alertManager.createAlert(
        "unhandled_rejection",
        "error",
        `Promesse rejetée non gérée: ${reason.message}`,
        { context: "process" }
      );
      logger.error(`Promesse rejetée non gérée : ${reason.message}`);
    }
  });

  process.on("uncaughtException", async (error) => {
    errorHandler.handleCriticalError(error, "UNCAUGHT_EXCEPTION");
    alertManager.createAlert(
      "uncaught_exception",
      "critical",
      `Exception non capturée: ${error.message}`,
      { context: "process" }
    );
    logger.error(`Exception non capturée : ${error.message}`);
    await stopBot();
  });
}
