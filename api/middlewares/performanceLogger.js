// ========================================
// api/middlewares/performanceLogger.js - Middleware de logging performant
// ========================================

import logger from '../../bot/logger.js';

/**
 * Middleware de logging performant pour l'API
 */
export function performanceLogger () {
  return async (req, res, next) => {
    const startTime = Date.now();
    const requestId = generateRequestId();

    // Ajouter l'ID de requête aux objets
    req.requestId = requestId;
    res.requestId = requestId;

    // Log de la requête entrante
    await logger.info('API Request Started', {
      requestId,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    // Intercepter la réponse
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;

    res.send = function (data) {
      logResponse(req, res, startTime, requestId, data);
      return originalSend.call(this, data);
    };

    res.json = function (data) {
      logResponse(req, res, startTime, requestId, data);
      return originalJson.call(this, data);
    };

    res.end = function (data) {
      logResponse(req, res, startTime, requestId, data);
      return originalEnd.call(this, data);
    };

    next();
  };
}

/**
 * Logger la réponse de l'API
 */
async function logResponse (req, res, startTime, requestId, data) {
  const duration = Date.now() - startTime;
  const status = res.statusCode;
  const level = status >= 400 ? 'warn' : 'info';

  const logData = {
    requestId,
    method: req.method,
    url: req.url,
    statusCode: status,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString(),
    responseSize: data ? JSON.stringify(data).length : 0
  };

  // Ajouter des métriques de performance
  if (global.metricsCollector) {
    global.metricsCollector.recordApiRequest(
      req.method,
      req.url,
      status,
      duration
    );
  }

  await logger[level]('API Request Completed', logData);
}

/**
 * Générer un ID de requête unique
 */
function generateRequestId () {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Middleware pour les erreurs d'API
 */
export function errorLogger () {
  return async (error, req, res, next) => {
    const requestId = req.requestId || 'unknown';

    await logger.error('API Error', {
      requestId,
      method: req.method,
      url: req.url,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      timestamp: new Date().toISOString()
    });

    next(error);
  };
}

/**
 * Middleware pour les métriques de performance
 */
export function performanceMetrics () {
  return (req, res, next) => {
    const startTime = process.hrtime.bigint();

    res.on('finish', () => {
      const duration = Number(process.hrtime.bigint() - startTime) / 1000000; // en ms

      // Enregistrer les métriques
      if (global.metricsCollector) {
        global.metricsCollector.recordApiMetrics({
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          timestamp: Date.now()
        });
      }
    });

    next();
  };
}

export default {
  performanceLogger,
  errorLogger,
  performanceMetrics
};
