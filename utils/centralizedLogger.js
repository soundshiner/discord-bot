import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

const logDir = path.resolve('logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Format JSON compatible Loki
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    // On produit un JSON par ligne (log line)
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    });
  })
);

// Transport pour rotation quotidienne
const dailyRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxFiles: '14d',  // conserve 14 jours de logs
  maxSize: '20m',
  level: 'debug',
  format: jsonFormat
});

const errorRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxFiles: '30d', // plus long pour erreurs critiques
  maxSize: '20m',
  level: 'error',
  format: jsonFormat
});

// Logger Winston principal
const logger = winston.createLogger({
  level: 'debug',
  transports: [
    dailyRotateTransport,
    errorRotateTransport,
    new winston.transports.Console({
      level: 'info',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
  exitOnError: false
});

// Exemples d’API simplifiée
export const logInfo = (msg, meta = {}) => logger.info(msg, meta);
export const logError = (msg, meta = {}) => logger.error(msg, meta);
export const logDebug = (msg, meta = {}) => logger.debug(msg, meta);
export const logWarn = (msg, meta = {}) => logger.warn(msg, meta);

export default logger;
