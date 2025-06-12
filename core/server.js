// ========================================
// core/server.js (ESM)
// ========================================
import express from "express";
import config from "./config.js";

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
    this.app.use(express.urlencoded({ extended: true }));

    this.app.use((req, res, next) => {
      this.logger.custom("HTTP", `${req.method} ${req.path}`, "cyan");
      res.header("X-Powered-By", "soundSHINE Bot");
      next();
    });
  }

  setupRoutes() {
    try {
      import("../routes/playlistWebhook.js").then(
        ({ default: sendPlaylist }) => {
          this.app.use("/v1", sendPlaylist(this.client, this.logger));
        }
      );
      import("../routes/health.js").then(({ default: healthRoute }) => {
        this.app.use("/v1/health", healthRoute(this.client, this.logger));
      });
      import("../routes/stageWebhook.js").then(({ default: stageWebhook }) => {
        this.app.use("/v1", stageWebhook(this.client, this.logger));
      });
    } catch (error) {
      throw new Error("Échec de l'initialisation des routes");
    }

    this.app.use((req, res) => {
      res
        .status(404)
        .json({ error: "Route non trouvée", path: req.originalUrl });
    });

    this.app.use((err, req, res, next) => {
      this.logger.error(`Erreur serveur : ${err.message}`);
      res.status(500).json({ error: "Erreur interne du serveur" });
    });
  }

  start() {
    const port = config.API_PORT;
    return new Promise((resolve, reject) => {
      const server = this.app.listen(port, (err) => {
        if (err) {
          this.logger.error(`Erreur lors du démarrage : ${err.message}`);
          reject(err);
        } else {
          this.logger.success(`Serveur web démarré sur le port ${port}`);
          this.logger.custom(
            "ENV",
            `Environnement : ${config.NODE_ENV}`,
            "blue"
          );
          resolve(server);
        }
      });

      process.on("SIGTERM", () => {
        this.logger.info("Signal SIGTERM reçu, arrêt...");
        server.close(() => {
          this.logger.success("Serveur web arrêté proprement");
        });
      });
    });
  }

  getApp() {
    return this.app;
  }
}
