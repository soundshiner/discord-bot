// ========================================
// config/logger.js - Configuration du logger performant
// ========================================

export const LOGGER_CONFIG = {
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
    directory: process.env.LOG_DIRECTORY || "./logs",
    maxSize: parseInt(process.env.LOG_MAX_SIZE) || 10 * 1024 * 1024, // 10MB
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
    compress: process.env.LOG_COMPRESS !== "false",
    retention: parseInt(process.env.LOG_RETENTION_DAYS) || 30, // jours
  },

  // Performance
  batch: {
    enabled: process.env.LOG_BATCH !== "false",
    size: parseInt(process.env.LOG_BATCH_SIZE) || 10,
    timeout: parseInt(process.env.LOG_BATCH_TIMEOUT) || 1000, // ms
  },

  // Formatage
  format: {
    timestamp: process.env.LOG_TIMESTAMP !== "false",
    colors: process.env.NODE_ENV !== "production",
    structured: process.env.NODE_ENV === "production",
    includeMemory: process.env.LOG_INCLUDE_MEMORY === "true",
    includePid: process.env.LOG_INCLUDE_PID !== "false",
  },

  // Filtrage
  filter: {
    enabled: process.env.LOG_FILTER === "true",
    excludePatterns: [/password/i, /token/i, /secret/i, /key/i],
    includeOnly: process.env.LOG_INCLUDE_ONLY?.split(",") || null,
  },

  // Métriques
  metrics: {
    enabled: process.env.LOG_METRICS !== "false",
    interval: parseInt(process.env.LOG_METRICS_INTERVAL) || 60000, // 1 minute
    exportToFile: process.env.LOG_METRICS_EXPORT === "true",
  },

  // Alertes
  alerts: {
    enabled: process.env.LOG_ALERTS === "true",
    errorThreshold: parseInt(process.env.LOG_ERROR_THRESHOLD) || 10,
    warningThreshold: parseInt(process.env.LOG_WARNING_THRESHOLD) || 50,
    timeWindow: parseInt(process.env.LOG_ALERT_WINDOW) || 60000, // 1 minute
  },
};

// Variables d'environnement pour le logger
export const LOG_ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  LOG_TO_FILE: process.env.LOG_TO_FILE === "true",
  LOG_STRUCTURED: process.env.LOG_STRUCTURED === "true",
  LOG_COLORS: process.env.LOG_COLORS !== "false",
};

// Configuration par environnement
export const ENV_CONFIGS = {
  development: {
    file: { enabled: false },
    format: { colors: true, structured: false },
    batch: { enabled: false },
  },

  production: {
    file: { enabled: true },
    format: { colors: false, structured: true },
    batch: { enabled: true },
  },

  test: {
    file: { enabled: false },
    format: { colors: false, structured: true },
    batch: { enabled: false },
  },
};

export default LOGGER_CONFIG;
