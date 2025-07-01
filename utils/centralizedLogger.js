// ========================================
// utils/unifiedLogger.js - Système de logging unifié
// ========================================
import winston from "winston";
import "winston-daily-rotate-file";
import path from "path";
import fs from "fs";
import { promises as fsPromises } from "fs";
import chalk from "chalk";

const logDir = path.resolve("logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Format JSON compatible Loki
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta,
    });
  })
);

// Format console coloré pour le développement
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const time = new Date(timestamp).toLocaleTimeString();
    return `${chalk.gray(time)} ${level}: ${message}`;
  })
);

// Transports Winston
const dailyRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, "app-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxFiles: "14d",
  maxSize: "20m",
  level: "debug",
  format: jsonFormat,
});

const errorRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, "error-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxFiles: "30d",
  maxSize: "20m",
  level: "error",
  format: jsonFormat,
});

const apiRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, "api-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxFiles: "14d",
  maxSize: "20m",
  level: "debug",
  format: jsonFormat,
});

// Logger Winston principal
const winstonLogger = winston.createLogger({
  level: "debug",
  transports: [
    dailyRotateTransport,
    errorRotateTransport,
    apiRotateTransport,
    new winston.transports.Console({
      level: "info",
      format: consoleFormat,
    }),
  ],
  exitOnError: false,
});

// ========================================
// HELPERS SPÉCIALISÉS
// ========================================

