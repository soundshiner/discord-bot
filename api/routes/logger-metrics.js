// ========================================
// api/routes/logger-metrics.js - Endpoint pour les métriques du logger
// ========================================

import express from 'express';
import logger from '../../bot/logger.js';

const router = express.Router();

/**
 * GET /v1/logger/metrics
 * Obtenir les métriques du logger
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = logger.getMetrics();

    res.json({
      success: true,
      data: {
        metrics,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des métriques du logger',
      message: error.message
    });
  }
});

/**
 * GET /v1/logger/status
 * Obtenir le statut du logger
 */
router.get('/status', async (req, res) => {
  try {
    const status = {
      enabled: true,
      level: process.env.LOG_LEVEL || 'info',
      fileLogging: process.env.LOG_TO_FILE === 'true',
      batchEnabled: process.env.LOG_BATCH !== 'false',
      structured: process.env.LOG_STRUCTURED === 'true',
      colors: process.env.NODE_ENV !== 'production',
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du statut du logger',
      message: error.message
    });
  }
});

/**
 * POST /v1/logger/test
 * Tester le logger avec différents niveaux
 */
router.post('/test', async (req, res) => {
  try {
    const {
      level = 'info',
      message = 'Test log message',
      data = null
    } = req.body;

    // Valider le niveau de log
    const validLevels = ['error', 'warn', 'info', 'debug', 'trace'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({
        success: false,
        error: 'Niveau de log invalide',
        validLevels
      });
    }

    // Envoyer un log de test
    await logger[level](`[TEST] ${message}`, data);

    res.json({
      success: true,
      message: 'Log de test envoyé avec succès',
      data: {
        level,
        message: `[TEST] ${message}`,
        data,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors du test du logger',
      message: error.message
    });
  }
});

/**
 * GET /v1/logger/config
 * Obtenir la configuration du logger
 */
router.get('/config', async (req, res) => {
  try {
    const config = {
      levels: {
        error: 0,
        warn: 1,
        info: 2,
        debug: 3,
        trace: 4
      },
      file: {
        enabled: process.env.LOG_TO_FILE === 'true',
        directory: process.env.LOG_DIRECTORY || './logs',
        maxSize: process.env.LOG_MAX_SIZE || '10MB',
        maxFiles: process.env.LOG_MAX_FILES || 5,
        compress: process.env.LOG_COMPRESS !== 'false'
      },
      batch: {
        enabled: process.env.LOG_BATCH !== 'false',
        size: process.env.LOG_BATCH_SIZE || 10,
        timeout: process.env.LOG_BATCH_TIMEOUT || 1000
      },
      format: {
        timestamp: process.env.LOG_TIMESTAMP !== 'false',
        colors: process.env.NODE_ENV !== 'production',
        structured: process.env.NODE_ENV === 'production'
      }
    };

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la configuration',
      message: error.message
    });
  }
});

/**
 * POST /v1/logger/flush
 * Forcer l'écriture des logs en batch
 */
router.post('/flush', async (req, res) => {
  try {
    // Forcer le flush du batch si disponible
    if (logger.flushBatch) {
      await logger.flushBatch();
    }

    res.json({
      success: true,
      message: 'Batch de logs vidé avec succès',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors du flush des logs',
      message: error.message
    });
  }
});

export default router;
