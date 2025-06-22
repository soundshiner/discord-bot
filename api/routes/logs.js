// ========================================
// api/routes/logs.js - Routes pour les logs centralisés
// ========================================

import express from 'express';
import centralizedLogger from '../../utils/centralizedLogger.js';

const router = express.Router();

/**
 * GET /v1/logs
 * Obtenir les logs récents
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 100, level, search } = req.query;
    
    let logs;
    if (search) {
      logs = await centralizedLogger.searchLogs(search, {
        level: level || null,
        limit: parseInt(limit)
      });
    } else {
      logs = await centralizedLogger.getRecentLogs(parseInt(limit), level || null);
    }

    res.json({
      success: true,
      data: {
        logs,
        total: logs.length,
        filters: {
          level: level || 'all',
          limit: parseInt(limit),
          search: search || null
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des logs',
      message: error.message
    });
  }
});

/**
 * GET /v1/logs/stats
 * Obtenir les statistiques des logs
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await centralizedLogger.getLogStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques',
      message: error.message
    });
  }
});

/**
 * GET /v1/logs/files
 * Obtenir la liste des fichiers de logs
 */
router.get('/files', async (req, res) => {
  try {
    const files = await centralizedLogger.getLogFiles();
    
    res.json({
      success: true,
      data: {
        files: files.map(file => ({
          name: file.split('/').pop(),
          path: file,
          size: 'N/A' // Taille pourrait être ajoutée si nécessaire
        })),
        total: files.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des fichiers de logs',
      message: error.message
    });
  }
});

/**
 * GET /v1/logs/search
 * Rechercher dans les logs
 */
router.get('/search', async (req, res) => {
  try {
    const { 
      query, 
      level, 
      startDate, 
      endDate, 
      limit = 100 
    } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Paramètre "query" requis pour la recherche'
      });
    }
    
    const logs = await centralizedLogger.searchLogs(query, {
      level: level || null,
      startDate: startDate || null,
      endDate: endDate || null,
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: {
        logs,
        total: logs.length,
        search: {
          query,
          level: level || 'all',
          startDate: startDate || null,
          endDate: endDate || null,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recherche dans les logs',
      message: error.message
    });
  }
});

/**
 * POST /v1/logs
 * Écrire un nouveau log
 */
router.post('/', async (req, res) => {
  try {
    const { level = 'info', message, meta = {} } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Paramètre "message" requis'
      });
    }
    
    // Valider le niveau de log
    const validLevels = ['debug', 'info', 'warn', 'error'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({
        success: false,
        error: 'Niveau de log invalide. Valeurs autorisées: debug, info, warn, error'
      });
    }
    
    // Écrire le log
    await centralizedLogger[level](message, meta);
    
    res.json({
      success: true,
      message: 'Log écrit avec succès',
      data: {
        level,
        message,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'écriture du log',
      message: error.message
    });
  }
});

/**
 * DELETE /v1/logs
 * Nettoyer les anciens logs (admin seulement)
 */
router.delete('/', async (req, res) => {
  try {
    const { maxAge = 24 * 60 * 60 * 1000 } = req.query; // 24 heures par défaut
    
    // Cette fonctionnalité pourrait être protégée par authentification
    // Pour l'instant, on l'expose directement
    
    await centralizedLogger.cleanupOldLogs(parseInt(maxAge));
    
    res.json({
      success: true,
      message: 'Nettoyage des anciens logs effectué',
      data: {
        maxAge: parseInt(maxAge)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors du nettoyage des logs',
      message: error.message
    });
  }
});

export default function(client, logger) {
  return router;
} 