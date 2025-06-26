// utils/logger.js (ESM)
import winston from "winston";
import chalk from "chalk";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.printf(({ level, message }) => {
    return `[${level.toUpperCase()}] : ${message}`;
  }),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/bot.log" }),
  ],
});

logger.success = (msg) => console.log(chalk.green(`[✔ SUCCÈS ] ${msg}`));
logger.infocmd = (msg) => console.log(chalk.magenta(`[📡 CMD ] : ${msg}`));
logger.warn = (msg) => console.log(chalk.yellow(`[ ⚠ AVERTISSEMENT ] ${msg}`));
logger.error = (msg) => console.error(chalk.red(`[✖ ERREUR ] ${msg}`));
logger.custom = (prefix, msg, color = "blue") => {
  const colorFn = chalk[color] || chalk.white;
  console.log(colorFn(`[ ${prefix} ] ${msg}`));
};
logger.section = (sectionName) => {
  const separator = "═".repeat(50);
  console.log(chalk.blue(`\n${separator}`));
  console.log(chalk.blue.bold(`Chargement de la section : ${sectionName}`));
  console.log(chalk.blue(`${separator}`));
};
logger.sectionWithContent = (sectionName, content) => {
  const separator = "═".repeat(50);
  console.log(chalk.blue(`\n${separator}`));
  console.log(chalk.blue.bold(`Chargement de la section : ${sectionName}`));
  console.log(chalk.blue(`${separator}`));
  content.forEach((line) => console.log(line));
};

logger.summary = (label, success, failure) => {
  logger.info(`[ RÉSUMÉ ] ${label} - Chargés: ${success}, Échecs: ${failure}`);
};

export default logger; // ← n'oublie pas celui-là !;
