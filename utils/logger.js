// utils/logger.js (ESM)
/* eslint-disable no-console */
import winston from "winston";
import "winston-daily-rotate-file";
import path from "path";
import fs from "fs";
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

const logger = winston.createLogger({
  level: "debug",
  transports: [
    dailyRotateTransport,
    errorRotateTransport,
    new winston.transports.Console({
      level: "info",
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
  exitOnError: false,
});

// Helpers ergonomiques (console + chalk)
const sectionStart = (title) => {
  console.log(chalk.cyan("\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(chalk.cyan(`┃ ${title}`));
  console.log(chalk.cyan("┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
};

const summary = (text) => {
  console.log(chalk.bold.yellow(`\n📌 Résumé : ${text}`));
};

const success = (msg) => {
  logger.info(msg);
  console.log(chalk.green(`[✔ SUCCÈS ] ${msg}`));
};

const infocmd = (msg) => {
  logger.info(msg);
  console.log(chalk.magenta(`[📡 CMD ] : ${msg}`));
};

const custom = (label, msg, color = "white") => {
  logger.info(`[${label}] ${msg}`);
  const colorFn =
    typeof chalk[color] === "function" ? chalk[color] : chalk.white;
  console.log(colorFn(`[${label}]`), msg);
};

const warn = (msg) => {
  logger.warn(msg);
  console.warn(chalk.yellow(`[⚠ WARN ] ${msg}`));
};

const error = (msg) => {
  logger.error(msg);
  console.error(chalk.red(`[✖ ERROR ] ${msg}`));
};

// API classique
const logInfo = (msg, meta = {}) => logger.info(msg, meta);
const logError = (msg, meta = {}) => logger.error(msg, meta);
const logDebug = (msg, meta = {}) => logger.debug(msg, meta);
const logWarn = (msg, meta = {}) => logger.warn(msg, meta);

export default {
  logger,
  logInfo,
  logError,
  logDebug,
  logWarn,
  sectionStart,
  summary,
  success,
  infocmd,
  custom,
  warn,
  error,
};

