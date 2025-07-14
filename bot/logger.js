/* eslint-disable no-console */
// ========================================
// bot/logger.js - Logger performant avec rotation et formatage structuré
// ========================================

import chalk from "chalk";
import fs from "fs/promises";
import path from "path";

// Configuration du logger
const LOG_CONFIG = {
  // Niveaux de log
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    trace: 4,
  },

  // Configuration des fichiers
  file: {
    enabled: process.env.LOG_TO_FILE === "true",
    directory: "./logs",
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    compress: true,
  },

  // Performance
  batch: {
    enabled: true,
    size: 10,
    timeout: 1000, // ms
  },

  // Formatage
  format: {
    timestamp: true,
    colors: process.env.NODE_ENV !== "production",
    structured: process.env.NODE_ENV === "production",
  },
};

// Cache pour les métriques
const metrics = {
  totalLogs: 0,
  logsByLevel: new Map(),
  performance: {
    avgWriteTime: 0,
    totalWriteTime: 0,
    writeCount: 0,
  },
};

// Batch de logs pour performance
const logBatch = [];
let batchTimeout = null;

class PerformanceLogger {
  constructor() {
    this.initialize();
  }

  async initialize() {
    // Créer le dossier de logs si nécessaire
    if (LOG_CONFIG.file.enabled) {
      try {
        await fs.mkdir(LOG_CONFIG.file.directory, { recursive: true });
      } catch (error) {
        console.error("Erreur création dossier logs:", error);
      }
    }
  }

