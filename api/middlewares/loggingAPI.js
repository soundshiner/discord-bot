// api/middlewares/loggingAPI.js
import {
  logApiRequest,
  logApiError,
  logInfo,
} from "../../utils/centralizedLogger.js";

export default function loggingAPI() {
  return (req, res, next) => {
    const start = Date.now();

    // Log des métriques si le collecteur global existe
    res.on("finish", () => {
      const duration = Date.now() - start;
      const status = res.statusCode;
      const { method } = req;
      const { url } = req;

      // Intégration avec le collecteur de métriques global
      if (global.metricsCollector) {
        global.metricsCollector.recordApiRequest(method, url, status, duration);

        // Log des métriques collectées
        logInfo("API Metrics recorded", {
          type: "api_metrics",
          method,
          url,
          status,
          duration,
          timestamp: new Date().toISOString(),
        });
      }

      // Log principal de la requête API avec le système unifié
      logApiRequest(req, res, duration);
    });

    // Gestion des erreurs
    res.on("error", (error) => {
      const duration = Date.now() - start;
      logApiError(error, req, res);
    });

    next();
  };
}

// Ce middleware utilise maintenant le système de logging unifié
// qui combine console coloré et logs Winston dans des fichiers séparés

