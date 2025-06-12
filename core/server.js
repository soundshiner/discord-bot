// ========================================
// core/server.js (ESM)
// ========================================
import express from "express";
import config from "./config.js";
import { loadFiles } from "./loadFiles.js"; // 👈 Import du chargeur centralisé

export default class WebServer {
  constructor(client, logger) {
    this.app = express();
    this.client = client;
    this.logger = logger;

    this.setupMiddleware();
    this.setupRoutes(); // ⬅ On prépare les routes ici
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

  async setupRoutes() {
    try {
      // 💡 Chargement dynamique de toutes les routes dans /routes/
      await loadFiles("routes", "route", this.client, this.app, this.logger);
    } catch (error) {
      this.logger.error(
        `Erreur lors du chargement des routes : ${error.message}`
      );
    }

    // 🛑 Route 404 (doit venir après toutes les autres)
    this.app.use((req, res) => {
      res
        .status(404)
        .json({ error: "Route non trouvée", path: req.originalUrl });
    });

    // 🚨 Gestion des erreurs internes
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
