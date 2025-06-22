// ========================================
// api/server.js (ESM - Node 20+) - Version optimisée
// ========================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import healthRoutes from './routes/health.js';
import metricsRoutes from './routes/metrics.js';
import playlistRoutes from './routes/playlist-update.js';
import logsRoutes from './routes/logs.js';
import alertsRoutes from './routes/alerts.js';
import errorHandler from '../utils/errorHandler.js';

class WebServer {
  constructor(client, logger) {
    this.client = client;
    this.logger = logger;
    this.app = express();
    this.server = null;
    this.setupMiddleware();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    try {
      // Sécurité
      this.app.use(
        helmet({
          contentSecurityPolicy: false,
          crossOriginEmbedderPolicy: false
        })
      );

      // CORS
      this.app.use(
        cors({
          origin: [
            'https://soundshineradio.com',
            'https://www.soundshineradio.com',
            'https://discord.com',
            'https://api.soundshineradio.com'
          ],
          credentials: true
        })
      );

      // Rate limiting
      const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limite chaque IP à 100 requêtes par fenêtre
        message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
        standardHeaders: true,
        legacyHeaders: false
      });
      this.app.use(limiter);

      // Parsing
      this.app.use(express.json({ limit: '10mb' }));
      this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

      // Logging des requêtes avec métriques
      this.app.use((req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
          const duration = Date.now() - start;
          const status = res.statusCode;
          const method = req.method;
          const url = req.url;
          const ip = req.ip || req.connection.remoteAddress;

          // Enregistrer les métriques de requête
          if (global.metricsCollector) {
            global.metricsCollector.recordApiRequest(method, url, status, duration);
          }

          if (status >= 400) {
            this.logger.warn(`${method} ${url} - ${status} - ${duration}ms - ${ip}`);
          } else {
            this.logger.info(`${method} ${url} - ${status} - ${duration}ms - ${ip}`);
          }
        });
        next();
      });
    } catch (error) {
      errorHandler.handleCriticalError(error, 'MIDDLEWARE_SETUP');
      throw error;
    }
  }

  setupRoutes() {
    try {
      // Route racine
      this.app.get('/', (req, res) => {
        res.json({
          name: 'soundSHINE Bot API',
          version: '1.0.0',
          status: 'online',
          timestamp: new Date().toISOString(),
          endpoints: {
            health: '/v1/health',
            metrics: '/v1/metrics',
            logs: '/v1/logs',
            alerts: '/v1/alerts',
            playlist: '/v1/send-playlist'
          }
        });
      });

      // Routes API - Ajoutées une par une pour debug
      try {
        this.app.use('/v1/health', healthRoutes(this.client, this.logger));
        this.logger.info('Route /v1/health chargée');
      } catch (error) {
        this.logger.error('❌ Erreur route /health:', error);
        throw error;
      }

      try {
        this.app.use('/v1/metrics', metricsRoutes(this.client, this.logger));
        this.logger.info('Route /v1/metrics chargée');
      } catch (error) {
        this.logger.error('❌ Erreur route /v1/metrics:', error);
        throw error;
      }

      try {
        this.app.use('/v1/logs', logsRoutes(this.client, this.logger));
        this.logger.info('Route /v1/logs chargée');
      } catch (error) {
        this.logger.error('❌ Erreur route /v1/logs:', error);
        throw error;
      }

      try {
        this.app.use('/v1/alerts', alertsRoutes(this.client, this.logger));
        this.logger.info('Route /v1/alerts chargée');
      } catch (error) {
        this.logger.error('❌ Erreur route /v1/alerts:', error);
        throw error;
      }

      try {
        this.app.use('/v1/send-playlist', playlistRoutes(this.client, this.logger));
        this.logger.info('Route /v1/send-playlist chargée');
      } catch (error) {
        this.logger.error('❌ Erreur route /v1/send-playlist:', error);
        throw error;
      }

      // Route 404 - Utiliser une approche différente pour éviter l'erreur path-to-regexp
      this.app.use((req, res) => {
        res.status(404).json({
          error: 'Route non trouvée',
          path: req.originalUrl,
          method: req.method
        });
      });
    } catch (error) {
      errorHandler.handleCriticalError(error, 'ROUTES_SETUP');
      throw error;
    }
  }

  setupErrorHandling() {
    try {
      // Gestionnaire d'erreurs global
      this.app.use((error, req, res) => {
        errorHandler.handleApiError(error, req, res);
        this.logger.error(`Erreur API: ${error.message}`, {
          url: req.url,
          method: req.method,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        res.status(error.status || 500).json({
          error: process.env.NODE_ENV === 'production' ? 'Erreur interne du serveur' : error.message,
          timestamp: new Date().toISOString()
        });
      });
    } catch (error) {
      errorHandler.handleCriticalError(error, 'ERROR_HANDLING_SETUP');
      throw error;
    }
  }

  start(port) {
    try {
      // Initialiser les routes après que le serveur soit prêt
      this.setupRoutes();

      this.server = this.app.listen(port, () => {
        this.logger.success(`🚀 Serveur Express démarré sur le port ${port}`);
      });

      // Gestion des erreurs du serveur
      this.server.on('error', error => {
        errorHandler.handleCriticalError(error, 'SERVER_ERROR');
        this.logger.error(`Erreur du serveur Express: ${error.message}`);
      });

      return this.server;
    } catch (error) {
      errorHandler.handleCriticalError(error, 'SERVER_START');
      throw error;
    }
  }

  async stop() {
    try {
      if (this.server) {
        return new Promise((resolve, reject) => {
          this.server.close(error => {
            if (error) {
              errorHandler.handleCriticalError(error, 'SERVER_STOP');
              reject(error);
            } else {
              this.logger.success('Serveur Express arrêté proprement');
              resolve();
            }
          });
        });
      }
    } catch (error) {
      errorHandler.handleCriticalError(error, 'SERVER_STOP');
      throw error;
    }
  }
}

export default WebServer;
