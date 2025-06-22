// ========================================
// api/routes/alerts.js - Routes pour les alertes
// ========================================

import express from 'express';
import alertManager from '../../utils/alerts.js';

const router = express.Router();

/**
 * GET /v1/alerts
 * Obtenir toutes les alertes actives
 */
router.get('/', async (req, res) => {
  try {
    const { type, severity, limit = 50 } = req.query;
    
    let alerts = alertManager.getActiveAlerts();
    
    // Filtrer par type si spécifié
    if (type) {
      alerts = alerts.filter(alert => alert.type === type);
    }
    
    // Filtrer par sévérité si spécifiée
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }
    
    // Limiter le nombre de résultats
    alerts = alerts.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        alerts,
        total: alerts.length,
        filters: {
          type: type || 'all',
          severity: severity || 'all',
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des alertes',
      message: error.message
    });
  }
});

/**
 * GET /v1/alerts/stats
 * Obtenir les statistiques des alertes
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = alertManager.getAlertStats();
    
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
 * GET /v1/alerts/:type
 * Obtenir les alertes par type
 */
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 50 } = req.query;
    
    const alerts = alertManager.getAlertsByType(type).slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        alerts,
        total: alerts.length,
        type,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des alertes par type',
      message: error.message
    });
  }
});

/**
 * POST /v1/alerts
 * Créer une nouvelle alerte
 */
router.post('/', async (req, res) => {
  try {
    const { type, severity, message, data = {} } = req.body;
    
    // Validation des paramètres requis
    if (!type || !severity || !message) {
      return res.status(400).json({
        success: false,
        error: 'Paramètres requis: type, severity, message'
      });
    }
    
    // Validation de la sévérité
    const validSeverities = ['info', 'warning', 'error', 'critical'];
    if (!validSeverities.includes(severity)) {
      return res.status(400).json({
        success: false,
        error: 'Sévérité invalide. Valeurs autorisées: info, warning, error, critical'
      });
    }
    
    // Créer l'alerte
    const alertId = alertManager.createAlert(type, severity, message, data);
    
    res.json({
      success: true,
      message: 'Alerte créée avec succès',
      data: {
        alertId,
        type,
        severity,
        message,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de l\'alerte',
      message: error.message
    });
  }
});

/**
 * PUT /v1/alerts/:alertId/resolve
 * Marquer une alerte comme résolue
 */
router.put('/:alertId/resolve', async (req, res) => {
  try {
    const { alertId } = req.params;
    
    alertManager.resolveAlert(alertId);
    
    res.json({
      success: true,
      message: 'Alerte marquée comme résolue',
      data: {
        alertId,
        resolvedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la résolution de l\'alerte',
      message: error.message
    });
  }
});

/**
 * PUT /v1/alerts/thresholds
 * Mettre à jour les seuils d'alerte
 */
router.put('/thresholds', async (req, res) => {
  try {
    const thresholds = req.body;
    
    // Validation des seuils
    const validThresholds = ['ping', 'memory', 'errors', 'uptime', 'apiLatency'];
    const providedThresholds = Object.keys(thresholds);
    
    for (const threshold of providedThresholds) {
      if (!validThresholds.includes(threshold)) {
        return res.status(400).json({
          success: false,
          error: `Seuil invalide: ${threshold}. Valeurs autorisées: ${validThresholds.join(', ')}`
        });
      }
      
      if (typeof thresholds[threshold] !== 'number' || thresholds[threshold] < 0) {
        return res.status(400).json({
          success: false,
          error: `Valeur invalide pour ${threshold}: doit être un nombre positif`
        });
      }
    }
    
    // Mettre à jour les seuils
    alertManager.setThresholds(thresholds);
    
    res.json({
      success: true,
      message: 'Seuils d\'alerte mis à jour',
      data: {
        updatedThresholds: thresholds,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour des seuils',
      message: error.message
    });
  }
});

/**
 * GET /v1/alerts/thresholds
 * Obtenir les seuils d'alerte actuels
 */
router.get('/thresholds', async (req, res) => {
  try {
    const thresholds = alertManager.thresholds;
    
    res.json({
      success: true,
      data: {
        thresholds,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des seuils',
      message: error.message
    });
  }
});

/**
 * DELETE /v1/alerts
 * Nettoyer les anciennes alertes
 */
router.delete('/', async (req, res) => {
  try {
    const { maxAge = 24 * 60 * 60 * 1000 } = req.query; // 24 heures par défaut
    
    const beforeCount = alertManager.getAlertStats().total;
    alertManager.cleanupOldAlerts(parseInt(maxAge));
    const afterCount = alertManager.getAlertStats().total;
    
    res.json({
      success: true,
      message: 'Nettoyage des anciennes alertes effectué',
      data: {
        cleanedCount: beforeCount - afterCount,
        remainingCount: afterCount,
        maxAge: parseInt(maxAge)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors du nettoyage des alertes',
      message: error.message
    });
  }
});

/**
 * POST /v1/alerts/test
 * Tester le système d'alertes
 */
router.post('/test', async (req, res) => {
  try {
    const { type = 'test', severity = 'info', message = 'Test d\'alerte' } = req.body;
    
    const alertId = alertManager.createAlert(type, severity, message, {
      test: true,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Test d\'alerte envoyé avec succès',
      data: {
        alertId,
        type,
        severity,
        message,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors du test d\'alerte',
      message: error.message
    });
  }
});

export default function(client, logger) {
  return router;
} 