  /**
   * Formater un message de log
   */
  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      data,
      pid: process.pid,
      memory: process.memoryUsage(),
    };

    // Formatage selon l'environnement
    if (process.env.NODE_ENV === "production") {
      return JSON.stringify(logEntry);
    }

    // Formatage coloré pour le développement
    const colorMap = {
      error: chalk.red,
      warn: chalk.yellow,
      info: chalk.blue,
      debug: chalk.gray,
      trace: chalk.magenta,
    };

    const prefix = (colorMap[level] || chalk.white)(`[${level.toUpperCase()}]`);

    let formatted = `${prefix} ${message}`;
    if (data) {
      formatted += ` ${JSON.stringify(data)}`;
    }

    return formatted;
  }

  /**
   * Écrire un log de manière asynchrone
   */
  async writeLog(level, message, data = null) {
    const startTime = Date.now();
    const formattedMessage = this.formatMessage(level, message, data);

    // Mettre à jour les métriques
    this.updateMetrics(level, startTime);

    // Console output selon l'environnement
    if (process.env.NODE_ENV === "production") {
      // Production : log structuré JSON (une seule string)
      if (level === "error") {
        process.stdout.write(formattedMessage + "\n");
      } else if (level === "warn") {
        process.stdout.write(formattedMessage + "\n");
      } else {
        process.stdout.write(formattedMessage + "\n");
      }
    } else {
      // Développement : multi-arguments séparés
      const prefix = `[${level.toUpperCase()}]`;
      if (data) {
        if (level === "error") {
          process.stdout.write(
            prefix + " " + message + " " + JSON.stringify(data) + "\n"
          );
        } else if (level === "warn") {
          process.stdout.write(
            prefix + " " + message + " " + JSON.stringify(data) + "\n"
          );
        } else {
          process.stdout.write(
            prefix + " " + message + " " + JSON.stringify(data) + "\n"
          );
        }
      } else {
        if (level === "error") {
          process.stdout.write(prefix + " " + message + "\n");
        } else if (level === "warn") {
          process.stdout.write(prefix + " " + message + "\n");
        } else {
          process.stdout.write(prefix + " " + message + "\n");
        }
      }
    }

    // File output (asynchrone)
    if (LOG_CONFIG.file.enabled) {
      if (LOG_CONFIG.batch.enabled) {
        this.addToBatch(formattedMessage);
      } else {
        await this.writeToFile(formattedMessage);
      }
    }
  }

  /**
   * Ajouter à un batch pour performance
   */
  addToBatch(message) {
    logBatch.push(message);

    if (logBatch.length >= LOG_CONFIG.batch.size) {
      this.flushBatch();
    } else if (!batchTimeout) {
      batchTimeout = setTimeout(
        () => this.flushBatch(),
        LOG_CONFIG.batch.timeout
      );
    }
  }

  /**
   * Vider le batch
   */
  async flushBatch() {
    if (batchTimeout) {
      clearTimeout(batchTimeout);
      batchTimeout = null;
    }

    if (logBatch.length === 0) return;

    const messages = logBatch.splice(0);
    const content = `${messages.join("\n")}\n`;

    await this.writeToFile(content);
  }

  /**
   * Écrire dans un fichier avec rotation
   */
  async writeToFile(content) {
    try {
      const filename = this.getCurrentLogFile();
      const fullPath = path.join(LOG_CONFIG.file.directory, filename);

      await fs.appendFile(fullPath, content);

      // Vérifier la taille du fichier
      const { size } = await fs.stat(fullPath);
      if (size > LOG_CONFIG.file.maxSize) {
        await this.rotateLogFile(filename);
      }
    } catch (error) {
      await this.writeLog("error", "Erreur écriture log:", error);
    }
  }

  /**
   * Obtenir le nom du fichier de log actuel
   */
  getCurrentLogFile() {
    const date = new Date();
    const [dateStr] = date.toISOString().split("T");
    return `bot-${dateStr}.log`;
  }

  /**
   * Rotation des fichiers de log
   */
  async rotateLogFile(currentFile) {
    try {
      const baseName = currentFile.replace(".log", "");
      const timestamp = Date.now();
      const newName = `${baseName}-${timestamp}.log`;

      await fs.rename(
        path.join(LOG_CONFIG.file.directory, currentFile),
        path.join(LOG_CONFIG.file.directory, newName)
      );

      // Compresser si activé
      if (LOG_CONFIG.file.compress) {
        // TODO: Implémenter la compression
      }

      // Nettoyer les anciens fichiers
      await this.cleanOldLogs();
    } catch (error) {
      await this.writeLog("error", "Erreur rotation logs:", error);
    }
  }

  /**
   * Nettoyer les anciens fichiers de log
   */
  async cleanOldLogs() {
    try {
      const files = await fs.readdir(LOG_CONFIG.file.directory);
      const logFiles = files.filter((f) => f.endsWith(".log")).sort();

      if (logFiles.length > LOG_CONFIG.file.maxFiles) {
        const toDelete = logFiles.slice(
          0,
          logFiles.length - LOG_CONFIG.file.maxFiles
        );

        for (const file of toDelete) {
          await fs.unlink(path.join(LOG_CONFIG.file.directory, file));
        }
      }
    } catch (error) {
      await this.writeLog("error", "Erreur nettoyage logs:", error);
    }
  }

  /**
   * Mettre à jour les métriques
   */
  updateMetrics(level, startTime) {
    metrics.totalLogs++;
    metrics.logsByLevel.set(level, (metrics.logsByLevel.get(level) || 0) + 1);

    const writeTime = Date.now() - startTime;
    metrics.performance.totalWriteTime += writeTime;
    metrics.performance.writeCount++;
    metrics.performance.avgWriteTime =
      metrics.performance.totalWriteTime / metrics.performance.writeCount;
  }

  /**
   * Obtenir les métriques du logger
   */
  getMetrics() {
    return {
      ...metrics,
      logsByLevel: Object.fromEntries(metrics.logsByLevel),
      uptime: Date.now() - this.startTime,
    };
  }

  // Méthodes de log principales
  async error(msg, data = null) {
    await this.writeLog("error", msg, data);
  }

  async warn(msg, data = null) {
    await this.writeLog("warn", msg, data);
  }

  async info(msg, data = null) {
    await this.writeLog("info", msg, data);
  }

  async debug(msg, data = null) {
    await this.writeLog("debug", msg, data);
  }

  async trace(msg, data = null) {
    await this.writeLog("trace", msg, data);
  }

  // Méthodes spécialisées (compatibilité)
  async success(msg, data = null) {
    await this.writeLog("info", `✅ ${msg}`, data);
  }

  async infocmd(msg, data = null) {
    await this.writeLog("info", `📡 CMD: ${msg}`, data);
  }

  async custom(label, msg, _color = "white", data = null) {
    await this.writeLog("info", `[${label}] ${msg}`, data);
  }

  // Sections et séparateurs
  async section(title) {
    const separator = "━".repeat(30);
    await this.writeLog("info", `\n${separator}`);
    await this.writeLog("info", ` ${title}`);
    await this.writeLog("info", `${separator}`);
  }

  async sectionStart(title) {
    await this.writeLog("info", "\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    await this.writeLog("info", `┃ ${title}`);
    await this.writeLog("info", "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  }

  async summary(text) {
    await this.writeLog("info", `📌 Résumé : ${text}`);
  }

  // Méthodes pour le bot
  async bot(msg, data = null) {
    await this.writeLog("info", `🤖 BOT: ${msg}`, data);
  }

  async command(msg, data = null) {
    await this.writeLog("info", `⚡ CMD: ${msg}`, data);
  }

  async event(msg, data = null) {
    await this.writeLog("info", `📡 EVT: ${msg}`, data);
  }

  async task(msg, data = null) {
    await this.writeLog("info", `🔄 TASK: ${msg}`, data);
  }

  async api(msg, data = null) {
    await this.writeLog("info", `🌐 API: ${msg}`, data);
  }

  // Méthodes de compatibilité (synchrone pour les cas critiques)
  errorSync(msg, data = null) {
    const formatted = this.formatMessage("error", msg, data);
    process.stdout.write(formatted + "\n");
  }

  warnSync(msg, data = null) {
    const formatted = this.formatMessage("warn", msg, data);
    process.stdout.write(formatted + "\n");
  }

  infoSync(msg, data = null) {
    const formatted = this.formatMessage("info", msg, data);
    process.stdout.write(formatted + "\n");
  }
}

// Instance singleton
const logger = new PerformanceLogger();

// Méthodes de compatibilité pour les imports existants
export default logger;

