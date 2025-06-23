// ========================================
// utils/centralizedLogger.js - Logging centralisé avancé
// ========================================

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import logger from './logger.js';

class CentralizedLogger {
  constructor() {
    this.logDir = './logs';
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.maxFiles = 5;
    this.rotationInterval = 24 * 60 * 60 * 1000; // 24 heures

    this.currentLogFile = null;
    this.currentFileSize = 0;
    this.lastRotation = Date.now();

    this.logBuffer = [];
    this.bufferSize = 100;
    this.flushInterval = 5000; // 5 secondes

    this.externalServices = [];

    this.init();
  }

  /**
   * Initialiser le système de logging
   */
  async init() {
    try {
      // Créer le répertoire de logs s'il n'existe pas
      await this.ensureLogDirectory();

      // Créer le fichier de log initial
      await this.createNewLogFile();

      // Démarrer le flush automatique
      this.startAutoFlush();

      // Démarrer la rotation automatique
      this.startAutoRotation();

      logger.info('📝 Système de logging centralisé initialisé');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation du logging centralisé:', error);
    }
  }

  /**
   * S'assurer que le répertoire de logs existe
   */
  async ensureLogDirectory() {
    try {
      await fs.access(this.logDir);
    } catch {
      await fs.mkdir(this.logDir, { recursive: true });
    }
  }

  /**
   * Créer un nouveau fichier de log
   */
  async createNewLogFile() {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `soundshine-${timestamp}-${Date.now()}.log`;
    const filepath = path.join(this.logDir, filename);

    this.currentLogFile = filepath;
    this.currentFileSize = 0;

    // Créer le fichier s'il n'existe pas
    try {
      await fs.access(filepath);
    } catch {
      await fs.writeFile(filepath, '');
    }

    logger.info(`Nouveau fichier de log créé: ${filename}`);
  }

  /**
   * Ajouter un service externe
   */
  addExternalService(service) {
    this.externalServices.push(service);
    logger.info(`Service externe ajouté: ${service.name}`);
  }

