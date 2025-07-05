// ========================================
// core/monitor.js - Gestion centralisée des erreurs et monitoring
// ========================================

import { MessageFlags } from 'discord.js';
import logger from '../bot/logger.js';

class Monitor {
  constructor (loggerInstance = logger) {
    this.logger = loggerInstance;
    this.errorCounts = new Map();
    this.maxErrorsPerMinute = 10;
  }

  /**
   * Gère les erreurs de commandes Discord
   */
  async handleCommandError (error, interaction) {
    const errorId = this.generateErrorId();
    const errorType = this.categorizeError(error);

    // Log l'erreur
    this.logger.error(
      `[${errorId}] Erreur commande ${interaction?.commandName || 'unknown'}: ${
        error.message
      }`
    );

    // Compteur d'erreurs par minute
    this.incrementErrorCount(errorType);

    // Réponse à l'utilisateur
    if (interaction && !interaction.replied && !interaction.deferred) {
      const userMessage = this.getUserFriendlyMessage(errorType);
      await interaction.reply({
        content: userMessage,
        flags: MessageFlags.Ephemeral
      });
    } else if (interaction && (interaction.replied || interaction.deferred)) {
      const userMessage = this.getUserFriendlyMessage(errorType);
      await interaction.editReply({
        content: userMessage
      });
    }

    // Alert si trop d'erreurs
    if (this.shouldAlert(errorType)) {
      this.sendAlert(errorType, errorId);
    }
  }

