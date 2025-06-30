// api/server.js
import express from 'express';
import rateLimit from 'express-rate-limit';
import corsMiddleware from './middlewares/cors.js';
import helmetMiddleware from './middlewares/helmet.js';
import loggingMiddleware from './middlewares/loggingAPI.js';
import loadRoutes from './routes.js';
import errorHandler from '../utils/errorHandler.js';

class WebServer {
  constructor (client, logger) {
    this.client = client;
    this.logger = logger;
    this.app = express();
    this.app.set('trust proxy', 1);
    this.server = null;
  }

  setupMiddleware () {
    try {
      this.app.use(helmetMiddleware);
      this.app.use(corsMiddleware);
      this.app.use(rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
        standardHeaders: true,
        legacyHeaders: false
      }));
      this.app.use(express.json({ limit: '10mb' }));
      this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
      this.app.use(loggingMiddleware());
    } catch (error) {
      errorHandler.handleCriticalError(error, 'MIDDLEWARE_SETUP');
      throw error;
    }
  }

  setupRoutes () {
    try {
      loadRoutes(this.app, this.client, this.logger);
      this.logger.info('✅ Routes API chargées');
    } catch (error) {
      errorHandler.handleCriticalError(error, 'ROUTES_SETUP');
      throw error;
    }
  }

  setupErrorHandling () {
    this.app.use((err, req, res, _next) => {
      errorHandler.handleApiError(err, req, res);
    });
  }

  start (port) {
    try {
      this.setupMiddleware();
      this.setupRoutes();
      this.setupErrorHandling();

      this.server = this.app.listen(port, () => {
        this.logger.success(`🚀 Serveur Express démarré sur le port ${port}`);
      });

      this.server.on('error', error => {
        errorHandler.handleCriticalError(error, 'SERVER_ERROR');
        this.logger.error(`Erreur serveur: ${error.message}`);
      });

      return this.server;
    } catch (error) {
      errorHandler.handleCriticalError(error, 'SERVER_START');
      throw error;
    }
  }

  async stop () {
    if (this.server) {
      return new Promise((resolve, reject) => {
        this.server.close(err => {
          if (err) {
            errorHandler.handleCriticalError(err, 'SERVER_STOP');
            reject(err);
          } else {
            this.logger.success('Serveur Express arrêté proprement');
            resolve();
          }
        });
      });
    }
  }
}

export default WebServer;