  /**
   * Envoyer les logs vers les services externes
   */
  async sendToExternalServices(logEntry) {
    const promises = this.externalServices.map(async (service) => {
      try {
        await service.send(logEntry);
      } catch (error) {
        logger.error(`Erreur lors de l'envoi vers ${service.name}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Écrire un log
   */
  async writeLog(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      meta,
      pid: process.pid,
      hostname: os.hostname()
    };

    // Ajouter au buffer
    this.logBuffer.push(logEntry);

    // Envoyer vers les services externes
    await this.sendToExternalServices(logEntry);

    // Vérifier si le buffer doit être vidé
    if (this.logBuffer.length >= this.bufferSize) {
      await this.flushBuffer();
    }

    // Vérifier si la rotation est nécessaire
    await this.checkRotation();
  }

  /**
   * Vider le buffer vers le fichier
   */
  async flushBuffer() {
    if (this.logBuffer.length === 0) return;

    try {
      const logLines = this.logBuffer.map(entry =>
        JSON.stringify(entry)
      ).join('\n') + '\n';

      await fs.appendFile(this.currentLogFile, logLines);
      this.currentFileSize += Buffer.byteLength(logLines, 'utf8');

      this.logBuffer = [];
    } catch (error) {
      logger.error('Erreur lors du flush du buffer:', error);
    }
  }

  /**
   * Vérifier si la rotation est nécessaire
   */
  async checkRotation() {
    const now = Date.now();
    const shouldRotate =
      this.currentFileSize > this.maxFileSize ||
      (now - this.lastRotation) > this.rotationInterval;

    if (shouldRotate) {
      await this.rotateLogs();
    }
  }

  /**
   * Effectuer la rotation des logs
   */
  async rotateLogs() {
    try {
      // Vider le buffer avant la rotation
      await this.flushBuffer();

      // Créer un nouveau fichier de log
      await this.createNewLogFile();

      // Nettoyer les anciens fichiers
      await this.cleanupOldLogs();

      this.lastRotation = Date.now();

      logger.info('Rotation des logs effectuée');
    } catch (error) {
      logger.error('Erreur lors de la rotation des logs:', error);
    }
  }

  /**
   * Nettoyer les anciens fichiers de logs
   */
  async cleanupOldLogs() {
    try {
      const files = await fs.readdir(this.logDir);
      const logFilesPromises = files
        .filter(file => file.endsWith('.log'))
        .map(async file => {
          const filePath = path.join(this.logDir, file);
          const stats = await fs.stat(filePath);
          return {
            name: file,
            path: filePath,
            stats
          };
        });

      const logFiles = await Promise.all(logFilesPromises);
      logFiles.sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

      // Supprimer les fichiers en excès
      if (logFiles.length > this.maxFiles) {
        const toDelete = logFiles.slice(this.maxFiles);

        for (const file of toDelete) {
          await fs.unlink(file.path);
          logger.info(`Ancien fichier de log supprimé: ${file.name}`);
        }
      }
    } catch (error) {
      logger.error('Erreur lors du nettoyage des anciens logs:', error);
    }
  }

  /**
   * Démarrer le flush automatique
   */
  startAutoFlush() {
    setInterval(async () => {
      await this.flushBuffer();
    }, this.flushInterval);
  }

  /**
   * Démarrer la rotation automatique
   */
  startAutoRotation() {
    setInterval(async () => {
      await this.checkRotation();
    }, 60 * 1000); // Vérifier toutes les minutes
  }

  /**
   * Méthodes de logging par niveau
   */
  async info(message, meta = {}) {
    await this.writeLog('info', message, meta);
  }

  async warn(message, meta = {}) {
    await this.writeLog('warn', message, meta);
  }

  async error(message, meta = {}) {
    await this.writeLog('error', message, meta);
  }

  async debug(message, meta = {}) {
    await this.writeLog('debug', message, meta);
  }

  /**
   * Obtenir les logs récents
   */
  async getRecentLogs(limit = 100, level = null) {
    try {
      const logFiles = await this.getLogFiles();
      const logs = [];

      for (const file of logFiles) {
        const content = await fs.readFile(file, 'utf8');
        const lines = content.trim().split('\n').filter(line => line);

        for (const line of lines) {
          try {
            const logEntry = JSON.parse(line);
            if (!level || logEntry.level === level) {
              logs.push(logEntry);
            }
          } catch (e) {
            // Ignorer les lignes malformées
          }
        }
      }

      return logs
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
    } catch (error) {
      logger.error('Erreur lors de la récupération des logs récents:', error);
      return [];
    }
  }

  /**
   * Obtenir la liste des fichiers de logs
   */
  async getLogFiles() {
    try {
      const files = await fs.readdir(this.logDir);
      return files
        .filter(file => file.endsWith('.log'))
        .map(file => path.join(this.logDir, file))
        .sort()
        .reverse();
    } catch (error) {
      logger.error('Erreur lors de la récupération des fichiers de logs:', error);
      return [];
    }
  }

  /**
   * Rechercher dans les logs
   */
  async searchLogs(query, options = {}) {
    const {
      level = null,
      startDate = null,
      endDate = null,
      limit = 100
    } = options;

    try {
      const logs = await this.getRecentLogs(1000, level);

      return logs
        .filter(log => {
          // Filtre par date
          if (startDate && new Date(log.timestamp) < new Date(startDate)) {
            return false;
          }
          if (endDate && new Date(log.timestamp) > new Date(endDate)) {
            return false;
          }

          // Filtre par contenu
          if (query) {
            const searchText = `${log.message} ${JSON.stringify(log.meta)}`.toLowerCase();
            return searchText.includes(query.toLowerCase());
          }

          return true;
        })
        .slice(0, limit);
    } catch (error) {
      logger.error('Erreur lors de la recherche dans les logs:', error);
      return [];
    }
  }

  /**
   * Obtenir des statistiques des logs
   */
  async getLogStats() {
    try {
      const logs = await this.getRecentLogs(10000);
      const stats = {
        total: logs.length,
        byLevel: {},
        byHour: {},
        errors: logs.filter(log => log.level === 'error').length,
        warnings: logs.filter(log => log.level === 'warn').length
      };

      logs.forEach(log => {
        // Par niveau
        stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;

        // Par heure
        const hour = new Date(log.timestamp).getHours();
        stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
      });

      return stats;
    } catch (error) {
      logger.error('Erreur lors du calcul des statistiques des logs:', error);
      return {};
    }
  }
}

// Instance singleton
const centralizedLogger = new CentralizedLogger();

export default centralizedLogger;