  /**
   * Gère les erreurs API
   */
  handleApiError (error, req, res) {
    if (typeof res.status === 'function' && typeof res.json === 'function') {
      // Cas normal : on répond via Express
      const errorId = this.generateErrorId();
      const errorType = this.categorizeError(error);
      this.logger.error(
        `[${errorId}] Erreur API ${req?.method} ${req?.path}: ${error.message}`
      );
      const statusCode = this.getHttpStatusCode(errorType);
      const response = {
        error: this.getUserFriendlyMessage(errorType),
        errorId,
        timestamp: new Date().toISOString()
      };
      res.status(statusCode).json(response);
    } else {
      // Cas anormal : log, mais ne bloque pas
      this.logger.error(
        'handleApiError: res is not a valid Express response object'
      );
      this.logger.error('req.url:', req?.url);
      this.logger.error('res type:', typeof res, res);
      this.logger.error(new Error().stack);

      // Tente d'envoyer une réponse basique si res.writeHead existe (cas Node pur)
      if (
        typeof res?.writeHead === 'function'
        && typeof res?.end === 'function'
      ) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: 'Internal server error',
            timestamp: new Date().toISOString()
          })
        );
      }
    }
  }

  /**
   * Gère les erreurs critiques
   */
  handleCriticalError (error, context = 'unknown') {
    const errorId = this.generateErrorId();

    this.logger.error(
      `[${errorId}] ERREUR CRITIQUE [${context}]: ${error.message}`
    );
    this.logger.error(`Stack trace: ${error.stack}`);

    // Notification immédiate
    this.sendCriticalAlert(error, errorId, context);

    // Arrêt gracieux si nécessaire
    if (this.shouldShutdown(error)) {
      process.exit(1);
    }
  }

  /**
   * Gère les erreurs de tâches planifiées ou asynchrones
   */
  handleTaskError (error, context = 'TASK') {
    const errorId = this.generateErrorId();
    this.logger.error(
      `[${errorId}] ERREUR TÂCHE [${context}]: ${error.message}`
    );
    if (this.shouldAlert('TASK')) {
      this.sendAlert('TASK', errorId);
    }
  }

  /**
   * Catégorise les erreurs
   */
  categorizeError (error) {
    const msg = typeof error.message === 'string' ? error.message : '';
    if (error.code === 'ECONNREFUSED') return 'NETWORK';
    if (error.code === 'ENOTFOUND') return 'NETWORK';
    if (msg.includes('permission')) return 'PERMISSION';
    if (msg.includes('token')) return 'AUTH';
    if (msg.includes('rate limit')) return 'RATE_LIMIT';
    if (msg.includes('voice')) return 'VOICE';
    if (msg.includes('database')) return 'DATABASE';
    return 'UNKNOWN';
  }

  /**
   * Messages utilisateur-friendly
   */
  getUserFriendlyMessage (errorType) {
    const messages = {
      NETWORK: 'Problème de connexion. Réessayez dans quelques instants.',
      PERMISSION: 'Permissions insuffisantes pour cette action.',
      AUTH: 'Erreur d\'authentification. Contactez un administrateur.',
      RATE_LIMIT: 'Trop de requêtes. Attendez un moment avant de réessayer.',
      VOICE: 'Erreur audio. Vérifiez votre connexion vocale.',
      DATABASE: 'Erreur de base de données. Réessayez plus tard.',
      UNKNOWN: 'Une erreur inattendue s\'est produite. Réessayez plus tard.'
    };

    return messages[errorType] || messages.UNKNOWN;
  }

  /**
   * Codes HTTP appropriés
   */
  getHttpStatusCode (errorType) {
    const codes = {
      NETWORK: 503,
      PERMISSION: 403,
      AUTH: 401,
      RATE_LIMIT: 429,
      VOICE: 400,
      DATABASE: 500,
      UNKNOWN: 500
    };

    return codes[errorType] || 500;
  }

  /**
   * Génère un ID d'erreur unique
   */
  generateErrorId () {
    return `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Compteur d'erreurs par minute
   */
  incrementErrorCount (errorType) {
    const now = Date.now();
    const minute = Math.floor(now / 60000);

    if (!this.errorCounts.has(errorType)) {
      this.errorCounts.set(errorType, new Map());
    }

    const typeCounts = this.errorCounts.get(errorType);
    const currentCount = typeCounts.get(minute) || 0;
    typeCounts.set(minute, currentCount + 1);

    // Nettoyer les anciennes entrées (plus de 5 minutes)
    for (const [time] of typeCounts.entries()) {
      if (now - time * 60000 > 300000) {
        typeCounts.delete(time);
      }
    }
  }

  /**
   * Détermine si une alerte doit être envoyée
   */
  shouldAlert (errorType) {
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const typeCounts = this.errorCounts.get(errorType);

    if (!typeCounts) return false;

    const currentCount = typeCounts.get(minute) || 0;
    return currentCount >= this.maxErrorsPerMinute;
  }

  /**
   * Détermine si l'application doit s'arrêter
   */
  shouldShutdown (error) {
    const criticalErrors = ['AUTH', 'DATABASE'];
    const errorType = this.categorizeError(error);
    return criticalErrors.includes(errorType);
  }

  /**
   * Envoie une alerte
   */
  sendAlert (errorType, errorId) {
    this.logger.warn(`🚨 ALERTE: Trop d'erreurs ${errorType} (${errorId})`);
    // Ici on pourrait envoyer une notification Discord, email, etc.
  }

  /**
   * Envoie une alerte critique
   */
  sendCriticalAlert (error, errorId, context) {
    this.logger.error(`🚨 ALERTE CRITIQUE [${context}]: ${errorId}`);
    // Ici on pourrait envoyer une notification immédiate
  }

  /**
   * Obtient les statistiques d'erreurs
   */
  getErrorStats () {
    const stats = {};
    for (const [errorType, typeCounts] of this.errorCounts.entries()) {
      let total = 0;
      for (const count of typeCounts.values()) {
        total += count;
      }
      stats[errorType] = total;
    }
    return stats;
  }
}

// Instance singleton
const monitor = new Monitor();

export default monitor;

// Fonction utilitaire pour les messages d'erreur API
export function getApiErrorMessage (error) {
  const monitor = new Monitor();
  return monitor.getUserFriendlyMessage(monitor.categorizeError(error));
}