// Helper pour les sections (style console)
export const sectionStart = (title) => {
  const section = `\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n┃ ${title}\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  console.log(chalk.cyan(section));
  winstonLogger.info(`Section: ${title}`, { type: "section_start", title });
};

export const summary = (text) => {
  const summaryText = `📌 Résumé : ${text}`;
  console.log(chalk.bold.yellow(summaryText));
  winstonLogger.info(summaryText, { type: "summary", text });
};

// Helper pour les commandes Discord
export const logCommand = (command, user, guild, channel) => {
  const logData = {
    type: "discord_command",
    command,
    user: user?.username || "Unknown",
    userId: user?.id,
    guild: guild?.name || "DM",
    guildId: guild?.id,
    channel: channel?.name || "DM",
    channelId: channel?.id,
  };

  const consoleMsg = chalk.magenta(
    `[📡 CMD] ${command} by ${user?.username || "Unknown"} in ${
      guild?.name || "DM"
    }`
  );
  console.log(consoleMsg);
  winstonLogger.info(`Discord Command: ${command}`, logData);
};

// Helper pour les succès
export const logSuccess = (message, meta = {}) => {
  const consoleMsg = chalk.green(`[✔ SUCCÈS] ${message}`);
  console.log(consoleMsg);
  winstonLogger.info(`Success: ${message}`, { type: "success", ...meta });
};

// Helper pour les erreurs
export const logError = (message, meta = {}) => {
  const consoleMsg = chalk.red(`[✖ ERROR] ${message}`);
  console.error(consoleMsg);
  winstonLogger.error(`Error: ${message}`, { type: "error", ...meta });
};

// Helper pour les warnings
export const logWarn = (message, meta = {}) => {
  const consoleMsg = chalk.yellow(`[⚠ WARN] ${message}`);
  console.warn(consoleMsg);
  winstonLogger.warn(`Warning: ${message}`, { type: "warning", ...meta });
};

// Helper pour les infos générales
export const logInfo = (message, meta = {}) => {
  winstonLogger.info(message, { type: "info", ...meta });
};

// Helper pour les debug
export const logDebug = (message, meta = {}) => {
  winstonLogger.debug(message, { type: "debug", ...meta });
};

// ========================================
// HELPERS API SPÉCIALISÉS
// ========================================

// Fonction pour formater les durées
const formatDuration = (duration) => {
  if (duration < 100) return chalk.green(`${duration}ms`);
  if (duration < 500) return chalk.yellow(`${duration}ms`);
  return chalk.red(`${duration}ms`);
};

// Fonction pour formater les codes de statut
const formatStatus = (status) => {
  if (status >= 200 && status < 300) return chalk.green(status);
  if (status >= 300 && status < 400) return chalk.blue(status);
  if (status >= 400 && status < 500) return chalk.yellow(status);
  return chalk.red(status);
};

// Fonction pour formater les méthodes HTTP
const formatMethod = (method) => {
  const colors = {
    GET: chalk.blue,
    POST: chalk.green,
    PUT: chalk.yellow,
    DELETE: chalk.red,
    PATCH: chalk.magenta,
    OPTIONS: chalk.cyan,
    HEAD: chalk.gray,
  };
  const colorFn = colors[method] || chalk.white;
  return colorFn(method.padEnd(6));
};

// Log principal de requête API
export const logApiRequest = (req, res, duration) => {
  const { method, url, ip } = req;
  const status = res.statusCode;

  // Informations de la requête
  const userAgent = req.get("User-Agent") || "Unknown";
  const contentType = req.get("Content-Type") || "N/A";
  const contentLength = req.get("Content-Length") || "0";
  const referer = req.get("Referer") || "Direct";
  const queryParams = Object.keys(req.query).length;
  const bodyKeys = req.body ? Object.keys(req.body).length : 0;

  // Log détaillé avec métadonnées
  const logData = {
    type: "api_request",
    method,
    url,
    status,
    duration,
    ip,
    userAgent:
      userAgent.substring(0, 50) + (userAgent.length > 50 ? "..." : ""),
    contentType,
    contentLength,
    referer: referer.substring(0, 30) + (referer.length > 30 ? "..." : ""),
    queryParams,
    bodyKeys,
    timestamp: new Date().toISOString(),
  };

  // Log console coloré
  const consoleLog = [
    formatMethod(method),
    chalk.white(url),
    formatStatus(status),
    formatDuration(duration),
    chalk.gray(`(${ip})`),
    chalk.cyan(`[${queryParams} params, ${bodyKeys} body keys]`),
  ].join(" ");

  // Log dans le fichier API spécifique
  const apiLogger = winston.createLogger({
    transports: [apiRotateTransport],
  });

  if (status >= 500) {
    console.log(chalk.red(`API Error: ${consoleLog}`));
    apiLogger.error(`API Error: ${method} ${url}`, logData);
  } else if (status >= 400) {
    console.log(chalk.yellow(`API Warning: ${consoleLog}`));
    apiLogger.warn(`API Warning: ${method} ${url}`, logData);
  } else {
    console.log(chalk.green(`API Request: ${consoleLog}`));
    apiLogger.info(`API Request: ${method} ${url}`, logData);
  }

  // Log détaillé pour les requêtes lentes
  if (duration > 1000) {
    logWarn(`Slow API Request: ${method} ${url} took ${duration}ms`, {
      ...logData,
      slowRequest: true,
      threshold: 1000,
    });
  }
};

// Log pour les erreurs d'API
export const logApiError = (error, req, res) => {
  const { method, url, ip } = req;
  const errorData = {
    type: "api_error",
    method,
    url,
    ip,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    timestamp: new Date().toISOString(),
  };

  logError(`API Error: ${method} ${url} - ${error.message}`, errorData);
};

// ========================================
// MÉTHODES POUR L'API DES LOGS
// ========================================

// Lire et parser un fichier de log
const readLogFile = async (filePath) => {
  try {
    const content = await fsPromises.readFile(filePath, "utf8");
    return content
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter((log) => log !== null);
  } catch (error) {
    console.error(`Erreur lecture fichier log: ${filePath}`, error);
    return [];
  }
};

// Obtenir les logs récents
export const getRecentLogs = async (limit = 100, level = null) => {
  try {
    const logFiles = await fsPromises.readdir(logDir);
    const allLogs = [];

    for (const file of logFiles) {
      if (file.endsWith(".log") && !file.includes("error-")) {
        const filePath = path.join(logDir, file);
        const logs = await readLogFile(filePath);
        allLogs.push(...logs);
      }
    }

    // Filtrer par niveau si spécifié
    let filteredLogs = allLogs;
    if (level) {
      filteredLogs = allLogs.filter((log) => log.level === level);
    }

    // Trier par timestamp et limiter
    return filteredLogs
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  } catch (error) {
    console.error("Erreur récupération logs récents:", error);
    return [];
  }
};

// Rechercher dans les logs
export const searchLogs = async (query, options = {}) => {
  try {
    const {
      level = null,
      startDate = null,
      endDate = null,
      limit = 100,
    } = options;
    const logFiles = await fsPromises.readdir(logDir);
    const allLogs = [];

    for (const file of logFiles) {
      if (file.endsWith(".log")) {
        const filePath = path.join(logDir, file);
        const logs = await readLogFile(filePath);
        allLogs.push(...logs);
      }
    }

    // Filtrer par niveau
    let filteredLogs = allLogs;
    if (level) {
      filteredLogs = allLogs.filter((log) => log.level === level);
    }

    // Filtrer par date
    if (startDate) {
      const start = new Date(startDate);
      filteredLogs = filteredLogs.filter(
        (log) => new Date(log.timestamp) >= start
      );
    }

    if (endDate) {
      const end = new Date(endDate);
      filteredLogs = filteredLogs.filter(
        (log) => new Date(log.timestamp) <= end
      );
    }

    // Rechercher dans le message et les métadonnées
    const searchResults = filteredLogs.filter((log) => {
      const searchText = JSON.stringify(log).toLowerCase();
      return searchText.includes(query.toLowerCase());
    });

    return searchResults
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  } catch (error) {
    console.error("Erreur recherche logs:", error);
    return [];
  }
};

// Obtenir les statistiques des logs
export const getLogStats = async () => {
  try {
    const logFiles = await fsPromises.readdir(logDir);
    const stats = {
      totalFiles: logFiles.filter((f) => f.endsWith(".log")).length,
      levels: {},
      types: {},
      recentActivity: {},
    };

    for (const file of logFiles) {
      if (file.endsWith(".log")) {
        const filePath = path.join(logDir, file);
        const logs = await readLogFile(filePath);

        logs.forEach((log) => {
          // Compter par niveau
          stats.levels[log.level] = (stats.levels[log.level] || 0) + 1;

          // Compter par type
          if (log.type) {
            stats.types[log.type] = (stats.types[log.type] || 0) + 1;
          }

          // Activité récente (dernières 24h)
          const logDate = new Date(log.timestamp);
          const now = new Date();
          if (now - logDate < 24 * 60 * 60 * 1000) {
            const hour = logDate.getHours();
            stats.recentActivity[hour] = (stats.recentActivity[hour] || 0) + 1;
          }
        });
      }
    }

    return stats;
  } catch (error) {
    console.error("Erreur statistiques logs:", error);
    return {};
  }
};

// Obtenir la liste des fichiers de logs
export const getLogFiles = async () => {
  try {
    const files = await fsPromises.readdir(logDir);
    return files
      .filter((file) => file.endsWith(".log"))
      .map((file) => path.join(logDir, file));
  } catch (error) {
    console.error("Erreur liste fichiers logs:", error);
    return [];
  }
};

// Nettoyer les anciens logs
export const cleanupOldLogs = async (maxAge = 24 * 60 * 60 * 1000) => {
  try {
    const files = await getLogFiles();
    const now = new Date();
    let cleanedCount = 0;

    for (const file of files) {
      const stats = await fsPromises.stat(file);
      const age = now - stats.mtime;

      if (age > maxAge) {
        await fsPromises.unlink(file);
        cleanedCount++;
        console.log(`Fichier log supprimé: ${file}`);
      }
    }

    return { cleanedCount, maxAge };
  } catch (error) {
    console.error("Erreur nettoyage logs:", error);
    throw error;
  }
};

// ========================================
// EXPORTS
// ========================================

// API simplifiée pour compatibilité
export const custom = (prefix, message, color = "blue") => {
  const colorFn = chalk[color] || chalk.white;
  const consoleMsg = colorFn(`[ ${prefix} ] ${message}`);
  console.log(consoleMsg);
  winstonLogger.info(`Custom: ${message}`, { type: "custom", prefix, color });
};

// Export par défaut avec toutes les fonctions
export default {
  // Winston logger direct
  winston: winstonLogger,

  // Helpers généraux
  sectionStart,
  summary,
  custom,
  logSuccess,
  logError,
  logWarn,
  logInfo,
  logDebug,
  logCommand,

  // Helpers API
  logApiRequest,
  logApiError,

  // Compatibilité avec l'ancien système
  success: logSuccess,
  infocmd: logCommand,
  warn: logWarn,
  error: logError,

  // Méthodes pour l'API des logs
  getRecentLogs,
  searchLogs,
  getLogStats,
  getLogFiles,
  cleanupOldLogs,
};
