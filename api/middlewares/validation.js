// ========================================
// api/middlewares/validation.js - Middleware de validation et sanitization
// ========================================

import { z } from 'zod';
import logger from '../../bot/logger.js';

// Schémas de validation
const userInputSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  artist: z.string().min(1).max(100).trim(),
  url: z.string().url().optional(),
  genre: z.string().max(50).optional(),
  userId: z.string().min(17).max(20), // Discord user ID
  username: z.string().min(1).max(32).trim()
});

const playlistSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).optional(),
  tracks: z.array(z.string().url()).min(1).max(100)
});

const apiKeySchema = z.object({
  'x-api-key': z.string().min(32).max(64)
});

// Fonction de sanitization
function sanitizeInput (input) {
  if (typeof input === 'string') {
    return input
      .trim()
      .replace(/[<>]/g, '') // Supprimer les balises HTML basiques
      .replace(/javascript:/gi, '') // Supprimer les protocoles dangereux
      .replace(/on\w+=/gi, ''); // Supprimer les événements JavaScript
  }
  return input;
}

// Middleware de validation générique
export function validateRequest (schema) {
  return (req, res, next) => {
    try {
      const dataToValidate = {
        ...req.body,
        ...req.query,
        ...req.params
      };

      // Sanitizer les entrées
      const sanitizedData = {};
      for (const [key, value] of Object.entries(dataToValidate)) {
        sanitizedData[key] = sanitizeInput(value);
      }

      // Valider avec Zod
      const validatedData = schema.parse(sanitizedData);

      // Remplacer les données originales
      req.body = { ...req.body, ...validatedData };
      req.query = { ...req.query, ...validatedData };
      req.params = { ...req.params, ...validatedData };

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        logger.warn('Validation échouée:', {
          path: req.path,
          method: req.method,
          errors: validationErrors,
          ip: req.ip
        });

        return res.status(400).json({
          error: 'Données invalides',
          details: validationErrors,
          timestamp: new Date().toISOString()
        });
      }

      logger.error('Erreur de validation:', error);
      return res.status(500).json({
        error: 'Erreur interne de validation',
        timestamp: new Date().toISOString()
      });
    }
  };
}

// Middleware de validation d'API key
export function validateApiKey (req, res, next) {
  try {
    const apiKey
      = req.headers['x-api-key']
      || req.headers.authorization?.replace('Bearer ', '');

    if (!apiKey) {
      logger.warn('Tentative d\'accès API sans clé', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });
      return res.status(401).json({
        error: 'Clé API manquante',
        timestamp: new Date().toISOString()
      });
    }

    // Valider le format de la clé API
    const { 'x-api-key': validApiKey } = apiKeySchema.parse({
      'x-api-key': apiKey
    });

    // Liste des clés API autorisées (à déplacer dans .env en production)
    const validApiKeys = new Set(
      [
        process.env.ADMIN_API_KEY,
        process.env.BOT_API_KEY,
        process.env.API_TOKEN
      ].filter(Boolean)
    ); // Filtrer les valeurs undefined

    // Vérifier si la clé est autorisée
    if (!validApiKeys.has(validApiKey)) {
      logger.warn('Tentative d\'accès API avec clé invalide', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        keyPrefix: `${validApiKey.substring(0, 8)  }...`
      });
      return res.status(401).json({
        error: 'Clé API invalide',
        timestamp: new Date().toISOString()
      });
    }

    // Log de l'accès autorisé
    logger.info('Accès API autorisé', {
      ip: req.ip,
      path: req.path,
      keyPrefix: `${validApiKey.substring(0, 8)  }...`
    });

    req.apiKey = validApiKey;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Format de clé API invalide', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });
      return res.status(401).json({
        error: 'Format de clé API invalide',
        timestamp: new Date().toISOString()
      });
    }

    logger.error('Erreur de validation API key:', error);
    return res.status(500).json({
      error: 'Erreur interne',
      timestamp: new Date().toISOString()
    });
  }
}

// Middleware de validation de rate limiting personnalisé
export function validateRateLimit (
  maxRequests = 100,
  windowMs = 15 * 60 * 1000
) {
  const requests = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Nettoyer les anciennes requêtes
    if (requests.has(ip)) {
      requests.set(
        ip,
        requests.get(ip).filter((timestamp) => timestamp > windowStart)
      );
    } else {
      requests.set(ip, []);
    }

    const userRequests = requests.get(ip);

    if (userRequests.length >= maxRequests) {
      logger.warn(`Rate limit dépassé pour IP: ${ip}`);
      return res.status(429).json({
        error: 'Trop de requêtes',
        retryAfter: Math.ceil(windowMs / 1000),
        timestamp: new Date().toISOString()
      });
    }

    userRequests.push(now);
    next();
  };
}

// Middleware de validation de contenu
export function validateContentType (allowedTypes = ['application/json']) {
  return (req, res, next) => {
    const contentType = req.headers['content-type'];

    if (
      req.method === 'POST'
      || req.method === 'PUT'
      || req.method === 'PATCH'
    ) {
      if (
        !contentType
        || !allowedTypes.some((type) => contentType.includes(type))
      ) {
        return res.status(415).json({
          error: 'Type de contenu non supporté',
          allowed: allowedTypes,
          received: contentType,
          timestamp: new Date().toISOString()
        });
      }
    }

    next();
  };
}

// Middleware de validation de taille de payload
export function validatePayloadSize (maxSize = '10mb') {
  const maxSizeBytes = parseSize(maxSize);

  return (req, res, next) => {
    const contentLength = parseInt(req.get('Content-Length') || '0', 10);

    if (contentLength && contentLength > maxSizeBytes) {
      return res.status(413).json({
        error: 'Payload trop volumineux',
        maxSize,
        received: formatBytes(contentLength),
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
}

// Fonctions utilitaires
function parseSize (size) {
  const units = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  };

  const match = size.toLowerCase().match(/^(\d+)([kmg]?b)$/);
  if (!match) return 1024 * 1024; // 1MB par défaut

  const [, value, unit] = match;
  return parseInt(value, 10) * (units[unit] || units['b']);
}

function formatBytes (bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Export des schémas pour utilisation directe
export { userInputSchema, playlistSchema, apiKeySchema };

