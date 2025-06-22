// ========================================
// core/server.js (ESM - Node 20+)
// ========================================

import express from "express";

import health from "./routes/health.js";
import playlist_update from "./routes/playlist-update.js";
export default class WebServer {
  constructor(client, logger) {
    this.app = express();
    this.client = client;
    this.logger = logger;

    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json({ limit: "10mb" }));

    this.app.use((req, res, next) => {
      this.logger.custom("HTTP", `${req.method} ${req.path}`, "cyan");

      res.header("X-Powered-By", "soundSHINE Bot");

      next();
    });
  }

  setupRoutes() {
    // Route health
    this.app.use("/v1/health", health(this.client, this.logger));

    // Route playlist webhook
    this.app.use(
      "/v1/send-playlist",
      playlist_update(this.client, this.logger)
    );

    // 404 fallback
    this.app.use((req, res) => {
      res
        .status(404)
        .json({ error: "Route non trouvée", path: req.originalUrl });
    });

    // Erreur serveur
    this.app.use((err, req, res, next) => {
      this.logger.error(`Erreur serveur : ${err.message}`);
      res.status(500).json({ error: "Erreur interne du serveur" });
    });
  }

  start(port) {
    return new Promise((resolve, reject) => {
      const server = this.app.listen(port, (err) => {
        if (err) {
          this.logger.error(`Erreur lors du démarrage : ${err.message}`);
          reject(err);
        } else {
          resolve(server);
        }
      });

      process.on("SIGTERM", () => {
        this.logger.info("Signal SIGTERM reçu, arrêt du serveur.");
        server.close(() => {
          this.logger.success("Serveur arrêté proprement.");
        });
      });
    });
  }
}
