// ========================================
// core/server.js (ESM - Node 20+)
// ========================================

import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";

import health from "./routes/health.js";
import playlist_update from "./routes/playlist-update.js";
import requireApiToken from "./middleware/requireApiToken.js";
import validateBody from "./middleware/validateBody.js";
import { sendPlaylistSchema } from "./schemas/playlistSchemas.js";
export default class WebServer {
  constructor(client, logger) {
    this.app = express();
    this.client = client;
    this.logger = logger;

    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // Security and Performance Middlewares
    this.app.use(helmet());
    this.app.use(compression());

    // Configure CORS
    const corsOptions = {
      origin: [
        "http://localhost:3000", // For local development
        "https://soundshineradio.com",
        "https://www.soundshineradio.com",
      ],
      optionsSuccessStatus: 200,
    };
    this.app.use(cors(corsOptions));

    // Rate Limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

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
      requireApiToken,
      validateBody(sendPlaylistSchema),
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

